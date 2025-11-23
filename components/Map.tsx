import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MapComponentProps {
  showMarker?: boolean;
  showUserLocation?: boolean;
  showMyLocationButton?: boolean;
  showCompass?: boolean;
  initialDelta?: number;
  style?: ViewStyle;
  onLocationChange?: (coords: Location.LocationObjectCoords) => void;
  onRegionChange?: (region: Region) => void;
}

export default function MapComponent({
  showMarker = true,
  showUserLocation = true,
  showMyLocationButton = true,
  showCompass = true,
  initialDelta = 0.01,
  style,
  onLocationChange,
  onRegionChange,
}: MapComponentProps) {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to show your position on the map.'
          );
          setLoading(false);
          return;
        }

        // Get current location
        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const coords = userLocation.coords;
        setLocation(coords);
        
        const newRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: initialDelta,
          longitudeDelta: initialDelta,
        };
        
        setRegion(newRegion);
        
        // Call callbacks if provided
        if (onLocationChange) onLocationChange(coords);
        if (onRegionChange) onRegionChange(newRegion);
        
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get your location. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialDelta, onLocationChange, onRegionChange]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Fallback to a default location if user denies permission
  const defaultRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region || defaultRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showMyLocationButton}
        showsCompass={showCompass}
        onRegionChangeComplete={(newRegion) => {
          if (onRegionChange) onRegionChange(newRegion);
        }}
      >
        {showMarker && location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
            description={`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});