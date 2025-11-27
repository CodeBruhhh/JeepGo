import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

import { citUToEmallRoute } from '@/assets/routes/citu-to-emall';
import { route01CPrivateToColon } from '@/assets/routes/route-01c-private-to-colon';

const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Parkmall: { lat: 10.3241, lng: 123.9229 },
  Urgello: { lat: 10.3001, lng: 123.889 },
  Capitol: { lat: 10.311, lng: 123.896 },
  Ayala: { lat: 10.3187, lng: 123.9051 },
  Colon: { lat: 10.2969, lng: 123.9036 },
  Talamban: { lat: 10.3586, lng: 123.913 },
  Mabolo: { lat: 10.3248, lng: 123.9184 },
  Carbon: { lat: 10.2945, lng: 123.9034 },
  CSBT: { lat: 10.3049, lng: 123.9005 },
  'CIT University': { lat: 10.2998, lng: 123.8893 },
  'Elizabeth Mall': { lat: 10.2975, lng: 123.9038 },
  'USC Private': { lat: 10.2986, lng: 123.8999 },
  'Fuente Osmeña': { lat: 10.3104, lng: 123.8931 },
  'Cebu City Hall': { lat: 10.2931, lng: 123.9021 },
  "Magellan's Cross": { lat: 10.2922, lng: 123.9033 },
  'Pier 1': { lat: 10.2942, lng: 123.9058 },
  'Pier 3': { lat: 10.3045, lng: 123.9119 },
  'Cebu Business Park': { lat: 10.318, lng: 123.9059 },
  'SM City Cebu': { lat: 10.3111, lng: 123.918 },
  'Banilad Town Center': { lat: 10.351, lng: 123.9131 },
  'Talamban Proper': { lat: 10.3618, lng: 123.915 },
  'Cebu IT Park': { lat: 10.3309, lng: 123.9043 },
  'Rizal Museum': { lat: 10.2933, lng: 123.9027 },
  'Basilica Minore': { lat: 10.2928, lng: 123.9023 },
  'E-Mall Entrance': { lat: 10.2978, lng: 123.9035 },
};

const geoJsonLineToPolyline = (geoJson: any) => {
  const lineString = geoJson?.features?.find((feature: any) => feature.geometry?.type === 'LineString');
  if (!lineString) return [];

  return lineString.geometry.coordinates.map((coord: number[]) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));
};

const ROUTE_OPTIONS = [
  {
    code: '01C',
    label: '01C - Private to Colon',
    stops: [
      'USC Private',
      'Elizabeth Mall',
      'CIT University',
      'Urgello',
      'Fuente Osmeña',
      'Capitol',
      'Cebu City Hall',
      "Magellan's Cross",
      'Colon',
      'Pier 1',
    ],
    polyline: geoJsonLineToPolyline(route01CPrivateToColon),
  },
  {
    code: '01K',
    label: '01K - Urgello to Parkmall',
    stops: [
      'Urgello',
      'CIT University',
      'USC Private',
      'Fuente Osmeña',
      'Ayala',
      'Cebu Business Park',
      'SM City Cebu',
      'Mabolo',
      'Banilad Town Center',
      'Parkmall',
    ],
    polyline: [
      { latitude: 10.3001, longitude: 123.889 },
      { latitude: 10.311, longitude: 123.896 },
      { latitude: 10.3187, longitude: 123.9051 },
      { latitude: 10.3241, longitude: 123.9229 },
    ],
  },
  {
    code: '02B',
    label: '02B - CSBT to Colon',
    stops: [
      'CSBT',
      'Elizabeth Mall',
      'CIT University',
      'Urgello',
      'Fuente Osmeña',
      'Cebu City Hall',
      "Magellan's Cross",
      'Basilica Minore',
      'Colon',
      'Pier 3',
    ],
  },
  {
    code: '03A',
    label: '03A - Mabolo to Carbon',
    stops: [
      'Mabolo',
      'SM City Cebu',
      'Ayala',
      'Cebu Business Park',
      'Fuente Osmeña',
      'Cebu City Hall',
      'Rizal Museum',
      'Basilica Minore',
      'Carbon',
      'Pier 1',
    ],
  },
  {
    code: '06B',
    label: '06B - Talamban to Colon',
    stops: [
      'Talamban',
      'Talamban Proper',
      'Banilad Town Center',
      'Cebu IT Park',
      'Ayala',
      'Fuente Osmeña',
      'Capitol',
      'Cebu City Hall',
      'Colon',
      'Pier 3',
    ],
  },
  {
    code: '69B',
    label: '69B - CIT-U to E-mall',
    stops: [
      'CIT University',
      'Urgello',
      'USC Private',
      'Fuente Osmeña',
      'Capitol',
      'Cebu City Hall',
      "Magellan's Cross",
      'Carbon',
      'Elizabeth Mall',
      'E-Mall Entrance',
    ],
    polyline: geoJsonLineToPolyline(citUToEmallRoute),
  },
];

