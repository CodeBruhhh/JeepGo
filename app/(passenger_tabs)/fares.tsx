import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

import route01C, { RouteDefinition } from '@/Route Codes/01C';
import route01K from '@/Route Codes/01K';
import route02B from '@/Route Codes/02B';
import route03A from '@/Route Codes/03A';
import route03B from '@/Route Codes/03B';
import route03L from '@/Route Codes/03L';
import route03Q from '@/Route Codes/03Q';
import route04B from '@/Route Codes/04B';
import route04H from '@/Route Codes/04H';
import route04I from '@/Route Codes/04I';
import route04L from '@/Route Codes/04L';
import route04M from '@/Route Codes/04M';
import route06B from '@/Route Codes/06B';
import route06C from '@/Route Codes/06C';
import route06G from '@/Route Codes/06G';
import route06H from '@/Route Codes/06H';
import route07B from '@/Route Codes/07B';
import route08G from '@/Route Codes/08G';
import route09C from '@/Route Codes/09C';
import route09F from '@/Route Codes/09F';
import { fetchDistanceFromDirectionsAPI } from '@/utils/distanceCalculator';


// Route Database - Each route has its unique stops
const ROUTE_DATABASE: Record<string, RouteDefinition> = {
  [route01C.code]: route01C,
  [route01K.code]: route01K,
  [route02B.code]: route02B,
  [route03A.code]: route03A,
  [route03B.code]: route03B,
  [route03L.code]: route03L,
  [route03Q.code]: route03Q,
  [route04B.code]: route04B,
  [route04H.code]: route04H,
  [route04I.code]: route04I,
  [route04L.code]: route04L,
  [route04M.code]: route04M,
  [route06B.code]: route06B,
  [route06C.code]: route06C,
  [route06G.code]: route06G,
  [route06H.code]: route06H,
  [route07B.code]: route07B,
  [route08G.code]: route08G,
  [route09C.code]: route09C,
  [route09F.code]: route09F,
  '69B': {
    code: '69B',
    label: '69B - CIT-U to E-mall',
    stops: ['CIT University', 'Fuente Osmeña', 'Elizabeth Mall'],
  },
};

