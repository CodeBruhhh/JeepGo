import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';


// Route Database - Each route has its unique stops
const ROUTE_DATABASE: Record<
  string,
  {
    code: string;
    label: string;
    stops: string[];
  }
> = {
  '01C': {
    code: '01C',
    label: '01C - Private to Colon',
    stops: [
      'University of San Carlos South Campus',
      'J Alcantara',
      'Leon Kilat St',
      'Metro Colon',
      'Colonade Supermarket',
      'Gaisano Main',
      'University of Visayas',
      'Colon Obelisk',
      'Mabini St',
      'Zulueta St',
      'MJ Cuenca Ave',
      'Tiburcio',
      'Padilla St',
      'B Benedicto St',
      'General Maxilom Ave Ext',
      'Pier 4',
      'Pier 3',
    ],
  },
  '01K': {
    code: '01K',
    label: '01K - Urgello to Parkmall',
    stops: ['Urgello', 'Capitol', 'Ayala', 'Parkmall'],
  },
  '02B': {
    code: '02B',
    label: '02B - CSBT to Colon',
    stops: ['CSBT', 'Fuente Osmeña', 'Colon'],
  },
  '03A': {
    code: '03A',
    label: '03A - Mabolo to Carbon',
    stops: ['Mabolo', 'Ayala', 'Carbon'],
  },
  '06B': {
    code: '06B',
    label: '06B - Talamban to Colon',
    stops: ['Talamban', 'Capitol', 'Colon'],
  },
  '69B': {
    code: '69B',
    label: '69B - CIT-U to E-mall',
    stops: ['CIT University', 'Fuente Osmeña', 'Elizabeth Mall'],
  },
};

// Fallback static coordinates for known locations
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
  'Pier 4': { lat: 10.3055, lng: 123.9125 },
  'Cebu Business Park': { lat: 10.318, lng: 123.9059 },
  'SM City Cebu': { lat: 10.3111, lng: 123.918 },
  'Banilad Town Center': { lat: 10.351, lng: 123.9131 },
  'Talamban Proper': { lat: 10.3618, lng: 123.915 },
  'Cebu IT Park': { lat: 10.3309, lng: 123.9043 },
  'Rizal Museum': { lat: 10.2933, lng: 123.9027 },
  'Basilica Minore': { lat: 10.2928, lng: 123.9023 },
  'E-Mall Entrance': { lat: 10.2978, lng: 123.9035 },
  'University of San Carlos South Campus': { lat: 10.2986, lng: 123.8999 },
  'J Alcantara': { lat: 10.299, lng: 123.8995 },
  'Leon Kilat St': { lat: 10.3005, lng: 123.9005 },
  'Metro Colon': { lat: 10.297, lng: 123.903 },
  'Colonade Supermarket': { lat: 10.2965, lng: 123.9032 },
  'Gaisano Main': { lat: 10.296, lng: 123.9035 },
  'University of Visayas': { lat: 10.2955, lng: 123.9038 },
  'Colon Obelisk': { lat: 10.2969, lng: 123.9036 },
  'Mabini St': { lat: 10.2975, lng: 123.904 },
  'Zulueta St': { lat: 10.298, lng: 123.9045 },
  'MJ Cuenca Ave': { lat: 10.2985, lng: 123.905 },
  'Tiburcio': { lat: 10.299, lng: 123.9055 },
  'Padilla St': { lat: 10.2995, lng: 123.906 },
  'B Benedicto St': { lat: 10.3, lng: 123.9065 },
  'General Maxilom Ave Ext': { lat: 10.3005, lng: 123.907 },
};

const FILTER_OPTIONS = ['All Stops (Manual)', ...Object.values(ROUTE_DATABASE).map((route) => route.label)];
const PASSENGER_TYPES = ['Regular', 'Student', 'Senior', 'PWD'];

// Geocoding cache to avoid repeated API calls
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