const FILTER_OPTIONS = ['All Stops (Manual)', ...ROUTE_OPTIONS.map((route) => route.label)];
const DEFAULT_STOPS = Object.keys(LOCATION_COORDINATES);
const PASSENGER_TYPES = ['Regular', 'Student', 'Senior', 'PWD'];

const fares = () => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [passengerType, setPassengerType] = useState('Regular');
  const [calculatedFare, setCalculatedFare] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showPassengerPicker, setShowPassengerPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [availableStops, setAvailableStops] = useState(DEFAULT_STOPS);
  const [routeLineCoords, setRouteLineCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  const fareMatrix = {
    Regular: { baseFare: 13, succeedingRate: 1.8 },
    Discounted: { baseFare: 9.6, succeedingRate: 1.44 },
  };

  const fetchDistanceFromGoogle = async (origin: string, destination: string) => {
    const apiKey =
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      (Constants?.expoConfig?.extra as { googleMapsApiKey?: string })?.googleMapsApiKey;

    if (!apiKey) {
      throw new Error('Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your env file.');
    }

    const originCoords = LOCATION_COORDINATES[origin];
    const destinationCoords = LOCATION_COORDINATES[destination];

    if (!originCoords || !destinationCoords) {
      throw new Error('Unknown location coordinates');
    }

    const originParam = `${originCoords.lat},${originCoords.lng}`;
    const destinationParam = `${destinationCoords.lat},${destinationCoords.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(
      originParam,
    )}&destinations=${encodeURIComponent(destinationParam)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error('Distance Matrix request failed');
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      throw new Error('Distance not available for selected route');
    }

    return element.distance.value / 1000; // convert meters to km
  };

  const calculateFareAmount = (km: number, type: string) => {
    if (km <= 0) return 0;

    const baseKm = 4;
    const isDiscounted = type === 'Student' || type === 'Senior' || type === 'PWD';
    const rates = isDiscounted ? fareMatrix.Discounted : fareMatrix.Regular;
    const excessKm = Math.max(km - baseKm, 0);

    return rates.baseFare + excessKm * rates.succeedingRate;
  };

  const fallbackPolyline = useMemo(
    () =>
      availableStops
        .map((stop) => LOCATION_COORDINATES[stop])
        .filter(Boolean)
        .map((coords) => ({
          latitude: coords!.lat,
          longitude: coords!.lng,
        })),
    [availableStops],
  );

  type LatLngPoint = { latitude: number; longitude: number };

  const getStopCoordinateOnRoute = (stopName: string): LatLngPoint | null => {
    const base = LOCATION_COORDINATES[stopName];
    const baseCoords: LatLngPoint | null = base ? { latitude: base.lat, longitude: base.lng } : null;
    if (!stopName || (!routeLineCoords.length && !baseCoords)) return null;

    // When a specific jeepney route is active, snap markers to that route line
    if (routeLineCoords.length > 1 && availableStops.includes(stopName)) {
      const index = availableStops.indexOf(stopName);
      const t =
        availableStops.length <= 1 ? 0 : index / Math.max(availableStops.length - 1, 1);
      const routeIndex = Math.round(t * (routeLineCoords.length - 1));
      return routeLineCoords[routeIndex] || baseCoords || null;
    }

    // Manual mode: use static coordinates
    return baseCoords || null;
  };

  const googleApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (Constants?.expoConfig?.extra as { googleMapsApiKey?: string })?.googleMapsApiKey ||
    '';

  const handleFilterSelection = (value: string) => {
    setFilterDestination(value === 'All Stops (Manual)' ? '' : value);

    if (value === 'All Stops (Manual)') {
      setAvailableStops(DEFAULT_STOPS);
      setFromLocation('');
      setToLocation('');
      setDistanceKm(null);
      setCalculatedFare('');
      setRouteLineCoords([]);
      return;
    }

    const matchedRoute = ROUTE_OPTIONS.find((route) => route.label === value);
    if (matchedRoute) {
      setAvailableStops(matchedRoute.stops);
      setFromLocation(matchedRoute.stops[0]);
      setToLocation(matchedRoute.stops[matchedRoute.stops.length - 1]);
      setDistanceKm(null);
      setCalculatedFare('');
      if (matchedRoute.polyline && matchedRoute.polyline.length > 1) {
        setRouteLineCoords(matchedRoute.polyline);
      } else {
        const line = matchedRoute.stops
          .map((stop) => LOCATION_COORDINATES[stop])
          .filter(Boolean)
          .map((coords) => ({
            latitude: coords!.lat,
            longitude: coords!.lng,
          }));
        setRouteLineCoords(line);
      }
    }
  };

  const computedRegion = (() => {
    const fromCoords = getStopCoordinateOnRoute(fromLocation);
    const toCoords = getStopCoordinateOnRoute(toLocation);

    if (!fromCoords || !toCoords) return null;

    const latitude = (fromCoords.latitude + toCoords.latitude) / 2;
    const longitude = (fromCoords.longitude + toCoords.longitude) / 2;
    const latitudeDelta = Math.abs(fromCoords.latitude - toCoords.latitude) + 0.05;
    const longitudeDelta = Math.abs(fromCoords.longitude - toCoords.longitude) + 0.05;

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  })();

  const handleCalculateFare = async () => {
    if (!fromLocation || !toLocation) {
      setErrorMessage('Please select both origin and destination.');
      return;
    }

    if (fromLocation === toLocation) {
      setErrorMessage('Origin and destination must be different.');
      return;
    }

    try {
      setIsCalculating(true);
      setErrorMessage('');

      const km = await fetchDistanceFromGoogle(fromLocation, toLocation);
      setDistanceKm(km);

      const fareAmount = calculateFareAmount(km, passengerType);
      setCalculatedFare(`₱ ${fareAmount.toFixed(2)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to calculate fare.');
      setCalculatedFare('');
      setDistanceKm(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const PickerModal = ({ 
    visible, 
    onClose, 
    options, 
    selectedValue, 
    onSelect, 
    title 
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-4 max-h-[50%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-dark">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className={`py-4 px-4 border-b border-gray-200 ${
                  selectedValue === item ? 'bg-primary/10' : ''
                }`}
              >
                <Text className={`text-base ${selectedValue === item ? 'text-primary font-bold' : 'text-dark'}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView className="flex-1 bg-secondary" contentContainerStyle={{ paddingBottom: 120 }}>
      <View className="px-4 pt-4">
        {/* Title - Centered */}
        <Text className="text-3xl font-bold text-primary mb-4 text-center">FARES & CALCULATOR</Text>

        {/* Filter Destination */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setShowFilterPicker(true)}
            className="bg-white border-2 border-primary rounded-lg py-3 px-4 flex-row justify-between items-center"
          >
            <Text className="text-dark">{filterDestination || 'Filter Destination'}</Text>
            <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
          </TouchableOpacity>
        </View>

        {/* Fare Calculator Section */}
        <View className="bg-white border-2 border-primary rounded-lg p-4 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-primary text-center flex-1">Fare Calculator</Text>
            <TouchableOpacity
              onPress={() => setShowMap((prev) => !prev)}
              className="bg-primary/10 border border-primary rounded-lg px-3 py-1 ml-3"
            >
              <Text className="text-primary font-semibold text-sm">{showMap ? 'Hide Map' : 'Show Map'}</Text>
            </TouchableOpacity>
          </View>

          {showMap && (
            <View className="mb-4">
              <View className="h-64 rounded-lg overflow-hidden border border-gray-200">
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: 10.3157,
                    longitude: 123.8854,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.08,
                  }}
                  {...(computedRegion ? { region: computedRegion } : {})}
                >
                  {fromLocation &&
                    toLocation &&
                    googleApiKey &&
                    getStopCoordinateOnRoute(fromLocation) &&
                    getStopCoordinateOnRoute(toLocation) && (
                      <MapViewDirections
                        origin={getStopCoordinateOnRoute(fromLocation)!}
                        destination={getStopCoordinateOnRoute(toLocation)!}
                        apikey={googleApiKey}
                        strokeWidth={4}
                        strokeColor="#8D5C8A"
                        lineCap="round"
                        lineJoin="round"
                      />
                    )}
                  {fromLocation && getStopCoordinateOnRoute(fromLocation) && (
                    <Marker
                      coordinate={getStopCoordinateOnRoute(fromLocation)!}
                      title="Start"
                      description={fromLocation}
                      pinColor="green"
                    />
                  )}
                  {toLocation && getStopCoordinateOnRoute(toLocation) && (
                    <Marker
                      coordinate={getStopCoordinateOnRoute(toLocation)!}
                      title="Destination"
                      description={toLocation}
                      pinColor="red"
                    />
                  )}
                </MapView>
              </View>
              <Text className="text-xs text-center text-gray-500 mt-1">
                Map previews adjust once both start and destination are selected.
              </Text>
            </View>
          )}

          {/* From Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">From</Text>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <TouchableOpacity
                onPress={() => setShowFromPicker(true)}
                className="flex-1 bg-highlight border border-gray-300 rounded-lg py-3 px-4 flex-row justify-between items-center"
              >
                <Text className="text-dark">{fromLocation || 'Select starting point'}</Text>
                <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* To Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">To</Text>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <TouchableOpacity
                onPress={() => setShowToPicker(true)}
                className="flex-1 bg-highlight border border-gray-300 rounded-lg py-3 px-4 flex-row justify-between items-center"
              >
                <Text className="text-dark">{toLocation || 'Select destination'}</Text>
                <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Distance Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">Distance</Text>
            <View className="bg-highlight border border-gray-300 rounded-lg px-4 py-3 items-center">
              <Text className="text-dark">
                {distanceKm !== null ? `${distanceKm.toFixed(2)} km` : 'Distance will appear after calculation'}
              </Text>
            </View>
          </View>

          {/* Passenger Type */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">Passenger Type</Text>
            <TouchableOpacity
              onPress={() => setShowPassengerPicker(true)}
              className="bg-highlight border border-gray-300 rounded-lg py-3 px-4 flex-row justify-between items-center"
            >
              <Text className="text-dark">{passengerType}</Text>
              <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
            </TouchableOpacity>
          </View>

          {/* Calculate Fare Button */}
          <TouchableOpacity
            onPress={handleCalculateFare}
            className={`py-3 rounded-lg mb-4 ${isCalculating ? 'bg-primary/60' : 'bg-primary'}`}
            disabled={isCalculating}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isCalculating ? 'Computing…' : 'Calculate Fare'}
            </Text>
          </TouchableOpacity>

          {errorMessage ? (
            <Text className="text-center text-red-500 mb-2">{errorMessage}</Text>
          ) : null}

          {/* Calculated Fare Result */}
          <TextInput
            className="bg-highlight border border-gray-300 rounded-lg px-4 py-3 text-dark text-center"
            placeholder="Calculated fare will appear here"
            placeholderTextColor="#9CA3AF"
            value={calculatedFare}
            editable={false}
          />
        </View>
      </View>

      {/* Modals */}
      <PickerModal
        visible={showFilterPicker}
        onClose={() => setShowFilterPicker(false)}
        options={FILTER_OPTIONS}
        selectedValue={filterDestination || 'All Stops (Manual)'}
        onSelect={handleFilterSelection}
        title="Filter Destination"
      />

      <PickerModal
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        options={availableStops}
        selectedValue={fromLocation}
        onSelect={setFromLocation}
        title="Select Starting Point"
      />

      <PickerModal
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        options={availableStops}
        selectedValue={toLocation}
        onSelect={setToLocation}
        title="Select Destination"
      />

      <PickerModal
        visible={showPassengerPicker}
        onClose={() => setShowPassengerPicker(false)}
        options={PASSENGER_TYPES}
        selectedValue={passengerType}
        onSelect={setPassengerType}
        title="Passenger Type"
      />
    </ScrollView>
  );
};

export default fares;
