/**
 * Helper script to convert KML files to route definitions
 * 
 * Usage:
 * 1. Place your KML file in the same directory
 * 2. Update the kmlFileName and routeInfo below
 * 3. Run: npx ts-node Route\ Codes/convertKMLtoRoute.ts
 * 4. Copy the output to your route file (e.g., 01C.ts)
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseKML } from './kmlParser';

// ===== CONFIGURATION =====
// Update these values for each route
const kmlFileName = '01C.kml'; // Name of your KML file
const routeCode = '01C';
const routeLabel = '01C - Private to Colon';
const routeStops = [
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
];
// =========================

const convertKML = () => {
  const kmlPath = path.join(__dirname, kmlFileName);
  
  if (!fs.existsSync(kmlPath)) {
    console.error(`KML file not found: ${kmlPath}`);
    console.log('Please place your KML file in the Route Codes folder and update kmlFileName');
    return;
  }

  const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
  const routes = parseKML(kmlContent);

  if (routes.length === 0) {
    console.error('No coordinates found in KML file');
    return;
  }

  console.log(`Found ${routes.length} route(s) in KML file\n`);

  // Format coordinates for TypeScript
  const formatCoordinates = (coords: { latitude: number; longitude: number }[]) => {
    return coords
      .map((c) => `  { latitude: ${c.latitude}, longitude: ${c.longitude} }`)
      .join(',\n');
  };

  // Generate route definition code
  let output = `import type { Coordinate } from './kmlParser';

export type RouteDefinition = {
  code: string;
  label: string;
  stops: string[];
  coordinates?: Coordinate[];
  returnCoordinates?: Coordinate[];
};

// KML coordinates for ${routeCode} route
const kmlCoordinates${routeCode} = [
${formatCoordinates(routes[0])},
];

${routes.length > 1 ? `// Return route coordinates
const returnCoordinates${routeCode} = [
${formatCoordinates(routes[1])},
];` : ''}

export const route${routeCode}: RouteDefinition = {
  code: '${routeCode}',
  label: '${routeLabel}',
  stops: [
${routeStops.map((stop) => `    '${stop}'`).join(',\n')},
  ],
  coordinates: kmlCoordinates${routeCode},${routes.length > 1 ? `\n  returnCoordinates: returnCoordinates${routeCode},` : ''}
};

export default route${routeCode};
`;

  console.log('=== GENERATED ROUTE DEFINITION ===\n');
  console.log(output);
  console.log('\n=== END ===');
  console.log('\nCopy the above code to your route file (e.g., Route Codes/' + routeCode + '.ts)');
};

// Run if executed directly
if (require.main === module) {
  convertKML();
}

export { convertKML };


