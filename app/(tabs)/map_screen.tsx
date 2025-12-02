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

  // Reset route segments when destination changes
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
    if (!userLocation) return;
    
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
  }, [userLocation, destLat, destLng]); // Add destination as dependencies

  if (loading || !userLocation) {
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
        
        {/* Render each segment with appropriate color */}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={index}
            coordinates={segment.coords}
            strokeWidth={segment.mode === 'WALKING' ? 3 : 4}
            strokeColor={segment.mode === 'WALKING' ? '#808080' : '#996FD6'}
            lineDashPattern={segment.mode === 'WALKING' ? [10, 5] : undefined}
          />
        ))}
      </MapView>

      <TouchableOpacity
        className="absolute top-12 left-4 bg-white p-3 rounded-full z-50"
        style={styles.shadow}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
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