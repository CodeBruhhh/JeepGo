import { routesMap } from '@/assets/routes';
import { citUToEmallRoute } from '@/assets/routes/citu-to-emall';
import { route01CPrivateToColon } from '@/assets/routes/route-01c-private-to-colon';
import { route01KUrgelloToParkmall } from '@/assets/routes/route-01k-urgello-to-parkmall';
import { route02BCsbtToColon } from '@/assets/routes/route-02b-csbt-to-colon';
import { route03AMaboloToCarbon } from '@/assets/routes/route-03a-mabolo-to-carbon';
import { route03QAyalaToSmCity } from '@/assets/routes/route-03q-ayala-to-sm-city';
import { route04BLahugToCarbon } from '@/assets/routes/route-04b-lahug-to-carbon';
import { route04HPlazaHousingToCarbon } from '@/assets/routes/route-04h-plaza-housing-to-carbon';
import { route04IPlazaHousingToCarbon } from '@/assets/routes/route-04i-plaza-housing-to-carbon';
import { useNavigationContext } from '@/contexts/NavigationContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.15;

// Cebu City coordinates
const CEBU_CITY_REGION = {
  latitude: 10.3157,
  longitude: 123.8854,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const RoutesScreen = () => {
  const panY = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const startPosition = useRef(BOTTOM_SHEET_MIN_HEIGHT);
  const scrollViewRef = useRef(null);
  const [enableScrolling, setEnableScrolling] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [visibleRoutes, setVisibleRoutes] = useState<Set<number>>(new Set());
  const { setShowBar, headerRef } = useNavigationContext();

  // Show/hide header and footer based on bottom sheet state
  useEffect(() => {
    if (isExpanded) {
      // Hide header and footer when expanded
      setShowBar(false);
      headerRef.current?.hideHeader();
    } else {
      // Show header and footer when collapsed
      setShowBar(true);
      headerRef.current?.showHeader();
    }
  }, [isExpanded, setShowBar, headerRef]);

  // Extract coordinates from GeoJSON
  const citUToEmallWaypoints = citUToEmallRoute.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  // Extract start and end points for CIT-U to Emall
  const citUStart = {
    latitude: citUToEmallRoute.features[1].geometry.coordinates[1] as number,
    longitude: citUToEmallRoute.features[1].geometry.coordinates[0] as number
  };
  
  const emallEnd = {
    latitude: citUToEmallRoute.features[2].geometry.coordinates[1] as number,
    longitude: citUToEmallRoute.features[2].geometry.coordinates[0] as number
  };

  // Extract coordinates for 01C Private to Colon route
  const route01CWaypoints = route01CPrivateToColon.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const route01KWaypoints = route01KUrgelloToParkmall.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const urgelloStart = route01KUrgelloToParkmall.features[1]?.geometry?.coordinates
    ? {
        latitude: route01KUrgelloToParkmall.features[1].geometry.coordinates[1] as number,
        longitude: route01KUrgelloToParkmall.features[1].geometry.coordinates[0] as number
      }
    : undefined;

  const parkmallEnd = route01KUrgelloToParkmall.features[3]?.geometry?.coordinates
    ? {
        latitude: route01KUrgelloToParkmall.features[3].geometry.coordinates[1] as number,
        longitude: route01KUrgelloToParkmall.features[3].geometry.coordinates[0] as number
      }
    : undefined;

  const route02BWaypoints = route02BCsbtToColon.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const csbtStart = route02BCsbtToColon.features[2]?.geometry?.coordinates
    ? {
        latitude: route02BCsbtToColon.features[2].geometry.coordinates[1] as number,
        longitude: route02BCsbtToColon.features[2].geometry.coordinates[0] as number
      }
    : undefined;

  const pier3End = route02BCsbtToColon.features[3]?.geometry?.coordinates
    ? {
        latitude: route02BCsbtToColon.features[3].geometry.coordinates[1] as number,
        longitude: route02BCsbtToColon.features[3].geometry.coordinates[0] as number
      }
    : undefined;

  const route03AWaypoints = route03AMaboloToCarbon.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const maboloStart = route03AMaboloToCarbon.features[1]?.geometry?.coordinates
    ? {
        latitude: route03AMaboloToCarbon.features[1].geometry.coordinates[1] as number,
        longitude: route03AMaboloToCarbon.features[1].geometry.coordinates[0] as number
      }
    : undefined;

  const carbonEnd = route03AMaboloToCarbon.features[3]?.geometry?.coordinates
    ? {
        latitude: route03AMaboloToCarbon.features[3].geometry.coordinates[1] as number,
        longitude: route03AMaboloToCarbon.features[3].geometry.coordinates[0] as number
      }
    : undefined;

  const route03QWaypoints = route03QAyalaToSmCity.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const ayalaStart = route03QAyalaToSmCity.features[1]?.geometry?.coordinates
    ? {
        latitude: route03QAyalaToSmCity.features[1].geometry.coordinates[1] as number,
        longitude: route03QAyalaToSmCity.features[1].geometry.coordinates[0] as number
      }
    : undefined;

  const smEnd = route03QAyalaToSmCity.features[2]?.geometry?.coordinates
    ? {
        latitude: route03QAyalaToSmCity.features[2].geometry.coordinates[1] as number,
        longitude: route03QAyalaToSmCity.features[2].geometry.coordinates[0] as number
      }
    : undefined;

  const route04BWaypoints = route04BLahugToCarbon.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const lahugStart = route04BLahugToCarbon.features[1]?.geometry?.coordinates
    ? {
        latitude: route04BLahugToCarbon.features[1].geometry.coordinates[1] as number,
        longitude: route04BLahugToCarbon.features[1].geometry.coordinates[0] as number
      }
    : undefined;

  const carbonEnd04B = route04BLahugToCarbon.features[2]?.geometry?.coordinates
    ? {
        latitude: route04BLahugToCarbon.features[2].geometry.coordinates[1] as number,
        longitude: route04BLahugToCarbon.features[2].geometry.coordinates[0] as number
      }
    : undefined;

  const route04HWaypoints = route04HPlazaHousingToCarbon.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const plazaHousingStart = route04HPlazaHousingToCarbon.features[1]?.geometry?.coordinates
    ? {
        latitude: route04HPlazaHousingToCarbon.features[1].geometry.coordinates[1] as number,
        longitude: route04HPlazaHousingToCarbon.features[1].geometry.coordinates[0] as number
      }
    : undefined;

  const carbonEnd04H = route04HPlazaHousingToCarbon.features[2]?.geometry?.coordinates
    ? {
        latitude: route04HPlazaHousingToCarbon.features[2].geometry.coordinates[1] as number,
        longitude: route04HPlazaHousingToCarbon.features[2].geometry.coordinates[0] as number
      }
    : undefined;

  const route04IWaypoints = route04IPlazaHousingToCarbon.features[0].geometry.coordinates.map((coord: any) => ({
    latitude: coord[1] as number,
    longitude: coord[0] as number
  }));

  const plazaHousingStart04I = route04IPlazaHousingToCarbon.features[1]?.geometry?.coordinates
    ? {
        latitude: route04IPlazaHousingToCarbon.features[1].geometry.coordinates[1] as number,
        longitude: route04IPlazaHousingToCarbon.features[1].geometry.coordinates[0] as number
      }
    : undefined;

  const carbonEnd04I = route04IPlazaHousingToCarbon.features[2]?.geometry?.coordinates
    ? {
        latitude: route04IPlazaHousingToCarbon.features[2].geometry.coordinates[1] as number,
        longitude: route04IPlazaHousingToCarbon.features[2].geometry.coordinates[0] as number
      }
    : undefined;

  // Extract start and end points for 01C route
  const uscStart = {
    latitude: route01CPrivateToColon.features[1].geometry.coordinates[1] as number,
    longitude: route01CPrivateToColon.features[1].geometry.coordinates[0] as number
  };
  
  const colonEnd = {
    latitude: route01CPrivateToColon.features[3].geometry.coordinates[1] as number,
    longitude: route01CPrivateToColon.features[3].geometry.coordinates[0] as number
  };
  
  // Define routes with their waypoints (ordered by route code)
  const routesList = [
    { id: 1, code: '01C - Private to Colon', description: 'Private to Colon', color: '#1E90FF', waypoints: route01CWaypoints || [], startPoint: uscStart, endPoint: colonEnd },
    { id: 2, code: '01K - Urgello to Parkmall', description: 'Urgello to Parkmall', color: '#00CED1', waypoints: route01KWaypoints || [], startPoint: urgelloStart, endPoint: parkmallEnd },
    { id: 3, code: '02B - South Bus Terminal to Colon', description: 'South Bus Terminal to Colon', color: '#20B2AA', waypoints: route02BWaypoints || [], startPoint: csbtStart, endPoint: pier3End },
    { id: 4, code: '03A - Mabolo to Carbon', description: 'Mabolo to Carbon', color: '#7B68EE', waypoints: route03AWaypoints || [], startPoint: maboloStart, endPoint: carbonEnd },
    { id: 5, code: '03Q - Ayala to SM', description: 'Ayala to SM', color: '#8A2BE2', waypoints: route03QWaypoints || [], startPoint: ayalaStart, endPoint: smEnd },
    { id: 6, code: '04B - Lahug to Carbon', description: 'Lahug to Carbon', color: '#FF1493', waypoints: route04BWaypoints || [], startPoint: lahugStart, endPoint: carbonEnd04B },
    { id: 7, code: '04H - Plaza Housing to Carbon', description: 'Plaza Housing to Carbon', color: '#FF7F50', waypoints: route04HWaypoints || [], startPoint: plazaHousingStart, endPoint: carbonEnd04H },
    { id: 8, code: '04I - Plaza Housing to Carbon', description: 'Plaza Housing to Carbon', color: '#00FA9A', waypoints: route04IWaypoints || [], startPoint: plazaHousingStart04I, endPoint: carbonEnd04I },
  ];

  // Build routes from generated/converted KML files (generated by scripts/convert-kml-to-ts.js)
  // Build a set of existing jeep numeric codes (like '01C') from manual routes to avoid duplicates
  const existingCodes = new Set(
    routesList
      .map(r => {
        const m = (r.code || '').toString().match(/(\d{1,3}[A-Za-z]?)/);
        return m ? m[1].toUpperCase() : null;
      })
      .filter(Boolean)
  );

  const palette = ['#1E90FF','#00CED1','#20B2AA','#7B68EE','#00BFFF','#3CB371','#8A2BE2','#FF1493','#FF7F50','#00FA9A'];

  // Desired naming for generated routes (jeep code -> display label)
  const desiredNames: Record<string, string> = {
    '01C': '01C - Private to Colon',
    '01K': '01K - Urgello to Parkmall',
    '02B': '02B - South Bus Terminal to Colon',
    '01A': 'MI-01A - Mactan to Punta Engaño',
    '03A': '03A - Mabolo to Carbon',
    '03B': '03B - Mabolo to Carbon',
    '03L': '03L - Mabolo to Carbon',
    '03Q': '03Q - Ayala to SM',
    '04B': '04B - Lahug to Carbon',
    '04H': '04H - Plaza Housing to Carbon',
    '04I': '04I - Plaza Housing to Carbon',
    '04L': '04L - Lahug to Ayala',
    '04M': '04M - Lahug to Ayala',
    '06B': '06B - Guadalupe to Carbon',
    '06C': '06C - Guadalupe to Carbon',
    '06G': '06G - Guadalupe to Tabo-an',
    '06H': '06H - Guadalupe to SM',
    '07B': '07B - Banawa to Carbon',
    '08F': '08F - Alumnos to SM',
    '08G': '08G - Alumnos to Colon',
    '09C': '09C - Basak to Colon',
    '09F': '09F - Basak to Ibabao',
    '09G': '09G - Basak to Colon',
    '10F': '10F - Bulacao to Colon',
    '10G': '10G - Pardo to Magallanes',
    '10H': '10H - Bulacao to SM',
    '10M': '10M - Bulacao to SM',
    '11A': '11A - Inayawan to Colon',
    '12D': '12D - Labangon to Colon',
    '12G': '12G - Labangon to SM',
    '12I': '12I - Labangon to SM',
    '12L': '12L - Labangon to Ayala',
    '13B': '13B - Talamban to Carbon',
    '13C': '13C - Talamban to Colon',
    '13H': '13H - Pit-os to Mandaue',
    '14D': '14D - Ayala to Colon',
    '17B': '17B - Apas to Carbon',
    '17C': '17C - Apas to Carbon',
    '17D': '17D - Apas to Carbon',
    '20A': '20A - Ayala to Mandaue',
    '21A': '21A - Mandaue to Cathedral',
    '22A': '22A - Mandaue to Cathedral',
    '22D': '22D - Mandaue to Cathedral',
    '22I': '22I - Mandaue to Gaisano',
    '23': '23 - Parkmall to Punta Engaño',
    '23D': '23D - Parkmall to Opon',
    '62B': '62B - Pit-os to Carbon'
  };

  const generatedRoutes = Object.keys(routesMap || {}).map((key, idx) => {
    try {
      const r: any = (routesMap as any)[key];
      const coords: any[] = r?.features?.[0]?.geometry?.coordinates || [];
      const waypoints = coords.map((c: any) => ({ latitude: c[1], longitude: c[0] }));

      // Attempt to extract jeep code (like 01C, 21A, 6B) from the file key
      const codeMatch = key.match(/(\d{1,3}[A-Za-z]?)/i);
      const jeepCode = codeMatch ? codeMatch[1].toUpperCase() : null;

      // Build a readable route label from the key by removing common tokens
      const stopWords = new Set(['cebu','jeepney','jeepneys','route','routes','no','mi','the','to','from','cebu','route','sign','board','even','odd']);
      const tokens = key.split(/[-_]/).map(t => t.replace(/[^a-z0-9]/ig, '')).filter(Boolean);
      const labelTokens = tokens.filter(t => !stopWords.has(t.toLowerCase()) && t.toLowerCase() !== (jeepCode || '').toLowerCase());
      const label = labelTokens.join(' ').trim() || key.replace(/[-_]/g, ' ');


  // If jeep code already exists in manual routes, skip this generated route to avoid duplicates
  if (jeepCode && existingCodes.has(jeepCode)) return null;

  const displayCode = jeepCode ? (desiredNames[jeepCode] || `${jeepCode} - ${label}`) : label.toUpperCase();

      return {
        id: 1000 + idx,
        code: displayCode,
        description: label,
        color: palette[idx % palette.length],
        waypoints,
        startPoint: waypoints[0],
        endPoint: waypoints[waypoints.length - 1]
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean as any);

  // Combine and sort by jeep numeric code (if available) then by any letter suffix
  const allRoutes = routesList.concat(generatedRoutes).sort((a: any, b: any) => {
    const extract = (s: string) => {
      const m = (s || '').match(/(\d{1,3})([A-Za-z])?/);
      if (!m) return { num: Infinity, letter: '' };
      return { num: parseInt(m[1], 10), letter: (m[2] || '').toUpperCase() };
    };
    const A = extract(a.code);
    const B = extract(b.code);
    if (A.num !== B.num) return A.num - B.num;
    if (A.letter < B.letter) return -1;
    if (A.letter > B.letter) return 1;
    return 0;
  });

  // If MI-01A exists (converted from 01A) move it to the bottom of the list
  try {
    const miIndex = allRoutes.findIndex((r: any) => typeof r.code === 'string' && r.code.startsWith('MI-01A'));
    if (miIndex > -1) {
      const [miRoute] = allRoutes.splice(miIndex, 1);
      allRoutes.push(miRoute);
    }
  } catch (e) {
    // ignore
  }

  const handleRoutePress = (route: any) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const closeRouteModal = () => {
    setShowRouteModal(false);
    setSelectedRoute(null);
  };

  const toggleRouteVisibility = (routeId: number) => {
    setVisibleRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const clearAllRoutes = () => {
    setVisibleRoutes(new Set());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && !enableScrolling;
      },
      onPanResponderGrant: () => {
        panY.stopAnimation((value) => {
          startPosition.current = value;
        });
      },
      onPanResponderMove: (event, gestureState) => {
        const newValue = startPosition.current - gestureState.dy;
        const clampedValue = Math.max(
          BOTTOM_SHEET_MIN_HEIGHT, 
          Math.min(newValue, BOTTOM_SHEET_MAX_HEIGHT)
        );
        panY.setValue(clampedValue);
      },
      onPanResponderRelease: (event, gestureState) => {
        const currentValue = startPosition.current - gestureState.dy;
        const velocity = -gestureState.vy;
        
        let targetValue;
        
        if (Math.abs(velocity) > 0.5) {
          targetValue = velocity > 0 ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
        } else if (Math.abs(gestureState.dy) > 50) {
          targetValue = gestureState.dy < 0 ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
        } else {
          const midpoint = (BOTTOM_SHEET_MAX_HEIGHT + BOTTOM_SHEET_MIN_HEIGHT) / 2;
          targetValue = currentValue > midpoint ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
        }
        
        const willExpand = targetValue === BOTTOM_SHEET_MAX_HEIGHT;
        setIsExpanded(willExpand);
        setEnableScrolling(willExpand);
        
        Animated.spring(panY, {
          toValue: targetValue,
          velocity: velocity,
          tension: 50,
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const animatedStyle = {
    height: panY,
    bottom: 0,
  };

  return (
    <View className="flex-1">
      {/* Back button */}
      <TouchableOpacity
        className="absolute top-12 left-4 bg-white p-3 rounded-full z-50"
        style={styles.shadow}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={CEBU_CITY_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Draw route polylines - only for visible routes */}
        {allRoutes
          .filter(route => visibleRoutes.has(route.id))
          .map((route) => (
            route.waypoints && route.waypoints.length > 1 ? (
              <Polyline
                key={`polyline-${route.id}`}
                coordinates={route.waypoints}
                strokeColor={route.color}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            ) : null
          ))}

        {/* Start and End Markers for visible routes only */}
        {allRoutes
          .filter(route => visibleRoutes.has(route.id))
          .map((route) => {
            const startCoord = route.startPoint || route.waypoints?.[0];
            const endCoord = route.endPoint || (route.waypoints && route.waypoints.length ? route.waypoints[route.waypoints.length - 1] : undefined);
            return (
              <React.Fragment key={`markers-${route.id}`}>
                {startCoord && (
                  <Marker
                    coordinate={startCoord}
                    title={`${route.code} Start`}
                    description={route.description}
                    pinColor={route.color}
                    onPress={() => handleRoutePress(route)}
                  />
                )}
                {endCoord && (
                  <Marker
                    coordinate={endCoord}
                    title={`${route.code} End`}
                    description={route.description}
                    pinColor={route.color}
                    onPress={() => handleRoutePress(route)}
                  />
                )}
              </React.Fragment>
            );
          })}
      </MapView>

      {/* Routes Title Overlay */}
      <View className="absolute top-12 left-0 right-0 items-center">
        <View className="bg-white/90 rounded-2xl px-6 py-3 shadow-lg">
          <Text className="text-3xl text-primary font-bold">Routes</Text>
        </View>
      </View>
     
      <Animated.View
        style={[animatedStyle]}
        className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-lg"
      >
        {/* Drag Handle - Always draggable */}
        <View className="items-center py-3" {...panResponder.panHandlers}>
          <View className="w-12 h-1.5 bg-gray-400 rounded-full" />
        </View>
       
        {/* Content with ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={enableScrolling}
          showsVerticalScrollIndicator={true}
          bounces={true}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-4 pb-6">
            <Text className="text-2xl font-bold text-center mb-4">CEBU CITY ROUTES</Text>
           
            {/* Clear All Routes Button */}
            {visibleRoutes.size > 0 && (
              <TouchableOpacity 
                className="bg-gray-500 rounded-2xl p-4 mb-3 flex-row justify-center items-center active:opacity-70"
                onPress={clearAllRoutes}
              >
                <Text className="font-bold text-white text-center">Clear All Routes</Text>
              </TouchableOpacity>
            )}

            {/* Dynamic Route Items */}
            {allRoutes.map((route) => {
              const isVisible = visibleRoutes.has(route.id);
              return (
                <TouchableOpacity 
                  key={route.id} 
                  className="rounded-2xl p-4 mb-3 flex-row justify-between items-center active:opacity-70"
                  style={{ 
                    backgroundColor: isVisible ? route.color : '#E5E7EB',
                    opacity: isVisible ? 1 : 0.6
                  }}
                  onPress={() => toggleRouteVisibility(route.id)}
                >
                        <Text className={`font-bold ${isVisible ? 'text-white' : 'text-gray-600'}`}>
                          {route.code}
                        </Text>
                        {/* description hidden by design */}
                  <Text className={`text-xl ${isVisible ? 'text-white' : 'text-gray-600'}`}>
                    {isVisible ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Route Details Modal */}
      <Modal
        visible={showRouteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeRouteModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View 
                className="rounded-lg px-4 py-2 mb-3"
                style={{ backgroundColor: selectedRoute?.color }}
              >
                <Text className="text-white font-bold text-xl">{selectedRoute?.code}</Text>
              </View>
              <Text className="text-2xl font-bold text-primary text-center">
                Route Details
              </Text>
            </View>
            
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Description:</Text>
              <Text className="text-base text-gray-600 leading-6">
                {selectedRoute?.description}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Route Stops:</Text>
              <Text className="text-base text-gray-600 leading-6">
                {selectedRoute?.waypoints?.length || 0} waypoints
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Route Information:</Text>
              <Text className="text-base text-gray-600 leading-6">
                This is a public transportation route serving the Cebu City area. 
                Please check with local operators for current schedules and fares.
              </Text>
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => {
                  if (selectedRoute) {
                    toggleRouteVisibility(selectedRoute.id);
                  }
                  closeRouteModal();
                }}
                className="flex-1 bg-green-500 rounded-lg py-3"
              >
                <Text className="text-center font-semibold text-white text-lg">
                  {selectedRoute && visibleRoutes.has(selectedRoute.id) ? 'Hide Route' : 'Show Route'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeRouteModal}
                className="flex-1 bg-primary rounded-lg py-3"
              >
                <Text className="text-center font-semibold text-white text-lg">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RoutesScreen;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});