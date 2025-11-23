import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_TRANSLATE = SCREEN_HEIGHT * 0.5;
const MIN_TRANSLATE = SCREEN_HEIGHT * 0.85;

type RouteSegment = {
  coords: LatLng[];
  mode: 'WALKING' | 'TRANSIT';
  transitDetails?: {
    line: {
      short_name?: string;
      name?: string;
      vehicle?: {
        type: string;
        name?: string;
      };
    };
    departure_stop?: {
      name: string;
    };
    arrival_stop?: {
      name: string;
    };
    num_stops?: number;
  };
};

type Route = {
  segments: RouteSegment[];
  duration: string;
  summary: string;
};

type PlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

type Driver = {
  driver_id: string;
  latitude: number;
  longitude: number;
  jeep_code: string;
};

const MapScreen = () => {
  const { lat, lng, name } = useLocalSearchParams<{
    lat: string;
    lng: string;
    name: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(
    lat && lng ? { latitude: Number(lat), longitude: Number(lng) } : null
  );
  const [destinationName, setDestinationName] = useState(name || '');
  const [stopLocation, setStopLocation] = useState<LatLng | null>(null);
  const [stopLocationName, setStopLocationName] = useState(name || '');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  const [modalVisible, setModalVisible] = useState(true);
  const [fromQuery, setFromQuery] = useState('Your Location');
  const [toQuery, setToQuery] = useState(name || '');
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('to');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useRef(new Animated.Value(MIN_TRANSLATE)).current;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [selectedJeepCode, setSelectedJeepCode] = useState<string | null>(null);
  const [showDrivers, setShowDrivers] = useState(false);

  // Add key to force refresh
  const [mapKey, setMapKey] = useState(0);

  // Reset state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset driver selection state when returning to this screen
      setShowDrivers(false);
      setFilteredDrivers([]);
      setSelectedJeepCode(null);

      return () => {
        // Clean up debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = MIN_TRANSLATE + gestureState.dy;
        if (newY >= MAX_TRANSLATE && newY <= MIN_TRANSLATE) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = MIN_TRANSLATE + gestureState.dy;
        const midPoint = (MAX_TRANSLATE + MIN_TRANSLATE) / 2;

        if (currentY < midPoint) {
          Animated.spring(translateY, {
            toValue: MAX_TRANSLATE,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        } else {
          Animated.spring(translateY, {
            toValue: MIN_TRANSLATE,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const centerMapToRoute = () => {
    if (mapRef.current && userLocation && destination) {
      const coordinates = [userLocation, destination];
      
      const edgePadding = {
        top: 10,
        right: 50,
        bottom: SCREEN_HEIGHT * 0.5,
        left: 50,
      };

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding,
        animated: true,
      });
    }
  };

  // Handle params changes - refresh map and fields
  useEffect(() => {
    if (lat && lng) {
      const newDestination = { latitude: Number(lat), longitude: Number(lng) };
      setDestination(newDestination);
      setDestinationName(name || '');
      setToQuery(name || '');
      setMapKey(prev => prev + 1); // Force map refresh
    }
  }, [lat, lng, name]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        setLoading(false);
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationError(false);
      } catch (err) {
        console.error('Location error:', err);
        setLocationError(true);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!userLocation || !destination) {
      setLoading(true);
      return;
    }

    const fetchDirections = async () => {
      setLoading(true);
      try {
        const resp = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.latitude},${destination.longitude}&mode=transit&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await resp.json();

        if (data.routes?.length) {
          const parsedRoutes: Route[] = data.routes.map((route: any) => {
            const segments: RouteSegment[] = [];

            route.legs[0].steps.forEach((step: any) => {
              const coords = decodePolyline(step.polyline.points);
              const mode = step.travel_mode === 'WALKING' ? 'WALKING' : 'TRANSIT';
              
              const segment: RouteSegment = {
                coords,
                mode,
              };

              if (step.transit_details) {
                segment.transitDetails = {
                  line: {
                    short_name: step.transit_details.line.short_name,
                    name: step.transit_details.line.name,
                    vehicle: step.transit_details.line.vehicle,
                  },
                  departure_stop: step.transit_details.departure_stop,
                  arrival_stop: step.transit_details.arrival_stop,
                  num_stops: step.transit_details.num_stops,
                };
              }

              segments.push(segment);
            });

            return {
              segments,
              duration: route.legs[0].duration.text,
              summary: route.summary || 'Route',
            };
          });

          setRoutes(parsedRoutes);
          setSelectedRouteIndex(0);
          
          setTimeout(() => {
            centerMapToRoute();
          }, 500);
          
          Animated.spring(translateY, {
            toValue: MAX_TRANSLATE,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      } catch (err) {
        console.error('Directions error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDirections();
  }, [userLocation, destination]);

  useEffect(() => {
    if (userLocation && destination && routes.length > 0) {
      setTimeout(() => {
        centerMapToRoute();
      }, 300);
    }
  }, [userLocation, destination]);

  const searchPlaces = async (text: string, inputType: 'from' | 'to') => {
    setActiveInput(inputType);

    if (inputType === 'from') {
      setFromQuery(text);
    } else {
      setToQuery(text);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.status === 'OK') {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  const selectPlace = async (placeId: string, inputType: 'from' | 'to') => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const place = data.result;
        const location = place.geometry.location;

        if (inputType === 'from') {
          setUserLocation({ latitude: location.lat, longitude: location.lng });
          setFromQuery(place.name);
          setLocationError(false);
        } else {
          setDestination({ latitude: location.lat, longitude: location.lng });
          setDestinationName(place.name);
          setToQuery(place.name);
        }

        setPredictions([]);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Error selecting place:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('driver_id, latitude, longitude, jeep_code')
        .eq('status', 'available');

      if (error) {
        console.error('Error fetching drivers:', error);
        return;
      }

      setDrivers(data || []);
    } catch (err) {
      console.error('Fetch drivers error:', err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleJeepCodeClick = async (jeepCode: string | undefined, segment?: RouteSegment) => {
    if (!jeepCode) return;

    try {
      // Reset previous state
      setShowDrivers(false);
      setFilteredDrivers([]);

      // Capture the arrival stop location from the segment's transit details
      if (segment?.transitDetails?.arrival_stop) {
        const arrivalStop = segment.transitDetails.arrival_stop;
        console.log('Arrival stop data:', arrivalStop);
        
        // The arrival stop location should be in the last coordinate of the segment
        if (segment.coords && segment.coords.length > 0) {
          const stopLoc = segment.coords[segment.coords.length - 1];
          setStopLocation(stopLoc);
          setStopLocationName(arrivalStop.name || 'Drop-off point');
          console.log('Set stop location to:', stopLoc, 'with name:', arrivalStop.name);
        }
      }

      const { data, error } = await supabase
        .from('drivers')
        .select('driver_id, latitude, longitude, jeep_code')
        .eq('jeep_code', jeepCode)
        .eq('is_online', 'true');

      if (error) {
        console.error('Error fetching drivers:', error);
        Alert.alert('Error', 'Failed to fetch available drivers.');
        return;
      }

      if (!data || data.length === 0) {
        Alert.alert('Sorry', 'No drivers available for this route.');
        setShowDrivers(false);
        setFilteredDrivers([]);
        setSelectedJeepCode(null);
        return;
      }

      setFilteredDrivers(data);
      setSelectedJeepCode(jeepCode);
      setShowDrivers(true);

      // Center map to show drivers
      if (mapRef.current && data.length > 0) {
        const coordinates = data.map(d => ({
          latitude: d.latitude,
          longitude: d.longitude,
        }));

        if (userLocation) {
          coordinates.push(userLocation);
        }

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 250,
            right: 50,
            bottom: SCREEN_HEIGHT * 0.4,
            left: 50,
          },
          animated: true,
        });
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Something went wrong.');
      setShowDrivers(false);
      setFilteredDrivers([]);
      setSelectedJeepCode(null);
    }
  };

  const handleBookRide = async (driverId: string) => {
    // Safely extract coordinates
    const userLat = userLocation?.latitude;
    const userLng = userLocation?.longitude;
    const stopLat = stopLocation?.latitude;
    const stopLng = stopLocation?.longitude;

    if (!userLat || !userLng || !stopLat || !stopLng) {
    Alert.alert('Error', 'Please select a jeep route first.');
    return;
    }

    try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || !userData.user.id) {
    Alert.alert('Error', 'Could not get user info.');
    return;
    }
    const passengerId = userData.user.id;

    console.log('Creating ride request with:', {
      passenger_id: passengerId,
      driver_id: driverId,
      from_x: userLat,
      from_y: userLng,
      to_x: stopLat,
      to_y: stopLng,
      status: 'pending',
      destination_name: stopLocationName,
    });

    // Insert ride request
    const { data, error } = await supabase
      .from('ride_requests')
      .insert({
        passenger_id: passengerId,
        driver_id: driverId,
        from_x: userLat,
        from_y: userLng,
        to_x: stopLat,
        to_y: stopLng,
        status: 'pending',
        destination_name: stopLocationName || 'Destination',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Insert error:', error);
      Alert.alert('Error', 'Failed to create ride request.');
      return;
    }

    if (!data || typeof data.request_id === 'undefined') {
      console.error('No data returned:', data);
      Alert.alert('Error', 'Failed to get ride ID.');
      return;
    }

    const requestId = data.request_id;
    console.log('Created ride with ID:', requestId);

    // Navigate safely
    try {
      router.push({
        pathname: '/ride_tracking',
        params: {
          requestId: requestId.toString(),
          driverId: driverId.toString(),
          userLat: userLocation.latitude.toString(),
          userLng: userLocation.longitude.toString(),
          lat: stopLocation.latitude.toString(),
          lng: stopLocation.longitude.toString(),
          name: stopLocationName,
        },
      });
    } catch (navError) {
      console.error('Navigation error:', navError);
      Alert.alert('Error', 'Could not navigate to ride tracking.');
    }


    } catch (err) {
    console.error('Booking error:', err);
    Alert.alert('Error', 'Something went wrong.');
    }
  };


  const getInitialRegion = () => {
    if (userLocation && destination) {
      const midLat = (userLocation.latitude + destination.latitude) / 2;
      const midLng = (userLocation.longitude + destination.longitude) / 2;
      const latDelta = Math.abs(userLocation.latitude - destination.latitude) * 2 || 0.05;
      const lngDelta = Math.abs(userLocation.longitude - destination.longitude) * 2 || 0.05;

      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    } else if (destination) {
      return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } else if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  if (loading && !destination) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#550CBF" />
        <Text className="mt-2 text-gray-600">Loading map...</Text>
      </View>
    );
  }

  return (
    <View className='flex-1 items-center bg-white'>
      <Text className='text-xl font-bold'>Map Screen</Text>
      <MapComponent style={{ height: 400, width: '100%' }} />
    </View>
  )
}

export default map_screen