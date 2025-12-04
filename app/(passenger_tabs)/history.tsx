import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Layout, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface TravelHistory {
  id: string;
  date: string;
  from: string;
  to: string;
  routeId: string;
  duration: string;
  payment: string;
  distance: string;
  method: string;
  pickupTime?: string;
  arrivalTime?: string;
  passengerType?: string;
  plateNo?: string;
}

const history = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [travelHistory, setTravelHistory] = useState<TravelHistory[]>([
    {
      id: '1',
      date: 'September 08, 2025',
      from: 'Parkmall',
      to: 'Urgello',
      routeId: '01K',
      duration: '30 mins',
      payment: 'P 15.00',
      distance: '8.2 km',
      method: 'Gcash',
      pickupTime: '1:28 PM',
      arrivalTime: '1:29 PM',
      passengerType: 'Regular',
      plateNo: 'ABC 143',
    },
    {
      id: '2',
      date: 'September 08, 2025',
      from: 'Capitol',
      to: 'Ayala',
      routeId: '12L',
      duration: '45 mins',
      payment: 'P 25.00',
      distance: '10.6 km',
      method: 'Gcash',
      pickupTime: '2:15 PM',
      arrivalTime: '3:00 PM',
      passengerType: 'Regular',
      plateNo: 'XYZ 789',
    },
  ]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteHistory = (id: string) => {
    setTravelHistory(travelHistory.filter(item => item.id !== id));
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const renderStars = (rating: number = 0) => {
    return (
      <View className="flex-row justify-center" style={{ gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <View key={star} style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color="#FFD700"
            />
          </View>
        ))}
      </View>
    );
  };

  const HistoryCard = ({ item }: { item: TravelHistory }) => {
    const isExpanded = expandedId === item.id;
    const height = useSharedValue(0);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
      if (isExpanded) {
        opacity.value = withTiming(1, { duration: 200 });
        height.value = withTiming(350, { duration: 300 });
      } else {
        opacity.value = withTiming(0, { duration: 200 });
        height.value = withTiming(0, { duration: 300 });
      }
    }, [isExpanded]);

    const animatedStyle = useAnimatedStyle(() => ({
      height: height.value,
      opacity: opacity.value,
      overflow: 'hidden',
    }));

    return (
      <Animated.View
        layout={Layout.springify()}
        className="mb-4 overflow-hidden"
        style={{
          width: 320,
          backgroundColor: '#C3B1E1',
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {/* Violet Header */}
        <View 
          className="py-3 px-4"
          style={{ backgroundColor: '#CDA678' }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-black text-xl" style={{ fontFamily: 'System' }}>
              {item.date}
            </Text>
            <TouchableOpacity onPress={() => deleteHistory(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* White Card Content */}
        <View 
          className="p-4"
          style={{ 
            backgroundColor: '#FFFFFF',
            minHeight: 256,
          }}
        >
          {/* Route Info and Route ID Row */}
          <View className="flex-row items-start mb-4">
            {/* Left Side - Route with connected dots */}
            <View className="flex-1 mr-4">
              <View className="flex-row items-center mb-2">
                <View 
                  style={{ 
                    width: 14, 
                    height: 14, 
                    backgroundColor: '#10B981', 
                    borderRadius: 7,
                    marginRight: 8,
                  }} 
                />
                <Text className="text-black text-xl font-bold">
                  {item.from}
                </Text>
              </View>
              {/* Connecting Line */}
              <View 
                style={{ 
                  width: 3, 
                  height: 20, 
                  backgroundColor: '#9CA3AF',
                  marginLeft: 6,
                  marginBottom: 8,
                }} 
              />
              <View className="flex-row items-center">
                <View 
                  style={{ 
                    width: 14, 
                    height: 14, 
                    backgroundColor: '#DC2626', 
                    borderRadius: 7,
                    marginRight: 8,
                  }} 
                />
                <Text className="text-black text-xl font-bold">
                  {item.to}
                </Text>
              </View>
            </View>

            {/* Right Side - Route ID */}
            <View 
              style={{
                backgroundColor: '#C3B1E1',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                minWidth: 56,
                minHeight: 56,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text 
                className="text-black"
                style={{ 
                  fontSize: 30,
                  fontFamily: 'System',
                }}
              >
                {item.routeId}
              </Text>
            </View>
          </View>

          {/* Summary Details - 4 rounded square boxes in 2x2 grid */}
          <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
            <View 
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 12,
                width: 112,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                Duration
              </Text>
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                {item.duration}
              </Text>
            </View>
            <View 
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 12,
                width: 112,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                Payment
              </Text>
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                {item.payment}
              </Text>
            </View>
            <View 
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 12,
                width: 112,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                Distance
              </Text>
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                {item.distance}
              </Text>
            </View>
            <View 
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 12,
                width: 112,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                Method
              </Text>
              <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                {item.method}
              </Text>
            </View>
          </View>

          {/* Expandable Details */}
          {isExpanded && (
            <Animated.View style={animatedStyle}>
              <View className="mt-3 pt-3 border-t" style={{ borderTopColor: '#E5E7EB' }}>
                {/* Additional Details - 4 rounded square boxes in 2x2 grid */}
                <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                  <View 
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      width: 112,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      Pick up time:
                    </Text>
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      {item.pickupTime}
                    </Text>
                  </View>
                  <View 
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      width: 112,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      Arrival Time:
                    </Text>
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      {item.arrivalTime}
                    </Text>
                  </View>
                  <View 
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      width: 112,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      Passenger type:
                    </Text>
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      {item.passengerType}
                    </Text>
                  </View>
                  <View 
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      width: 112,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      Plate No.
                    </Text>
                    <Text className="text-black text-base" style={{ fontFamily: 'System' }}>
                      {item.plateNo}
                    </Text>
                  </View>
                </View>

                {/* Rating Section */}
                <View className="items-center mb-4">
                  <Text 
                    className="text-black text-xl font-bold mb-4"
                    style={{ fontFamily: 'System' }}
                  >
                    Rate your experience !
                  </Text>
                  {renderStars(0)}
                </View>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Violet Footer with Button */}
        <View 
          className="py-3 px-4"
          style={{ 
            backgroundColor: '#CDA678',
            borderTopWidth: 1,
            borderTopColor: '#000',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => toggleExpand(item.id)}
            style={{
              backgroundColor: '#C3B1E1',
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 20,
              alignSelf: 'center',
            }}
          >
            <Text 
              className="text-black text-base"
              style={{ 
                fontFamily: 'System',
                fontWeight: '400',
                color: '#000000',
              }}
            >
              {isExpanded ? 'Hide Details' : 'View more details'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView 
      className="flex-1 bg-secondary" 
      contentContainerStyle={{ 
        paddingBottom: 120,
        paddingHorizontal: 16,
        paddingTop: 16,
        alignItems: 'center',
      }}
    >
      {/* Title */}
      <Text 
        className="text-primary mb-4"
        style={{ 
          fontSize: 24,
          fontWeight: 'bold',
          fontFamily: 'System',
        }}
      >
        Travel History
      </Text>

      {/* History Cards */}
      {travelHistory.length === 0 ? (
        <View className="items-center justify-center py-20">
          <Text className="text-gray-500 text-lg text-center">No travel history yet</Text>
        </View>
      ) : (
        travelHistory.map((item) => (
          <HistoryCard key={item.id} item={item} />
        ))
      )}
    </ScrollView>
  );
};

export default history;
