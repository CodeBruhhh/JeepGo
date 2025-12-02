const route04M = {
  code: '04M',
  label: '04M - JY Square Mall to Ayala Terminal',
  stops: [
    'JY Square Mall',
    'University of Southern Philippines',
    'Cebu IT Park',
    'Waterfront Hotel',
    'Ayala Public Utility Vehicle Terminal',
  ],
  // Coordinates extracted from KML (JY Square Mall to Ayala Terminal route).
  coordinates: [
    { latitude: 10.33061, longitude: 123.897956 },
    { latitude: 10.330678, longitude: 123.898042 },
    { latitude: 10.330821, longitude: 123.898283 },
    { latitude: 10.330826, longitude: 123.89868 },
    { latitude: 10.330641, longitude: 123.899158 },
    { latitude: 10.330113, longitude: 123.900182 },
    { latitude: 10.329586, longitude: 123.901277 },
    { latitude: 10.329269, longitude: 123.901931 },
    { latitude: 10.328915, longitude: 123.902682 },
    { latitude: 10.328842, longitude: 123.902859 },
    { latitude: 10.328024, longitude: 123.904463 },
    { latitude: 10.327923, longitude: 123.904662 },
    { latitude: 10.327169, longitude: 123.906024 },
    { latitude: 10.326736, longitude: 123.906641 },
    { latitude: 10.326071, longitude: 123.907451 },
    { latitude: 10.325934, longitude: 123.907526 },
    { latitude: 10.325749, longitude: 123.907322 },
    { latitude: 10.325337, longitude: 123.907022 },
    { latitude: 10.325242, longitude: 123.906941 },
    { latitude: 10.325073, longitude: 123.906936 },
    { latitude: 10.324393, longitude: 123.906485 },
    { latitude: 10.323517, longitude: 123.905895 },
    { latitude: 10.322487, longitude: 123.905219 },
    { latitude: 10.321722, longitude: 123.904694 },
    { latitude: 10.320814, longitude: 123.904109 },
    { latitude: 10.320466, longitude: 123.903921 },
    { latitude: 10.320054, longitude: 123.903717 },
    { latitude: 10.319785, longitude: 123.903573 },
    { latitude: 10.31892, longitude: 123.903197 },
    { latitude: 10.318914, longitude: 123.903283 },
    { latitude: 10.31892, longitude: 123.903385 },
    { latitude: 10.318867, longitude: 123.903449 },
    { latitude: 10.318825, longitude: 123.90354 },
    { latitude: 10.318793, longitude: 123.903642 },
    { latitude: 10.318798, longitude: 123.903707 },
    { latitude: 10.318867, longitude: 123.903717 },
    { latitude: 10.31892, longitude: 123.903712 },
    { latitude: 10.318978, longitude: 123.903621 },
    { latitude: 10.318983, longitude: 123.903524 },
    { latitude: 10.318925, longitude: 123.903481 },
  ],
};

export type RouteDefinition = {
  code: string;
  label: string;
  stops: string[];
  coordinates?: { latitude: number; longitude: number }[];
};

const exportObj: RouteDefinition & { coordinates?: { latitude: number; longitude: number }[] } = {
  code: route04M.code,
  label: route04M.label,
  stops: route04M.stops,
  coordinates: route04M.coordinates,
};

export default exportObj;
