import type { Coordinate } from './kmlParser';

export type RouteDefinition = {
  code: string;
  label: string;
  stops: string[];
  coordinates?: Coordinate[]; // Route path coordinates from KML
  returnCoordinates?: Coordinate[]; // Return route coordinates (if available)
};

// KML coordinates for 01C route (Sambag 1 to Pier 3)
const kmlCoordinates01C = [
  { latitude: 10.30032, longitude: 123.88673 },
  { latitude: 10.29918, longitude: 123.88727 },
  { latitude: 10.29846, longitude: 123.8877 },
  { latitude: 10.29946, longitude: 123.88902 },
  { latitude: 10.29999, longitude: 123.89039 },
  { latitude: 10.30009, longitude: 123.89077 },
  { latitude: 10.30002, longitude: 123.89123 },
  { latitude: 10.29916, longitude: 123.89398 },
  { latitude: 10.29889, longitude: 123.8954 },
  { latitude: 10.29871, longitude: 123.89558 },
  { latitude: 10.29748, longitude: 123.89599 },
  { latitude: 10.29547, longitude: 123.89656 },
  { latitude: 10.29547, longitude: 123.89665 },
  { latitude: 10.29612, longitude: 123.8981 },
  { latitude: 10.29713, longitude: 123.89972 },
  { latitude: 10.29763, longitude: 123.90061 },
  { latitude: 10.29794, longitude: 123.90375 },
  { latitude: 10.29839, longitude: 123.90373 },
  { latitude: 10.29879, longitude: 123.90383 },
  { latitude: 10.29852, longitude: 123.90539 },
  { latitude: 10.29836, longitude: 123.90609 },
  { latitude: 10.3003, longitude: 123.90646 },
  { latitude: 10.30131, longitude: 123.90659 },
  { latitude: 10.30189, longitude: 123.90661 },
  { latitude: 10.30196, longitude: 123.90736 },
  { latitude: 10.30191, longitude: 123.90904 },
  { latitude: 10.30216, longitude: 123.90903 },
  { latitude: 10.30241, longitude: 123.90909 },
  { latitude: 10.30354, longitude: 123.90948 },
  { latitude: 10.30484, longitude: 123.90986 },
  { latitude: 10.30508, longitude: 123.9101 },
  { latitude: 10.30573, longitude: 123.91097 },
  { latitude: 10.30367, longitude: 123.91262 },
  { latitude: 10.30167, longitude: 123.91029 },
  { latitude: 10.30119, longitude: 123.90991 },
  { latitude: 10.29849, longitude: 123.90843 },
];

// Return route coordinates (Pier 3 to Sambag 1)
const returnCoordinates01C = [
  { latitude: 10.298495, longitude: 123.908427 },
  { latitude: 10.29852, longitude: 123.90771 },
  { latitude: 10.29832, longitude: 123.90623 },
  { latitude: 10.29834, longitude: 123.90607 },
  { latitude: 10.29648, longitude: 123.9057 },
  { latitude: 10.29717, longitude: 123.90409 },
  { latitude: 10.2972, longitude: 123.90383 },
  { latitude: 10.29693, longitude: 123.90217 },
  { latitude: 10.29729, longitude: 123.9022 },
  { latitude: 10.2978, longitude: 123.90204 },
  { latitude: 10.29925, longitude: 123.90171 },
  { latitude: 10.29921, longitude: 123.90108 },
  { latitude: 10.29908, longitude: 123.90041 },
  { latitude: 10.29891, longitude: 123.89993 },
  { latitude: 10.2982, longitude: 123.89835 },
  { latitude: 10.29766, longitude: 123.89732 },
  { latitude: 10.29731, longitude: 123.89606 },
  { latitude: 10.29874, longitude: 123.89561 },
  { latitude: 10.29894, longitude: 123.89537 },
  { latitude: 10.29919, longitude: 123.89398 },
  { latitude: 10.30004, longitude: 123.89124 },
  { latitude: 10.30012, longitude: 123.89077 },
  { latitude: 10.29967, longitude: 123.88941 },
  { latitude: 10.29948, longitude: 123.88899 },
  { latitude: 10.29851, longitude: 123.88771 },
  { latitude: 10.29919, longitude: 123.8873 },
  { latitude: 10.30032, longitude: 123.88678 },
];

export const route01C: RouteDefinition = {
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
  coordinates: kmlCoordinates01C,
  returnCoordinates: returnCoordinates01C,
};

export default route01C;

