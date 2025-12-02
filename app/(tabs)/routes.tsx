import { citUToEmallRoute } from '@/assets/routes/citu-to-emall';
import { route01CPrivateToColon } from '@/assets/routes/route-01c-private-to-colon';
import { route01KUrgelloToParkmall } from '@/assets/routes/route-01k-urgello-to-parkmall';
import { route02BCsbtToColon } from '@/assets/routes/route-02b-csbt-to-colon';
import { route03AMaboloToCarbon } from '@/assets/routes/route-03a-mabolo-to-carbon';
import { route03QAyalaToSmCity } from '@/assets/routes/route-03q-ayala-to-sm-city';
import { useRideButton } from '@/contexts/RideButtonContext';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

const routes = () => {
  const panY = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const startPosition = useRef(BOTTOM_SHEET_MIN_HEIGHT);
  const scrollViewRef = useRef(null);
  const [enableScrolling, setEnableScrolling] = useState(false);
  const { setShowRideButton } = useRideButton();
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [visibleRoutes, setVisibleRoutes] = useState<Set<number>>(new Set());

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

  // Extract start and end points for 01C route
  const uscStart = {
    latitude: route01CPrivateToColon.features[1].geometry.coordinates[1] as number,
    longitude: route01CPrivateToColon.features[1].geometry.coordinates[0] as number
  };
  
  const colonEnd = {
    latitude: route01CPrivateToColon.features[3].geometry.coordinates[1] as number,
    longitude: route01CPrivateToColon.features[3].geometry.coordinates[0] as number
  };
  
  // Define routes with their waypoints
  const routesList = [
    { 
      id: 1, 
      code: '01C', 
      description: 'Private to Colon',
      color: '#FF6B6B',
      waypoints: route01CWaypoints,
      startPoint: uscStart,
      endPoint: colonEnd
    },
    { 
      id: 2, 
      code: '01K', 
      description: 'Urgello to Parkmall',
      color: '#4ECDC4',
      waypoints: route01KWaypoints,
      startPoint: urgelloStart,
      endPoint: parkmallEnd
    },
    { 
      id: 3, 
      code: '02B', 
      description: 'CSBT to Colon',
      color: '#FFD93D',
      waypoints: route02BWaypoints,
      startPoint: csbtStart,
      endPoint: pier3End
    },
    { 
      id: 4, 
      code: '03A', 
      description: 'Mabolo to Carbon',
      color: '#95E1D3',
      waypoints: route03AWaypoints,
      startPoint: maboloStart,
      endPoint: carbonEnd
    },
    { 
      id: 5, 
      code: '06B', 
      description: 'Talamban to Colon',
      color: '#A8E6CF',
      waypoints: [
        { latitude: 10.3700, longitude: 123.8700 },
        { latitude: 10.3650, longitude: 123.8750 },
        { latitude: 10.3600, longitude: 123.8800 }, // End point
      ]
    },
    { 
      id: 6, 
      code: '69B', 
      description: 'CIT-U to Emall',
      color: '#FF8B94',
      waypoints: citUToEmallWaypoints,
      startPoint: citUStart,
      endPoint: emallEnd
    },
    {
      id: 7,
      code: '03Q',
      description: 'Ayala to SM City Cebu',
      color: '#6C63FF',
      waypoints: route03QWaypoints,
      startPoint: ayalaStart,
      endPoint: smEnd
    },
  ];

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
        setShowRideButton(!willExpand);
        
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

  // Ensure header/footer are restored when leaving this screen
  useEffect(() => {
    return () => {
      setShowRideButton(true);
    };
  }, [setShowRideButton]);

  return (
    <View className="flex-1">
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
        {routesList
          .filter(route => visibleRoutes.has(route.id))
          .map((route) => (
            <Polyline
              key={`polyline-${route.id}`}
              coordinates={route.waypoints}
              strokeColor={route.color}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ))}

        {/* Start and End Markers for visible routes only */}
        {routesList
          .filter(route => visibleRoutes.has(route.id))
          .map((route) => (
            <React.Fragment key={`markers-${route.id}`}>
              {/* Start Marker */}
              <Marker
                coordinate={route.startPoint || route.waypoints[0]}
                title={`${route.code} Start`}
                description={route.description}
                pinColor={route.color}
                onPress={() => handleRoutePress(route)}
              />
              {/* End Marker */}
              <Marker
                coordinate={route.endPoint || route.waypoints[route.waypoints.length - 1]}
                title={`${route.code} End`}
                description={route.description}
                pinColor={route.color}
                onPress={() => handleRoutePress(route)}
              />
            </React.Fragment>
          ))}
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
            {routesList.map((route) => {
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
                  <Text className={`flex-1 ml-4 font-semibold ${isVisible ? 'text-white' : 'text-gray-600'}`}>
                    {route.description}
                  </Text>
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

export default routes;