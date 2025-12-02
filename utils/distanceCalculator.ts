/**
 * Haversine formula to calculate distance between two coordinates
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Fetch distance using Google Directions API with transit mode
 * Returns the actual transit (bus/jeep) distance along the route
 * Mode set to 'transit' for jeep/bus routing (closest to actual jeepney routes)
 * @param origin Starting location (latitude,longitude)
 * @param destination Ending location (latitude,longitude)
 * @param apiKey Google Maps API Key
 * @returns Distance in kilometers
 */
export const fetchDistanceFromDirectionsAPI = async (
  origin: string,
  destination: string,
  apiKey: string
): Promise<number> => {
  if (!apiKey) {
    throw new Error('Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your env file.');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin,
    )}&destination=${encodeURIComponent(destination)}&mode=transit&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Directions API error: ${data.status}`);
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found between the selected locations');
    }

    // Get the first route
    const route = data.routes[0];
    
    if (!route.legs || route.legs.length === 0) {
      throw new Error('No route legs found');
    }

    // Sum up all legs distances (in case there are multiple waypoints)
    let totalDistance = 0;
    for (const leg of route.legs) {
      if (leg.distance && leg.distance.value) {
        totalDistance += leg.distance.value; // Distance is in meters
      }
    }

    // Convert meters to kilometers
    return totalDistance / 1000;
  } catch (error) {
    console.error('Directions API error:', error);
    throw error;
  }
};

/**
 * Calculate total distance along a route path by summing segments
 * @param coordinates Array of {latitude, longitude} points
 * @returns Total distance in kilometers
 */
export const calculateRouteDistance = (
  coordinates: Array<{ latitude: number; longitude: number }>
): number => {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const lat1 = coordinates[i].latitude;
    const lng1 = coordinates[i].longitude;
    const lat2 = coordinates[i + 1].latitude;
    const lng2 = coordinates[i + 1].longitude;

    totalDistance += haversineDistance(lat1, lng1, lat2, lng2);
  }

  return totalDistance;
};

/**
 * Calculate distance between two stops on a route using KML coordinates
 * Interpolates stop positions based on their index in the stops array
 * @param route Route definition with coordinates and stops
 * @param fromStopName Name of the starting stop
 * @param toStopName Name of the destination stop
 * @returns Distance in kilometers
 */
export const calculateKMLDistance = (
  route: {
    stops: string[];
    coordinates?: Array<{ latitude: number; longitude: number }>;
  },
  fromStopName: string,
  toStopName: string
): number | null => {
  if (!route.coordinates || route.coordinates.length === 0) {
    return null;
  }

  const fromStopIndex = route.stops.indexOf(fromStopName);
  const toStopIndex = route.stops.indexOf(toStopName);

  // If either stop is not found in the route, return null
  if (fromStopIndex === -1 || toStopIndex === -1) {
    return null;
  }

  // Ensure from is before to
  const startIdx = Math.min(fromStopIndex, toStopIndex);
  const endIdx = Math.max(fromStopIndex, toStopIndex);

  const totalStops = route.stops.length;
  const totalCoordinates = route.coordinates.length;

  // Map stop indices to coordinate indices (interpolate)
  const startCoordIdx = Math.round((startIdx / (totalStops - 1)) * (totalCoordinates - 1));
  const endCoordIdx = Math.round((endIdx / (totalStops - 1)) * (totalCoordinates - 1));

  // Calculate distance along the route from start to end
  let distance = 0;
  for (let i = startCoordIdx; i < endCoordIdx; i++) {
    const coord1 = route.coordinates[i];
    const coord2 = route.coordinates[i + 1];

    distance += haversineDistance(
      coord1.latitude,
      coord1.longitude,
      coord2.latitude,
      coord2.longitude
    );
  }

  return distance;
};