// Fallback static coordinates for known locations
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Parkmall: { lat: 10.324514, lng: 123.9335724 },
  Urgello: { lat: 10.3001, lng: 123.889 },
  Capitol: { lat: 10.311, lng: 123.896 },
  'Court of Appeals': { lat: 10.305267, lng: 123.876473 },
  'R. Arcenas Street': { lat: 10.309547, lng: 123.875931 },
  'Good Shepherd Street': { lat: 10.312507, lng: 123.877961 },
  'Jose Fortichi Street': { lat: 10.31468, lng: 123.88225 },
  'Guadalupe Church': { lat: 10.331238, lng: 123.880046 },
  'Fooda Guadalupe': { lat: 10.323272, lng: 123.883691 },
  'Professional Regulations Commission PRC': { lat: 10.3173038, lng: 123.8850433 },
  'Vicente Sotto Hospital': { lat: 10.30898, lng: 123.891732 },
  'Robinsons Fuente': { lat: 10.3095317, lng: 123.8939535 },
  'Metropolitan Cebu Water District': { lat: 10.2927983, lng: 123.9030364 },
  'Securities and Exchange Commission SEC': { lat: 10.31321, lng: 123.885989 },
  'Calamba Cemetery': { lat: 10.3034804, lng: 123.8858536 },
  'Tres de Abril St': { lat: 10.2976607, lng: 123.8823523 },
  'Miller Hospital': { lat: 10.296666, lng: 123.887601 },
  'Pasil Fish Market': { lat: 10.292407, lng: 123.891855 },
  'Don Carlos Gothong High School': { lat: 10.293708, lng: 123.889583 },
  'Carlock St': { lat: 10.2936478, lng: 123.8869439 },
  'R Padilla Street': { lat: 10.292447, lng: 123.883708 },
  Ayala: { lat: 10.3187, lng: 123.9051 },
  Colon: { lat: 10.2969, lng: 123.9036 },
  Talamban: { lat: 10.3586, lng: 123.913 },
  Mabolo: { lat: 10.3248, lng: 123.9184 },
  Carbon: { lat: 10.2945, lng: 123.9034 },
  CSBT: { lat: 10.3049, lng: 123.9005 },
  'CIT University': { lat: 10.2998, lng: 123.8893 },
  'Elizabeth Mall': { lat: 10.2978296, lng: 123.8953167 },
  'USC Private': { lat: 10.2986, lng: 123.8999 },
  'Fuente Osmeña': { lat: 10.3104, lng: 123.8931 },
  'Cebu City Hall': { lat: 10.2931, lng: 123.9021 },
  "Magellan's Cross": { lat: 10.2922, lng: 123.9033 },
  'Cebu Business Park': { lat: 10.318, lng: 123.9059 },
  // 09F additions - ensure exact keys used by the 09F route
  'University of the Visayas - Main Campus': { lat: 10.2984693, lng: 123.901289 },
  'M. J. Cuenco Ave': { lat: 10.2999962, lng: 123.90635 },
  'Banilad Town Center': { lat: 10.351, lng: 123.9131 },
  'Talamban Proper': { lat: 10.3618, lng: 123.915 },
  'Cebu IT Park': { lat: 10.3293875, lng: 123.9069196 },
  'Rizal Museum': { lat: 10.2933, lng: 123.9027 },
  'Basilica Minore': { lat: 10.2928, lng: 123.9023 },
  'E-Mall Entrance': { lat: 10.2978, lng: 123.9035 },
  // 02B Route stops - exact coordinates from Google Maps URLs
  'Cebu City Medical Center': { lat: 10.2975079, lng: 123.8916166 },
  'Cebu South Bus Terminal': { lat: 10.2976322, lng: 123.8934881 },
  // 09C Route stops (Basak -> Colon) - exact coordinates from Google Maps URLs
  Quiot: { lat: 10.2885894, lng: 123.859503 },
  'Southwestern University Basak Campus': { lat: 10.292571, lng: 123.863207 },
  'Don Vicente Rama Memorial National High School': { lat: 10.290385, lng: 123.866205 },
  Shopwise: { lat: 10.289858, lng: 123.870489 },
  'Mambaling Flyover': { lat: 10.290143, lng: 123.875167 },
  'Cebu Institute of Technology - University': { lat: 10.2944755, lng: 123.881134 },
  'Salazar Colleges of Science and Institute Of Technology': { lat: 10.2957372, lng: 123.8834969 },
  'University of San Jose-Recoletos': { lat: 10.293997, lng: 123.8975074 },
  'Metro Colon': { lat: 10.296236, lng: 123.898277 },
  'Colonnade Supermarket': { lat: 10.2971613, lng: 123.8999591 },
  'P. Burgos Street': { lat: 10.2956, lng: 123.903684 },
  'Legazpi Exit': { lat: 10.294265, lng: 123.905022 },
  'Pier 1': { lat: 10.2922153, lng: 123.9072976 },
  'Pier 2': { lat: 10.2957117, lng: 123.9084482 },
  'Pier 3': { lat: 10.298532, lng: 123.90839 },
  // 03A Route stops - exact coordinates from Google Maps URLs
  'F Cabahug St': { lat: 10.324763, lng: 123.9156696 },
  'Sykes Asia': { lat: 10.325602, lng: 123.91982 },
  'Citi Park': { lat: 10.3256491, lng: 123.9170895 },
  'Sorroso International Hotel': { lat: 10.324454, lng: 123.915266 },
  'Castle Peak Hotel': { lat: 10.3226077, lng: 123.9138739 },
  'Pope John Paul II Ave': { lat: 10.3201198, lng: 123.9111212 },
  'Camelita Monastery': { lat: 10.31834, lng: 123.912068 },
  'St. Joseph Parish': { lat: 10.314917, lng: 123.914195 },
  'The Persimmon': { lat: 10.3123922, lng: 123.911094 },
  'Carreta Cemetery': { lat: 10.3105895, lng: 123.907011 },
  'Imus Avenue': { lat: 10.307425, lng: 123.906192 },
  'Cpils': { lat: 10.302646, lng: 123.906511 },
  'Cebu Technological University': { lat: 10.2966572, lng: 123.9065091 },
  'Vicente Gullas St': { lat: 10.2969085, lng: 123.9021698 },
  'Legaspi St': { lat: 10.2955389, lng: 123.9017567 },
  'Carbon Public Market': { lat: 10.291927, lng: 123.89943 },
  // 04H Route stops - Plaza Housing to Carbon
  'Cebu Veterans Drive': { lat: 10.3436859, lng: 123.8939261 },
  'Marco Polo Hotel': { lat: 10.341463, lng: 123.896573 },
  // 'JY Square Mall' already exists
  // 'The Church of Christ of Latter Day Saints Temple' already exists
  // 'Lahug Barangay Hall' already exists
  // 'University of the Philippines Cebu' already exists
  'Harolds Hotel Cebu': { lat: 10.3196171, lng: 123.8991125 },
  // 'Escario Central Mall' already exists
  // 'Cebu Provincial Capitol' already exists
  // 'Cebu Doctors’ University Hospital' already exists
  // 'Fuente Osmeña Circle' already exists
  // 'Abellana Sport Complex' already exists
  'GV Tower Hotel': { lat: 10.297579, lng: 123.897536 },
  'University of Cebu - Main Campus': { lat: 10.2970477, lng: 123.896664 },
  'Katipunan Lumber': { lat: 10.2966466, lng: 123.8988929 },
  // 04B Route stops - Lahug to Carbon
  'Stephenson St.': { lat: 10.333943, lng: 123.901493 },
  'Salinas Drive': { lat: 10.330721, lng: 123.898829 },
  'JY Square Mall': { lat: 10.330568, lng: 123.897796 },
  'The Church of Christ of Latter Day Saints Temple': { lat: 10.327338, lng: 123.897705 },
  'Lahug Barangay Hall': { lat: 10.3241, lng: 123.898424 },
  'University of the Philippines Cebu': { lat: 10.3222907, lng: 123.8981953 },
  'Gorordo Ave': { lat: 10.3205967, lng: 123.8991322 },
  'Escario Central Mall': { lat: 10.317385, lng: 123.893985 },
  'Cebu Provincial Capitol': { lat: 10.3168489, lng: 123.8906336 },
  "Cebu Doctors’ University Hospital": { lat: 10.3144559, lng: 123.8920288 },
  'University of San Carlos Main - Downtown Campus': { lat: 10.299449, lng: 123.8987921 },
  'Cebu Metropolitan Cathedral': { lat: 10.2955765, lng: 123.9029952 },
  'Sto. Niño Barangay Hall': { lat: 10.2950105, lng: 123.9028672 },
  // 03Q Route stops (Ayala -> SM City)
  'Ayala Center Cebu': { lat: 10.318237, lng: 123.9052295 },
  'Landers Superstore Cebu': { lat: 10.3204806, lng: 123.9100897 },
  'Juan Luna Avenue': { lat: 10.3175661, lng: 123.9126331 },
  'SM City Cebu': { lat: 10.3114191, lng: 123.9178164 },
  // 04L Route stops (Lahug to SM via Ayala) - exact coordinates from Google Maps URLs
  'Lahug': { lat: 10.331056, lng: 123.898121 },
  'The Golden Peak Hotel': { lat: 10.318358, lng: 123.899974 },
  'Cebu Parklane Hotel': { lat: 10.320182, lng: 123.903381 },
  'Pag-Ibig Fund Cebu Office': { lat: 10.320216, lng: 123.90451 },
  'Insular Life Cebu Business Center': { lat: 10.319886, lng: 123.906036 },
  'Keppel Tower Cebu Business Park': { lat: 10.318585, lng: 123.908266 },
  // 'Pope John Paul II Ave' already exists
  // 'Camelita Monastery' already exists
  // 'St. Joseph Parish' already exists
  // 04M Route stops (JY Square Mall to Ayala Terminal) - exact coordinates from Google Maps URLs
  'University of Southern Philippines': { lat: 10.329061, lng: 123.902163 },
  // 'Cebu IT Park' already exists (updated with more precise coordinates from Google Maps)
  'Ayala Public Utility Vehicle Terminal': { lat: 10.318864, lng: 123.9035148 },
  // 03B Route stops - exact coordinates from Google Maps URLs
  'Sindulan St': { lat: 10.319353, lng: 123.915979 },
  'University of San Carlos - North Campus': { lat: 10.3118001, lng: 123.901127 },
  'Fooda Savers Mart': { lat: 10.3115467, lng: 123.9016289 },
  'Horizons 101 Condominium': { lat: 10.3105301, lng: 123.8974315 },
  'Mango Square Mall': { lat: 10.310299, lng: 123.895522 },
  'Fuente Osmeña Circle': { lat: 10.3102031, lng: 123.8936769 },
  'Crown Regency Hotel & Towers': { lat: 10.3080134, lng: 123.894077 },
  'Abellana Sport Complex': { lat: 10.3008664, lng: 123.8952547 },
  'Social Security System - Cebu Main Office': { lat: 10.2983988, lng: 123.8967585 },
  // 'Robinsons Fuente' already exists - 06C reuses this
  // 03L Route stops - exact coordinates from Google Maps URLs
  'P Cabantan': { lat: 10.322451, lng: 123.905229 },
  'Waterfront Hotel': { lat: 10.3251762, lng: 123.9035573 },
  'San Carlos Seminar Complex': { lat: 10.3221705, lng: 123.9097729 },
  'Museo Sugbo': { lat: 10.303749, lng: 123.906227 },
  'Tiburcio Padilla St': { lat: 10.3019728, lng: 123.9073451 },
  'Cebu Technological University - Main Campus': { lat: 10.2966572, lng: 123.9065091 },
  // 01C Route stops - exact coordinates from Google Maps URLs
  'University of San Carlos South Campus': { lat: 10.300413, lng: 123.887984 },
  'J Alcantara': { lat: 10.2998482, lng: 123.8916874 },
  'Leon Kilat St': { lat: 10.2963913, lng: 123.8962662 },
  'Gaisano Main': { lat: 10.2975525, lng: 123.9016732 },
  'University of Visayas': { lat: 10.2982613, lng: 123.9014808 },
  'Colon Obelisk': { lat: 10.2979797, lng: 123.9036644 },
  'Mabini St': { lat: 10.2979721, lng: 123.9037308 },
  'Zulueta St': { lat: 10.2985619, lng: 123.9049727 },
  'MJ Cuenca Ave': { lat: 10.2999962, lng: 123.90635 },
  'Tiburcio': { lat: 10.3019728, lng: 123.9073451 },
  'B Benedicto St': { lat: 10.30351, lng: 123.9094037 },
  'General Maxilom Ave Ext': { lat: 10.306426, lng: 123.910329 },
  'Pier 4': { lat: 10.303479, lng: 123.912758 },
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
    // For streets/landmarks, be more specific
    let query = locationName;
    
    // If it's a street or specific location, add Cebu context
    if (!locationName.toLowerCase().includes('cebu') && !locationName.toLowerCase().includes('pier')) {
      query = `${locationName}, Cebu City, Cebu, Philippines`;
    } else {
      query = `${locationName}, Cebu, Philippines`;
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&region=ph`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Find the most relevant result (prefer Cebu City results)
      let bestResult = data.results[0];
      
      // Prefer results that mention Cebu City
      for (const result of data.results) {
        const address = result.formatted_address.toLowerCase();
        if (address.includes('cebu city') || address.includes('cebu')) {
          bestResult = result;
          break;
        }
      }
      
      const location = bestResult.geometry.location;
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

  type LatLngPoint = { latitude: number; longitude: number };
  // State to track geocoded coordinates for selected stops
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<Record<string, LatLngPoint>>({});

  const googleApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (Constants?.expoConfig?.extra as { googleMapsApiKey?: string })?.googleMapsApiKey ||
    '';

  const fareMatrix = {
    Regular: { baseFare: 13, succeedingRate: 1.8 },
    Discounted: { baseFare: 9.6, succeedingRate: 1.44 },
  };

  // Get coordinates for a stop (with geocoding if needed) - for distance calculation
  const getStopCoordinates = useCallback(
    async (stopName: string): Promise<{ lat: number; lng: number } | null> => {
      if (!stopName) return null;

      // PRIORITY 1: Use exact static coordinates from Google Maps URLs (most accurate)
      if (LOCATION_COORDINATES[stopName]) {
        const coords = LOCATION_COORDINATES[stopName];
        geocodeCache[stopName] = coords;
        // Also update geocodedCoordinates state
        setGeocodedCoordinates((prev) => ({
          ...prev,
          [stopName]: { latitude: coords.lat, longitude: coords.lng },
        }));
        return coords;
      }

      // PRIORITY 2: Use geocoded coordinates if available
      if (geocodedCoordinates[stopName]) {
        return {
          lat: geocodedCoordinates[stopName].latitude,
          lng: geocodedCoordinates[stopName].longitude,
        };
      }

      // PRIORITY 3: Check cache
      if (geocodeCache[stopName]) return geocodeCache[stopName];

      // PRIORITY 4: Geocode using Google Maps API (only if no static coordinates)
      if (googleApiKey) {
        const coords = await geocodeLocation(stopName, googleApiKey);
        if (coords) {
          // Also update geocodedCoordinates state
          setGeocodedCoordinates((prev) => ({
            ...prev,
            [stopName]: { latitude: coords.lat, longitude: coords.lng },
          }));
        }
        return coords;
      }

      return null;
    },
    [googleApiKey, geocodedCoordinates],
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
    if (type === 'Regular') {
      if (km <= 4) return 13.0;
      return 13.0 + (km - 4) * 1.8;
    }

    if (type === 'Discounted' || type === 'Student' || type === 'Senior' || type === 'PWD') {
      if (km <= 4) return 9.6;
      return 9.6 + (km - 4) * 1.44;
    }

    // Default to Regular if type doesn't match
    if (km <= 4) return 13.0;
    return 13.0 + (km - 4) * 1.8;
  };

  // Geocode a stop when it's selected - prioritizes exact static coordinates
  const geocodeStop = useCallback(
    async (stopName: string) => {
      if (!stopName) return null;

      // Check if already geocoded
      if (geocodedCoordinates[stopName]) {
        return geocodedCoordinates[stopName];
      }

      // PRIORITY 1: Use exact static coordinates from Google Maps URLs (most accurate)
      const staticCoords = LOCATION_COORDINATES[stopName];
      if (staticCoords) {
        const latLng = { latitude: staticCoords.lat, longitude: staticCoords.lng };
        geocodeCache[stopName] = staticCoords;
        setGeocodedCoordinates((prev) => ({ ...prev, [stopName]: latLng }));
        return latLng;
      }

      // PRIORITY 2: Check cache
      if (geocodeCache[stopName]) {
        const coords = { latitude: geocodeCache[stopName].lat, longitude: geocodeCache[stopName].lng };
        setGeocodedCoordinates((prev) => ({ ...prev, [stopName]: coords }));
        return coords;
      }

      // PRIORITY 3: Geocode using Google Maps API (only if no static coordinates)
      if (googleApiKey) {
        setIsGeocoding(true);
        try {
          const coords = await geocodeLocation(stopName, googleApiKey);
          if (coords) {
            const latLng = { latitude: coords.lat, longitude: coords.lng };
            setGeocodedCoordinates((prev) => ({ ...prev, [stopName]: latLng }));
            return latLng;
          }
        } catch (error) {
          console.error('Error geocoding stop:', stopName, error);
        } finally {
          setIsGeocoding(false);
        }
      }

      return null;
    },
    [googleApiKey, geocodedCoordinates],
  );

  // Geocode stops when they're selected
  useEffect(() => {
    if (fromLocation && googleApiKey) {
      geocodeStop(fromLocation);
    }
  }, [fromLocation, googleApiKey, geocodeStop]);

  useEffect(() => {
    if (toLocation && googleApiKey) {
      geocodeStop(toLocation);
    }
  }, [toLocation, googleApiKey, geocodeStop]);

  // Get coordinates for map markers - prioritizes exact static coordinates
  const getStopCoordinateForMap = useCallback(
    (stopName: string): LatLngPoint | null => {
      if (!stopName) return null;

      // PRIORITY 1: Use exact static coordinates from Google Maps URLs (most accurate)
      const staticCoords = LOCATION_COORDINATES[stopName];
      if (staticCoords) {
        geocodeCache[stopName] = staticCoords;
        const latLng = { latitude: staticCoords.lat, longitude: staticCoords.lng };
        // Update geocodedCoordinates if not already set
        if (!geocodedCoordinates[stopName]) {
          setGeocodedCoordinates((prev) => ({ ...prev, [stopName]: latLng }));
        }
        return latLng;
      }

      // PRIORITY 2: Use geocoded coordinates if available
      if (geocodedCoordinates[stopName]) {
        return geocodedCoordinates[stopName];
      }

      // PRIORITY 3: Check cache
      const cached = geocodeCache[stopName];
      if (cached) {
        return { latitude: cached.lat, longitude: cached.lng };
      }

      return null;
    },
    [geocodedCoordinates],
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
  }, [fromLocation, toLocation, getStopCoordinateForMap, geocodedCoordinates]);

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

      let km = 0;

      // Get coordinates for both locations
      const originCoords = await getStopCoordinates(fromLocation);
      const destinationCoords = await getStopCoordinates(toLocation);

      if (!originCoords || !destinationCoords) {
        throw new Error('Could not find coordinates for selected locations. Please try again.');
      }

      // Use Directions API for accurate distance
      const originParam = `${originCoords.lat},${originCoords.lng}`;
      const destinationParam = `${destinationCoords.lat},${destinationCoords.lng}`;

      km = await fetchDistanceFromDirectionsAPI(originParam, destinationParam, googleApiKey);
      console.log(`Using Google Directions API distance: ${km.toFixed(2)} km`);

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

  const PickerModal = React.memo(({ 
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
    const [searchInput, setSearchInput] = useState(searchQuery || '');
    
    const filteredOptions = useMemo(() => {
      if (!searchInput) return options;
      const query = searchInput.toLowerCase();
      return options.filter((option) => option.toLowerCase().includes(query));
    }, [options, searchInput]);

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
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
              </View>
            )}
          <FlatList
              data={filteredOptions}
            keyExtractor={(item, index) => `${item}-${index}`}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
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
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.visible === nextProps.visible &&
      prevProps.selectedValue === nextProps.selectedValue &&
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.options.length === nextProps.options.length &&
      prevProps.title === nextProps.title
    );
  });

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
                  {/* Render KML route if available */}
                  {(() => {
                    const selectedRoute = filterDestination
                      ? Object.values(ROUTE_DATABASE).find((r) => r.label === filterDestination)
                      : null;

                    if (selectedRoute?.coordinates && selectedRoute.coordinates.length > 0) {
                      // Use KML coordinates for accurate route display
                      return (
                        <Polyline
                          coordinates={selectedRoute.coordinates}
                          strokeWidth={4}
                          strokeColor="#8D5C8A"
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    }

                    // Fallback to MapViewDirections if no KML coordinates
                    if (
                      fromLocation &&
                      toLocation &&
                      googleApiKey &&
                      getStopCoordinateForMap(fromLocation) &&
                      getStopCoordinateForMap(toLocation)
                    ) {
                      return (
                        <MapViewDirections
                          origin={getStopCoordinateForMap(fromLocation)!}
                          destination={getStopCoordinateForMap(toLocation)!}
                          apikey={googleApiKey}
                          strokeWidth={4}
                          strokeColor="#8D5C8A"
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    }

                    return null;
                  })()}
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
                {isGeocoding
                  ? 'Locating stops on map...'
                  : 'Map previews adjust once both start and destination are selected.'}
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
