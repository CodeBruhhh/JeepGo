import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

type RouteSegment = {
  coords: LatLng[];
  mode: 'WALKING' | 'TRANSIT';
};

const MapScreen = () => {
  const { lat, lng, name } = useLocalSearchParams<{
    lat: string;
    lng: string;
    name: string;
  }>();

  const destLat = Number(lat);
  const destLng = Number(lng);
  const destination: LatLng = { latitude: destLat, longitude: destLng };

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset route segments when destination changes
  useEffect(() => {
    setRouteSegments([]);
    setLoading(true);
  }, [lat, lng]);

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        setLoading(false);
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not get your location.');
        setLoading(false);
      }
    })();
  }, []);

  // Fetch directions and separate walking/transit segments
  useEffect(() => {
    if (!userLocation) return;
    
    const fetchDirections = async () => {
      try {
        const resp = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.latitude},${destination.longitude}&mode=transit&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await resp.json();
        
        if (data.routes?.length) {
          const route = data.routes[0];
          const segments: RouteSegment[] = [];
          
          // Parse each step to determine if it's walking or transit
          route.legs[0].steps.forEach((step: any) => {
            const coords = decodePolyline(step.polyline.points);
            const mode = step.travel_mode === 'WALKING' ? 'WALKING' : 'TRANSIT';
            segments.push({ coords, mode });
          });
          
          setRouteSegments(segments);
        }
      } catch (err) {
        console.error(err);
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
        <Text className="mt-2 text-gray-600">Loading map and directions...</Text>
      </View>
    );
  }

  const safeLatDelta = Math.abs(userLocation.latitude - destLat) * 2.5 || 0.05;
  const safeLngDelta = Math.abs(userLocation.longitude - destLng) * 2.5 || 0.05;

  return (
    <View className="flex-1">
      <MapView
        key={`${destLat}-${destLng}`} // Force re-render when destination changes
        style={styles.map}
        initialRegion={{
          latitude: (userLocation.latitude + destLat) / 2,
          longitude: (userLocation.longitude + destLng) / 2,
          latitudeDelta: safeLatDelta,
          longitudeDelta: safeLngDelta,
        }}
      >
        <Marker coordinate={userLocation} title="You are here" pinColor="blue" />
        <Marker coordinate={destination} title={name || 'Destination'} pinColor="red" />
        
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

      {/* Back button overlay */}
      <TouchableOpacity
        className="absolute top-6 left-4 bg-black/50 p-3 rounded-full z-50"
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default MapScreen;

// --- Helper: decode polyline ---
function decodePolyline(encoded: string): LatLng[] {
  let points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});