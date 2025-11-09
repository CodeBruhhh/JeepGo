import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const userLocation = await Location.getCurrentPositionAsync({});
      const coords = userLocation.coords;
      setLocation(coords);
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  if (!region || !location)
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View className="flex-1">
      <MapView
        className="flex-1"
        region={region}
        showsUserLocation
        followsUserLocation
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You are here"
        />
      </MapView>
    </View>
  );
}