// Geocode a location name using Google Geocoding API
const geocodeLocation = async (
  locationName: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> => {
  // Check cache first
  if (geocodeCache[locationName]) {
    return geocodeCache[locationName];
  }

  // Check fallback static coordinates
  if (LOCATION_COORDINATES[locationName]) {
    geocodeCache[locationName] = LOCATION_COORDINATES[locationName];
    return LOCATION_COORDINATES[locationName];
  }

  try {
    // Add "Cebu City, Philippines" to improve accuracy
    const query = `${locationName}, Cebu City, Philippines`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };
      geocodeCache[locationName] = coords;
      return coords;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const fares = () => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [passengerType, setPassengerType] = useState('Regular');
  const [calculatedFare, setCalculatedFare] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showPassengerPicker, setShowPassengerPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [availableStops, setAvailableStops] = useState<string[]>([]);
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');

  const googleApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (Constants?.expoConfig?.extra as { googleMapsApiKey?: string })?.googleMapsApiKey ||
    '';

  const fareMatrix = {
    Regular: { baseFare: 13, succeedingRate: 1.8 },
    Discounted: { baseFare: 9.6, succeedingRate: 1.44 },
  };

  // Get coordinates for a stop (with geocoding if needed)
  const getStopCoordinates = useCallback(
    async (stopName: string): Promise<{ lat: number; lng: number } | null> => {
      if (!stopName || !googleApiKey) return null;

      // Check cache and static coordinates first
      if (geocodeCache[stopName]) return geocodeCache[stopName];
      if (LOCATION_COORDINATES[stopName]) {
        geocodeCache[stopName] = LOCATION_COORDINATES[stopName];
        return LOCATION_COORDINATES[stopName];
      }

      // Geocode if not found
      return await geocodeLocation(stopName, googleApiKey);
    },
    [googleApiKey],
  );

  const fetchDistanceFromGoogle = async (origin: string, destination: string) => {
    if (!googleApiKey) {
      throw new Error('Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your env file.');
    }

    const originCoords = await getStopCoordinates(origin);
    const destinationCoords = await getStopCoordinates(destination);

    if (!originCoords || !destinationCoords) {
      throw new Error('Could not find coordinates for selected locations. Please try again.');
    }

    const originParam = `${originCoords.lat},${originCoords.lng}`;
    const destinationParam = `${destinationCoords.lat},${destinationCoords.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(
      originParam,
    )}&destinations=${encodeURIComponent(destinationParam)}&key=${googleApiKey}`;

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

  type LatLngPoint = { latitude: number; longitude: number };

  // Get coordinates for map markers (synchronous version using cache)
  const getStopCoordinateForMap = useCallback(
    (stopName: string): LatLngPoint | null => {
      if (!stopName) return null;

      // Check cache first
      const cached = geocodeCache[stopName];
      if (cached) {
        return { latitude: cached.lat, longitude: cached.lng };
      }

      // Check static coordinates
      const staticCoords = LOCATION_COORDINATES[stopName];
      if (staticCoords) {
        geocodeCache[stopName] = staticCoords;
        return { latitude: staticCoords.lat, longitude: staticCoords.lng };
      }

      return null;
    },
    [],
  );

  // Geocode stops when route is selected
  useEffect(() => {
    const geocodeRouteStops = async () => {
      if (!filterDestination || !googleApiKey || availableStops.length === 0) return;

      setIsGeocoding(true);
      try {
        // Geocode all stops in the current route
        await Promise.all(
          availableStops.map(async (stop) => {
            if (!geocodeCache[stop] && !LOCATION_COORDINATES[stop]) {
              await geocodeLocation(stop, googleApiKey);
            }
          }),
        );
      } catch (error) {
        console.error('Error geocoding route stops:', error);
      } finally {
        setIsGeocoding(false);
      }
    };

    geocodeRouteStops();
  }, [filterDestination, availableStops, googleApiKey]);

  const handleFilterSelection = (value: string) => {
    setFilterDestination(value === 'All Stops (Manual)' ? '' : value);
    setFromSearchQuery('');
    setToSearchQuery('');

    if (value === 'All Stops (Manual)') {
      setAvailableStops([]);
      setFromLocation('');
      setToLocation('');
      setDistanceKm(null);
      setCalculatedFare('');
      return;
    }

    // Find route in database
    const matchedRoute = Object.values(ROUTE_DATABASE).find((route) => route.label === value);
    if (matchedRoute) {
      setAvailableStops(matchedRoute.stops);
      setFromLocation(matchedRoute.stops[0] || '');
      setToLocation(matchedRoute.stops[matchedRoute.stops.length - 1] || '');
      setDistanceKm(null);
      setCalculatedFare('');
    }
  };

  const computedRegion = useMemo(() => {
    const fromCoords = getStopCoordinateForMap(fromLocation);
    const toCoords = getStopCoordinateForMap(toLocation);

    if (!fromCoords || !toCoords) return null;

    const latitude = (fromCoords.latitude + toCoords.latitude) / 2;
    const longitude = (fromCoords.longitude + toCoords.longitude) / 2;
    const latitudeDelta = Math.abs(fromCoords.latitude - toCoords.latitude) + 0.05;
    const longitudeDelta = Math.abs(fromCoords.longitude - toCoords.longitude) + 0.05;

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  }, [fromLocation, toLocation, getStopCoordinateForMap]);

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
    title,
    searchQuery,
    onSearchChange,
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    title: string;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
  }) => {
    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      const query = searchQuery.toLowerCase();
      return options.filter((option) => option.toLowerCase().includes(query));
    }, [options, searchQuery]);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-4 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-dark">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {onSearchChange && (
              <View className="mb-4">
                <TextInput
                  className="bg-highlight border border-gray-300 rounded-lg px-4 py-3 text-dark"
                  placeholder="Search stops..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery || ''}
                  onChangeText={onSearchChange}
                />
              </View>
            )}
            <FlatList
              data={filteredOptions}
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
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-gray-500">No stops found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

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
                    getStopCoordinateForMap(fromLocation) &&
                    getStopCoordinateForMap(toLocation) && (
                      <MapViewDirections
                        origin={getStopCoordinateForMap(fromLocation)!}
                        destination={getStopCoordinateForMap(toLocation)!}
                        apikey={googleApiKey}
                        strokeWidth={4}
                        strokeColor="#8D5C8A"
                        lineCap="round"
                        lineJoin="round"
                      />
                    )}
                  {fromLocation && getStopCoordinateForMap(fromLocation) && (
                    <Marker
                      coordinate={getStopCoordinateForMap(fromLocation)!}
                      title="Start"
                      description={fromLocation}
                      pinColor="green"
                    />
                  )}
                  {toLocation && getStopCoordinateForMap(toLocation) && (
                    <Marker
                      coordinate={getStopCoordinateForMap(toLocation)!}
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
        onClose={() => {
          setShowFromPicker(false);
          setFromSearchQuery('');
        }}
        options={availableStops}
        selectedValue={fromLocation}
        onSelect={setFromLocation}
        title="Select Starting Point"
        searchQuery={fromSearchQuery}
        onSearchChange={setFromSearchQuery}
      />

      <PickerModal
        visible={showToPicker}
        onClose={() => {
          setShowToPicker(false);
          setToSearchQuery('');
        }}
        options={availableStops}
        selectedValue={toLocation}
        onSelect={setToLocation}
        title="Select Destination"
        searchQuery={toSearchQuery}
        onSearchChange={setToSearchQuery}
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
