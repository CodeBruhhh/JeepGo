/**
 * Utility to parse KML files and extract route coordinates
 */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

/**
 * Parse KML content and extract LineString coordinates
 * @param kmlContent - The KML file content as a string
 * @returns Array of coordinate arrays (one for each LineString found)
 */
export const parseKML = (kmlContent: string): Coordinate[][] => {
  const coordinates: Coordinate[][] = [];

  // Extract all <coordinates> tags from the KML
  const coordinateRegex = /<coordinates>([\s\S]*?)<\/coordinates>/g;
  let match;

  while ((match = coordinateRegex.exec(kmlContent)) !== null) {
    const coordString = match[1].trim();
    const coordPairs = coordString.split(/\s+/).filter((pair) => pair.trim().length > 0);

    const routeCoords: Coordinate[] = coordPairs.map((pair) => {
      const parts = pair.split(',');
      // KML format: longitude,latitude,altitude
      const longitude = parseFloat(parts[0]);
      const latitude = parseFloat(parts[1]);
      return { latitude, longitude };
    });

    if (routeCoords.length > 0) {
      coordinates.push(routeCoords);
    }
  }

  return coordinates;
};

/**
 * Get the primary route from KML (usually the first LineString)
 * @param kmlContent - The KML file content as a string
 * @returns Array of coordinates for the primary route
 */
export const getPrimaryRouteFromKML = (kmlContent: string): Coordinate[] => {
  const allRoutes = parseKML(kmlContent);
  // Return the first route (usually the main one)
  return allRoutes[0] || [];
};

/**
 * Get all routes from KML (useful if there are multiple directions)
 * @param kmlContent - The KML file content as a string
 * @returns Array of coordinate arrays
 */
export const getAllRoutesFromKML = (kmlContent: string): Coordinate[][] => {
  return parseKML(kmlContent);
};


