import 'dotenv/config';

export default {

  name: 'JeepGo',
  slug: 'JeepGo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/JeepGo_Logo.png',
  scheme: 'jeepgo',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    adaptiveIcon: {
      backgroundColor: '#D0C9EA',
      foregroundImage: './assets/images/JeepGo_Logo.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.monkefishe.JeepGo',
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'jeepgo' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/JeepGo_Logo.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/JeepGo_Logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#D0C9EA',
        dark: {
          backgroundColor: '#524F81',
        },
      },
    ],
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '826545e3-cf2a-43b6-ac95-08c7c4b49458',
    },
  },
  owner: 'monkefishe',
}
