import { useRideButton } from '@/contexts/RideButtonContext';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.15;

const routes = () => {
  const panY = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const startPosition = useRef(BOTTOM_SHEET_MIN_HEIGHT);
  const scrollViewRef = useRef(null);
  const [enableScrolling, setEnableScrolling] = useState(false);
  const { setShowRideButton } = useRideButton();
  const [selectedRoute, setSelectedRoute] = useState<{ id: number; code: string; description: string } | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
 
  const routesList = [
    { id: 1, code: '01C', description: 'Private to colon' },
    { id: 2, code: '01K', description: 'Urgello to Parkmall' },
    { id: 3, code: '02B', description: 'CSBT to Colon' },
    { id: 4, code: '03A', description: 'Mabolo to Carbon' },
    { id: 5, code: '03B', description: 'Mabolo to Carbon' },
    { id: 6, code: '03L', description: 'Mabolo to Carbon' },
    { id: 7, code: '03Q', description: 'Ayala to SM City' },
    { id: 8, code: '04B', description: 'Lahug to Carbon' },
    { id: 9, code: '05B', description: 'test' },
    { id: 10, code: '06B', description: 'test2' },
    { id: 11, code: '67B', description: 'dawg' },
  ];

  const handleRoutePress = (route: { id: number; code: string; description: string }) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const closeRouteModal = () => {
    setShowRouteModal(false);
    setSelectedRoute(null);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start responding if there's significant vertical movement
        // and we're not at max height or scrolling is disabled
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
        const velocity = -gestureState.vy; // negative because dy is opposite
        
        // Determine target based on velocity and position
        let targetValue;
        
        if (Math.abs(velocity) > 0.5) {
          // Fast swipe - use velocity to decide
          targetValue = velocity > 0 ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
        } else if (Math.abs(gestureState.dy) > 50) {
          // Slow but significant drag
          targetValue = gestureState.dy < 0 ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
        } else {
          // Small movement - snap to nearest
          const midpoint = (BOTTOM_SHEET_MAX_HEIGHT + BOTTOM_SHEET_MIN_HEIGHT) / 2;
          targetValue = currentValue > midpoint ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
        }
        
        const willExpand = targetValue === BOTTOM_SHEET_MAX_HEIGHT;
        setIsExpanded(willExpand);
        setEnableScrolling(willExpand);
        setShowRideButton(!willExpand); // Hide ride button when expanded, show when collapsed
        
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
    <View className="flex-1 items-center bg-secondary">
      <Text className="text-5xl text-primary top-64 font-bold">Routes</Text>
     
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
           
            {/* Dynamic Route Items */}
            {routesList.map((route) => (
              <TouchableOpacity 
                key={route.id} 
                className="bg-purple-300 rounded-2xl p-4 mb-3 flex-row justify-between items-center active:opacity-70"
                onPress={() => handleRoutePress(route)}
              >
                <Text className="font-bold">{route.code}</Text>
                <Text className="flex-1 ml-4 font-semibold">{route.description}</Text>
                <Text className="text-xl">›</Text>
              </TouchableOpacity>
            ))}
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
              <View className="bg-primary rounded-lg px-4 py-2 mb-3">
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
              <Text className="text-lg font-semibold text-gray-700 mb-2">Route Information:</Text>
              <Text className="text-base text-gray-600 leading-6">
                This is a public transportation route serving the Cebu City area. 
                Please check with local operators for current schedules and fares.
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={closeRouteModal}
              className="bg-primary rounded-lg py-3"
            >
              <Text className="text-center font-semibold text-white text-lg">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default routes;