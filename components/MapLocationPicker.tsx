import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export type SelectedLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: SelectedLocation) => void;
  title: string;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

// Default Cebu City region
const DEFAULT_REGION = {
  latitude: 10.3157,
  longitude: 123.8854,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  title,
  initialRegion = DEFAULT_REGION,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedPin, setSelectedPin] = useState<SelectedLocation | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(initialRegion);

  const googleApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  (Constants.expoConfig?.extra as { googleMapsApiKey?: string })?.googleMapsApiKey ||
  '';

  // Reverse geocode coordinates to get address name
  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<string> => {
      if (!googleApiKey) {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          // Try to get a readable address
          const result = data.results[0];
          
          // Prefer the formatted address or address component
          if (result.formatted_address) {
            // Extract just the main location name (first part of address)
            const parts = result.formatted_address.split(',');
            return parts[0]?.trim() || `Pin at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }
        }

        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    },
    [googleApiKey],
  );

  // Handle map press to place a marker
  const handleMapPress = useCallback(
    async (e: any) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;

      setIsReverseGeocoding(true);
      const locationName = await reverseGeocode(latitude, longitude);
      
      setSelectedPin({
        name: locationName,
        latitude,
        longitude,
      });
      setIsReverseGeocoding(false);
    },
    [reverseGeocode],
  );

  // Handle confirmation of selected location
  const handleConfirmSelection = () => {
    if (selectedPin) {
      onSelectLocation(selectedPin);
      setSelectedPin(null);
      onClose();
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedPin(null);
    onClose();
  };

  // Update region when initialRegion changes
  useEffect(() => {
    setCurrentRegion(initialRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(initialRegion, 500);
    }
  }, [initialRegion]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center bg-primary px-4 py-4 pt-8">
          <Text className="text-white text-lg font-bold flex-1">{title}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View className="flex-1">
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {selectedPin && (
              <Marker
                coordinate={{
                  latitude: selectedPin.latitude,
                  longitude: selectedPin.longitude,
                }}
                title="Selected Location"
                description={selectedPin.name}
                pinColor="#8D5C8A"
              />
            )}
          </MapView>

          {/* Info overlay at bottom */}
          {selectedPin && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-primary p-4 rounded-t-3xl">
              <Text className="text-sm text-gray-600 mb-2">Selected Location:</Text>
              <Text className="text-base font-semibold text-dark mb-4">
                {isReverseGeocoding ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#8D5C8A" />
                    <Text className="ml-2">Getting location name...</Text>
                  </View>
                ) : (
                  selectedPin.name
                )}
              </Text>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gray-300 rounded-lg py-3"
                >
                  <Text className="text-dark text-center font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmSelection}
                  disabled={isReverseGeocoding}
                  className={`flex-1 rounded-lg py-3 ${
                    isReverseGeocoding ? 'bg-primary/50' : 'bg-primary'
                  }`}
                >
                  <Text className="text-white text-center font-semibold">
                    {isReverseGeocoding ? 'Loading...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Help text when no pin selected */}
          {!selectedPin && (
            <View className="absolute bottom-8 left-0 right-0 bg-black/70 mx-4 rounded-lg p-4">
              <Text className="text-white text-center font-semibold">
                Tap on the map to select a location
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MapLocationPicker;
