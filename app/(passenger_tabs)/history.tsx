import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
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
  rating?: number;
  status: string;
}
 
const history = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [travelHistory, setTravelHistory] = useState<TravelHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
 
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const updateRating = async (tripId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ rating })
        .eq('trip_id', tripId);
      
      if (error) throw error;
      
      // Update local state
      setTravelHistory(prev => 
        prev.map(item => 
          item.id === tripId ? { ...item, rating } : item
        )
      );
      
      Alert.alert('Success', 'Thank you for your rating!');
    } catch (error) {
      console.error('Error updating rating:', error);
      Alert.alert('Error', 'Failed to save rating');
    }
  };
 
  // Load trips for the current user from Supabase
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error('Could not get current user for history', userError);
          setLoading(false);
          return;
        }
        const userId = userData.user.id;
 
        // Fetch only completed or cancelled trips for this passenger
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .eq('passenger_id', userId)
          .in('status', ['completed', 'cancelled'])
          .order('start_time', { ascending: false });
 
        if (tripsError) {
          console.error('Error fetching trips:', tripsError);
          setLoading(false);
          return;
        }
 
        // Enrich each trip with driver and payment info
        const enriched = await Promise.all(
          (trips || []).map(async (t: any) => {
            const tripId = t.trip_id;
 
            // driver info
            let jeepCode = '—';
            let plateNo = 'TBD';
            try {
              const { data: driverData } = await supabase
                .from('drivers')
                .select('driver_id, jeep_id, jeep_code')
                .eq('driver_id', t.driver_id)
                .single();
 
              if (driverData) {
                jeepCode = driverData.jeep_code ?? '—';
                if (driverData.jeep_id) {
                  const { data: jeepData } = await supabase
                    .from('jeeps')
                    .select('plate_no')
                    .eq('jeep_id', driverData.jeep_id)
                    .single();
                  plateNo = jeepData?.plate_no ?? 'TBD';
                }
              }
            } catch (e) {
              console.error('Driver lookup error', e);
            }
 
            // payment info
            let paymentDisplay = 'P 0.00';
            let paymentMethod = 'Unknown';
            try {
              const { data: payment } = await supabase
                .from('payments')
                .select('*')
                .eq('trip_id', tripId)
                .order('payment_time', { ascending: false })
                .limit(1)
                .single();
 
              if (payment) {
                const amount = payment.amount ?? 0;
                const displayAmount = amount > 1000 ? (amount / 100).toFixed(2) : Number(amount).toFixed(2);
                paymentDisplay = `₱${displayAmount}`;
                paymentMethod = payment.payment_method ?? 'Unknown';
              }
            } catch (e) {
              // ignore
            }
 
            // compute duration - FIXED
            let duration = 'N/A';
            try {
              if (t.start_time && t.end_time) {
                const start = new Date(t.start_time);
                const end = new Date(t.end_time);
                const diffMs = end.getTime() - start.getTime();
                const mins = Math.floor(diffMs / 60000);
                const secs = Math.floor((diffMs % 60000) / 1000);
                
                if (mins > 60) {
                  const hours = Math.floor(mins / 60);
                  const remainingMins = mins % 60;
                  duration = `${hours}h ${remainingMins}m`;
                } else {
                  duration = `${mins}m`;
                }
              }
            } catch (e) {
              console.error('Duration calculation error', e);
            }
 
            // Helper to format date as "Month DD, YYYY"
            const formatDateFull = (dateStr: string) => {
              const d = new Date(dateStr);
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
            };
 
            // Helper to format time as "H:MM AM/PM"
            const formatTime = (dateStr: string) => {
              const d = new Date(dateStr);
              const hours = d.getHours() % 12 || 12;
              const mins = String(d.getMinutes()).padStart(2, '0');
              const ampm = d.getHours() < 12 ? 'AM' : 'PM';
              return `${hours}:${mins} ${ampm}`;
            };
 
            return {
              id: tripId,
              date: t.start_time ? formatDateFull(t.start_time) : '',
              from: t.pick_up ?? 'Unknown',
              to: t.destination ?? 'Unknown',
              routeId: jeepCode,
              duration,
              payment: paymentDisplay,
              distance: `${Number(t.distance ?? 0).toFixed(2)} km`,
              method: paymentMethod,
              pickupTime: t.start_time ? formatTime(t.start_time) : undefined,
              arrivalTime: t.end_time ? formatTime(t.end_time) : undefined,
              passengerType: 'Regular',
              plateNo,
              rating: t.rating ? Number(t.rating) : 0,
              status: t.status,
            } as TravelHistory;
          })
        );
 
        setTravelHistory(enriched);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };
 
    loadHistory();
  }, []);
 
  const renderStars = (currentRating: number = 0, tripId: string, isInteractive: boolean = true) => {
    return (
      <View className="flex-row justify-center" style={{ gap: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!isInteractive}
            onPress={() => isInteractive && updateRating(tripId, star)}
            style={{ 
              width: 44, 
              height: 44, 
              justifyContent: 'center', 
              alignItems: 'center',
              borderRadius: 22,
              backgroundColor: star <= currentRating ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
            }}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={36}
              color={star <= currentRating ? '#FFD700' : '#D1D5DB'}
            />
          </TouchableOpacity>
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
        opacity.value = withTiming(1, { duration: 250 });
        height.value = withTiming(380, { duration: 350 });
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

    const statusColor = item.status === 'completed' ? '#10B981' : '#EF4444';
    const statusBg = item.status === 'completed' ? '#D1FAE5' : '#FEE2E2';
 
    return (
      <Animated.View
        layout={Layout.springify()}
        className="mb-5 overflow-hidden"
        style={{
          width: 360,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: '#F3F4F6',
        }}
      >
        {/* Header */}
        <View
          className="py-4 px-5"
          style={{ 
            backgroundColor: '#8B5CF6',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-lg font-semibold" style={{ fontFamily: 'System' }}>
              {item.date}
            </Text>
          </View>
          
          {/* Status Badge */}
          <View style={{
            backgroundColor: statusBg,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            alignSelf: 'flex-start',
          }}>
            <Text style={{ 
              color: statusColor, 
              fontSize: 12, 
              fontWeight: '600',
              textTransform: 'capitalize',
            }}>
              {item.status}
            </Text>
          </View>
        </View>
 
        {/* Card Content */}
        <View className="p-5">
          {/* Route Info */}
          <View className="flex-row items-start mb-5">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center mb-2">
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: '#10B981',
                    borderRadius: 8,
                    marginRight: 10,
                  }}
                />
                <Text className="text-gray-800 text-lg font-semibold flex-1" numberOfLines={2}>
                  {item.from}
                </Text>
              </View>
              
              <View
                style={{
                  width: 2,
                  height: 32,
                  backgroundColor: '#E5E7EB',
                  marginLeft: 7,
                  marginVertical: 4,
                }}
              />
              
              <View className="flex-row items-center">
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: '#EF4444',
                    borderRadius: 8,
                    marginRight: 10,
                  }}
                />
                <Text className="text-gray-800 text-lg font-semibold flex-1" numberOfLines={2}>
                  {item.to}
                </Text>
              </View>
            </View>
 
            {/* Route ID Badge */}
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 12,
                minWidth: 70,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#E5E7EB',
              }}
            >
              <Text className="text-gray-500 text-xs font-medium mb-1">ROUTE</Text>
              <Text
                className="text-gray-800 font-bold"
                style={{ fontSize: 28 }}
              >
                {item.routeId}
              </Text>
            </View>
          </View>
 
          {/* Stats Grid */}
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                padding: 14,
                flex: 1,
                minWidth: 150,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}
            >
              <Text className="text-gray-500 text-xs font-medium mb-1">Duration</Text>
              <Text className="text-gray-900 text-base font-semibold">{item.duration}</Text>
            </View>
            
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                padding: 14,
                flex: 1,
                minWidth: 150,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}
            >
              <Text className="text-gray-500 text-xs font-medium mb-1">Distance</Text>
              <Text className="text-gray-900 text-base font-semibold">{item.distance}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap mt-2" style={{ gap: 10 }}>
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                padding: 14,
                flex: 1,
                minWidth: 150,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}
            >
              <Text className="text-gray-500 text-xs font-medium mb-1">Payment</Text>
              <Text className="text-gray-900 text-base font-semibold">{item.payment}</Text>
            </View>
            
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                padding: 14,
                flex: 1,
                minWidth: 150,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}
            >
              <Text className="text-gray-500 text-xs font-medium mb-1">Method</Text>
              <Text className="text-gray-900 text-base font-semibold">{item.method}</Text>
            </View>
          </View>
 
          {/* Expandable Details */}
          {isExpanded && (
            <Animated.View style={animatedStyle}>
              <View className="mt-4 pt-4" style={{ borderTopColor: '#E5E7EB', borderTopWidth: 1 }}>
                <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 16,
                      padding: 14,
                      flex: 1,
                      minWidth: 150,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}
                  >
                    <Text className="text-gray-500 text-xs font-medium mb-1">Pick-up Time</Text>
                    <Text className="text-gray-900 text-base font-semibold">{item.pickupTime}</Text>
                  </View>
                  
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 16,
                      padding: 14,
                      flex: 1,
                      minWidth: 150,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}
                  >
                    <Text className="text-gray-500 text-xs font-medium mb-1">Arrival Time</Text>
                    <Text className="text-gray-900 text-base font-semibold">{item.arrivalTime || 'N/A'}</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap mt-2" style={{ gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 16,
                      padding: 14,
                      flex: 1,
                      minWidth: 150,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}
                  >
                    <Text className="text-gray-500 text-xs font-medium mb-1">Passenger Type</Text>
                    <Text className="text-gray-900 text-base font-semibold">{item.passengerType}</Text>
                  </View>
                  
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 16,
                      padding: 14,
                      flex: 1,
                      minWidth: 150,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}
                  >
                    <Text className="text-gray-500 text-xs font-medium mb-1">Plate No.</Text>
                    <Text className="text-gray-900 text-base font-semibold">{item.plateNo}</Text>
                  </View>
                </View>
 
                {/* Rating Section */}
                {item.status === 'completed' && (
                  <View className="items-center mt-6 mb-3">
                    <Text className="text-gray-800 text-lg font-bold mb-3">
                      {(item.rating ?? 0) > 0 ? 'Your Rating' : 'Rate Your Experience'}
                    </Text>
                    {renderStars(item.rating ?? 0, item.id, (item.rating ?? 0) === 0)}
                    {(item.rating ?? 0) > 0 && (
                      <Text className="text-gray-500 text-sm mt-2">Thank you for rating!</Text>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>
 
        {/* Footer Button */}
        <TouchableOpacity
          onPress={() => toggleExpand(item.id)}
          style={{
            backgroundColor: '#F9FAFB',
            paddingVertical: 14,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-700 text-base font-medium mr-2">
              {isExpanded ? 'Hide Details' : 'View Details'}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#6B7280" 
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
 
  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: '#F5F5DC' }}
      contentContainerStyle={{
        paddingBottom: 120,
        paddingHorizontal: 16,
        paddingTop: 24,
        alignItems: 'center',
      }}
    >
      {/* Title */}
      <View className="mb-6 w-full mt-[50]" style={{ maxWidth: 360 }}>
        <Text
          className="text-gray-900 font-bold mb-1"
          style={{ fontSize: 32 }}
        >
          Travel History
        </Text>
        <Text className="text-gray-500 text-base">
          View your past trips and experiences
        </Text>
      </View>
 
      {/* History Cards */}
      {loading ? (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#550CBF" />
          <Text className="text-gray-500 text-lg">Loading...</Text>
        </View>
      ) : travelHistory.length === 0 ? (
        <View className="items-center justify-center py-20">
          <Ionicons name="car-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg text-center mt-4">No travel history yet</Text>
          <Text className="text-gray-400 text-sm text-center mt-2">Your completed trips will appear here</Text>
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