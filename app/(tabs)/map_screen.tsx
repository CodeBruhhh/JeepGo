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
        top: 100,
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
      setLoading(false);
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
            top: 100,
            right: 50,
            bottom: SCREEN_HEIGHT * 0.6,
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
    if (!stopLocation || !userLocation) {
      Alert.alert('Error', 'Please select a jeep route first.');
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        Alert.alert('Error', 'Could not get user info.');
        return;
      }

      const passengerId = userData.user.id;

      console.log('Creating ride request with:', {
        passenger_id: passengerId,
        driver_id: driverId,
        from_x: userLocation.latitude,
        from_y: userLocation.longitude,
        to_x: stopLocation.latitude,
        to_y: stopLocation.longitude,
        status: 'pending',
        destination_name: stopLocationName,
      });

      const { data, error } = await supabase
        .from('ride_requests')
        .insert({
          passenger_id: passengerId,
          driver_id: driverId,
          from_x: userLocation.latitude,
          from_y: userLocation.longitude,
          to_x: stopLocation.latitude,
          to_y: stopLocation.longitude,
          status: 'pending',
          destination_name: stopLocationName,
        })
        .select('*')
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        Alert.alert('Error', 'Failed to create ride request.');
        console.error('Insert error:', error);
        return;
      }

      if (!data || !data.request_id) {
        Alert.alert('Error', 'Failed to get ride ID.');
        console.error('No data returned:', data);
        return;
      }

      const requestId = data.request_id;
      console.log('Created ride with ID:', requestId);

      // Route to ride tracking screen
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
    <View className="flex-1">
      <MapView
        ref={mapRef}
        key={mapKey}
        style={styles.map}
        initialRegion={getInitialRegion()}
      >
        {userLocation && !locationError && (
          <Marker coordinate={userLocation} title="You are here" pinColor="blue" />
        )}
        {destination && (
          <Marker coordinate={destination} title={destinationName || 'Destination'} pinColor="red" />
        )}
        
        {routes.map((route, routeIndex) => (
          <React.Fragment key={routeIndex}>
            {route.segments.map((segment, segmentIndex) => (
              <Polyline
                key={`${routeIndex}-${segmentIndex}`}
                coordinates={segment.coords}
                strokeWidth={segment.mode === 'WALKING' ? 3 : (routeIndex === selectedRouteIndex ? 4 : 3)}
                strokeColor={
                  routeIndex === selectedRouteIndex
                    ? (segment.mode === 'WALKING' ? '#808080' : '#996FD6')
                    : '#D4C5A9'
                }
                lineDashPattern={segment.mode === 'WALKING' ? [10, 5] : undefined}
                zIndex={routeIndex === selectedRouteIndex ? 2 : 1}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Show filtered drivers when jeep code is clicked */}
        {showDrivers && filteredDrivers.map((driver) => (
          <Marker
            key={driver.driver_id}
            coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
            title={`${driver.jeep_code} - Tap to book`}
            onPress={() => handleBookRide(driver.driver_id)}
          >
            <View className="bg-white rounded-full p-2 border-2 border-[#996FD6]">
              <Image source={require('@/assets/images/jeep_icon.png')} className='w-5 h-5'/>
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity
        className="absolute top-12 left-4 bg-white p-3 rounded-full z-50"
        style={styles.shadow}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      {/* Show active filter badge */}
      {showDrivers && selectedJeepCode && (
        <View className="absolute top-12 right-4 bg-[#996FD6] px-4 py-2 rounded-full z-50 flex-row items-center" style={styles.shadow}>
          <Text className="text-white font-bold mr-2">{selectedJeepCode}</Text>
          <TouchableOpacity onPress={() => {
            setShowDrivers(false);
            setFilteredDrivers([]);
            setSelectedJeepCode(null);
            centerMapToRoute();
          }}>
            <Ionicons name="close-circle" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {locationError && (
        <View
          className="absolute top-24 left-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-3 z-40"
          style={styles.shadow}
        >
          <Text className="text-yellow-800 text-sm">
            ⚠️ Could not get your location. Set starting point manually.
          </Text>
        </View>
      )}

      {modalVisible && (
        <View
          className="w-[80%] absolute top-2 right-2 bg-white rounded-3xl z-40 border border-[#996FD6]"
          style={styles.shadow}
        >
          <View className="p-2">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-2 py-1 mb-2">
              <Ionicons name="location" size={20} color="#550CBF" />
              <TextInput
                placeholder="From"
                value={fromQuery}
                onChangeText={(text) => searchPlaces(text, 'from')}
                onFocus={() => setActiveInput('from')}
                className="flex-1 ml-3 text-sm"
                style={{ color: 'black' }}
              />
              {fromQuery !== 'Your Location' && fromQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setFromQuery('Your Location');
                    setPredictions([]);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row items-center bg-gray-100 rounded-lg px-2 py-2">
              <Ionicons name="location" size={20} color="#ff4444" />
              <TextInput
                placeholder="To"
                value={toQuery}
                onChangeText={(text) => searchPlaces(text, 'to')}
                onFocus={() => setActiveInput('to')}
                className="flex-1 ml-3 text-sm"
                style={{ color: 'black' }}
              />
              {toQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setToQuery('');
                    setPredictions([]);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {predictions.length > 0 && (
            <View className="max-h-[300] border-t border-gray-200">
              {searchLoading ? (
                <ActivityIndicator size="small" className="py-4" />
              ) : (
                <FlatList
                  data={predictions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="flex-row items-center px-4 py-3 border-b border-gray-100"
                      onPress={() => selectPlace(item.place_id, activeInput)}
                    >
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-medium">
                          {item.structured_formatting?.main_text}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {item.structured_formatting?.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
        </View>
      )}

      {loading && destination && userLocation && (
        <View
          className="absolute bottom-10 self-center bg-white px-6 py-3 rounded-full z-40 flex-row items-center"
          style={styles.shadow}
        >
          <ActivityIndicator size="small" color="#550CBF" />
          <Text className="ml-2 text-gray-700">Getting directions...</Text>
        </View>
      )}

      {routes.length > 0 && !loading && (
        <Animated.View
          style={[
            styles.draggableModal,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} className="py-3 items-center">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          <View className="px-4 pb-4">
            <Text className="text-lg font-bold mb-3">Route Options</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {routes.map((route, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedRouteIndex(index)}
                  className={`mr-3 px-4 py-2 rounded-full ${
                    index === selectedRouteIndex ? 'bg-[#996FD6]' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      index === selectedRouteIndex ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Route {index + 1}
                  </Text>
                  <Text
                    className={`text-xs ${
                      index === selectedRouteIndex ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {route.duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-base font-bold mb-2">
              {showDrivers ? `Available Drivers (${filteredDrivers.length})` : 'Route Details - Tap jeep to find drivers'}
            </Text>
            <ScrollView
              style={{ maxHeight: SCREEN_HEIGHT * 0.3 }}
              showsVerticalScrollIndicator={true}
            >
              {routes[selectedRouteIndex].segments.map((segment, index) => {
                if (segment.mode === 'TRANSIT' && segment.transitDetails) {
                  const { line, departure_stop, arrival_stop, num_stops } = segment.transitDetails;
                  return (
                    <TouchableOpacity
                      key={index}
                      className="mb-3 pb-3 border-b border-gray-200 px-3 py-2 rounded-lg bg-[#F5F3FF] active:bg-[#EDE9FE]"
                      onPress={() => handleJeepCodeClick(line.short_name || line.name, segment)}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center">
                          <Ionicons name="bus" size={20} color="#550CBF" />
                          <Text className="text-base font-bold ml-2 text-[#550CBF]">
                            {line.short_name || line.name || 'Bus/Jeep'}
                          </Text>
                        </View>
                        <Text className="text-xs text-[#996FD6] font-semibold">Tap to find drivers</Text>
                      </View>
                      <Text className="text-sm text-gray-600 ml-7">
                        From: {departure_stop?.name || 'Starting point'}
                      </Text>
                      <Text className="text-sm text-gray-600 ml-7">
                        To: {arrival_stop?.name || 'Destination'}
                      </Text>
                      {num_stops && (
                        <Text className="text-xs text-gray-500 ml-7 mt-1">
                          {num_stops} stops
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                } else if (segment.mode === 'WALKING') {
                  return (
                    <View key={index} className="mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="walk" size={18} color="#808080" />
                        <Text className="text-sm text-gray-600 ml-2">Walk to next stop</Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })}
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default MapScreen;

function decodePolyline(encoded: string): LatLng[] {
  let points: LatLng[] = [];
  let index = 0,
    lat = 0,
    lng = 0;
  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  draggableModal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: SCREEN_HEIGHT,
  },
});