const route04L = {
  code: '04L',
  label: '04L - Lahug to SM via Ayala',
  stops: [
    'Lahug',
    'Lahug Barangay Hall',
    'JY Square Mall',
    'The Church of Christ of Latter Day Saints Temple',
    'University of the Philippines Cebu',
    'The Golden Peak Hotel',
    'Cebu Parklane Hotel',
    'Pag-Ibig Fund Cebu Office',
    'Insular Life Cebu Business Center',
    'Keppel Tower Cebu Business Park',
    'Pope John Paul II Ave',
    'Camelita Monastery',
    'St. Joseph Parish',
    'SM City Cebu',
  ],
  // Coordinates extracted from KML (Lahug to SM via Ayala route).
  coordinates: [
    { latitude: 10.33117, longitude: 123.89808 },
    { latitude: 10.32895, longitude: 123.89736 },
    { latitude: 10.32862, longitude: 123.89737 },
    { latitude: 10.32691, longitude: 123.89788 },
    { latitude: 10.32496, longitude: 123.89815 },
    { latitude: 10.32141, longitude: 123.89892 },
    { latitude: 10.31989, longitude: 123.8993 },
    { latitude: 10.31859, longitude: 123.89985 },
    { latitude: 10.31854, longitude: 123.89993 },
    { latitude: 10.31914, longitude: 123.90135 },
    { latitude: 10.32036, longitude: 123.90366 },
    { latitude: 10.32004, longitude: 123.90445 },
    { latitude: 10.32002, longitude: 123.90478 },
    { latitude: 10.32007, longitude: 123.90541 },
    { latitude: 10.31991, longitude: 123.90574 },
    { latitude: 10.31838, longitude: 123.90783 },
    { latitude: 10.3184, longitude: 123.90803 },
    { latitude: 10.31946, longitude: 123.9091 },
    { latitude: 10.32055, longitude: 123.9108 },
    { latitude: 10.31666, longitude: 123.91321 },
    { latitude: 10.3138, longitude: 123.91487 },
    { latitude: 10.31339, longitude: 123.91518 },
    { latitude: 10.312397, longitude: 123.916149 },
    { latitude: 10.312275, longitude: 123.916007 },
    { latitude: 10.311869, longitude: 123.915503 },
    { latitude: 10.311518, longitude: 123.915092 },
    { latitude: 10.310871, longitude: 123.914285 },
    { latitude: 10.310745, longitude: 123.914379 },
    { latitude: 10.310172, longitude: 123.914786 },
    { latitude: 10.311053, longitude: 123.915862 },
    { latitude: 10.311668, longitude: 123.916592 },
  ],
};

export type RouteDefinition = {
  code: string;
  label: string;
  stops: string[];
  coordinates?: { latitude: number; longitude: number }[];
};

const exportObj: RouteDefinition & { coordinates?: { latitude: number; longitude: number }[] } = {
  code: route04L.code,
  label: route04L.label,
  stops: route04L.stops,
  coordinates: route04L.coordinates,
};

export default exportObj;
