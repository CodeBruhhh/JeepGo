import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/services/supabase'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import MapComponent from '../../components/Map'

type RideRequest = {
  request_id: string
  passenger_id: string
  driver_id?: string
  from_x: number
  from_y: number
  to_x?: number
  to_y?: number
  status: string
  created_at: string
  destination_name?: string
}

// Animated Switch Component
const AnimatedSwitch = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => {
  const animatedValue = useSharedValue(value ? 1 : 0)

  useEffect(() => {
    animatedValue.value = withSpring(value ? 1 : 0)
  }, [value])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedValue.value * 20 }],
  }))

  return (
    <Pressable
      onPress={onToggle}
      className={`w-11 h-6 rounded-full flex-row items-center px-1 ${
        value ? 'bg-violet-400' : 'bg-gray-300'
      }`}
    >
      <Animated.View
        style={animatedStyle}
        className="w-5 h-5 bg-white rounded-full shadow-md"
      />
    </Pressable>
  )
}

export default function DriverHome() {
  const { profile, isLoading: authLoading } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [driver, setDriver] = useState<any | null>(null)
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [activePassengers, setActivePassengers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'requests' | 'passengers'>('requests')

  const screenHeight = Dimensions.get('window').height
  const minPanelHeight = screenHeight * 0.25
  const maxPanelHeight = screenHeight * 0.85

  // Animated bottom sheet height - MUST be before any conditional returns
  const panelHeight = useSharedValue(minPanelHeight)

  // Gesture for dragging bottom sheet - MUST be before any conditional returns
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      const newHeight = Math.max(minPanelHeight, Math.min(maxPanelHeight, panelHeight.value - event.translationY))
      panelHeight.value = newHeight
    })
    .onEnd((event) => {
      // Snap to min or max based on velocity
      const shouldExpand = event.velocityY < -300 || panelHeight.value > screenHeight * 0.5
      panelHeight.value = withSpring(shouldExpand ? maxPanelHeight : minPanelHeight)
    })

  // Animated style - MUST be before any conditional returns
  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: panelHeight.value,
  }))

  const driverId = profile?.user_id

  useEffect(() => {
    if (!driverId) return

    let channel: any

    const fetchInitial = async () => {
      setLoading(true)

      try {
        // fetch driver record
        const { data: d } = await supabase
          .from('drivers')
          .select('*')
          .eq('driver_id', driverId)
          .single()
        setDriver(d)

        // fetch pending/searching ride requests (not assigned)
        const { data: requests } = await supabase
          .from('ride_requests')
          .select('*')
          .or("status.eq.searching,status.eq.pending")
          .order('created_at', { ascending: false })

        setRideRequests((requests as any) || [])

        // fetch active trips for this driver
        const { data: trips } = await supabase
          .from('trips')
          .select('*, payments(*)')
          .eq('driver_id', driverId)
          .in('status', ['ongoing','accepted'])

        setActivePassengers((trips as any) || [])

        // realtime subscription for ride_requests
        channel = supabase
          .channel('public:ride_requests')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, (payload) => {
            const ev = payload.eventType
            const newRow = payload.new as RideRequest | null
            const oldRow = payload.old as RideRequest | null

            if (ev === 'INSERT' && newRow) {
              setRideRequests((prev) => [newRow!, ...prev])
            }

            if (ev === 'UPDATE' && newRow) {
              setRideRequests((prev) => prev.map((r) => (r.request_id === newRow.request_id ? newRow : r)))
            }

            if (ev === 'DELETE' && oldRow) {
              setRideRequests((prev) => prev.filter((r) => r.request_id !== oldRow.request_id))
            }
          })
          .subscribe()
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()

    return () => {
      if (channel) channel.unsubscribe()
    }
  }, [driverId])

  const handleAccept = async (request: RideRequest) => {
    if (!driverId) return Alert.alert('Not signed in')

    try {
      // mark request as accepted and assign driver
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted', driver_id: driverId })
        .eq('request_id', request.request_id)

      if (error) throw error

      // create a trip record for tracking
      const { data: trip, error: tripErr } = await supabase.from('trips').insert([
        {
          driver_id: driverId,
          passenger_id: request.passenger_id,
          start_time: new Date().toISOString(),
          status: 'ongoing',
          pick_up: `${request.from_x?.toFixed?.(6) || request.from_x}, ${request.from_y?.toFixed?.(6) || request.from_y}`,
          destination: request.destination_name || '',
          distance: 0,
        },
      ])

      if (tripErr) console.warn('Trip create error', tripErr)

      Alert.alert('Accepted', 'You accepted the ride request.')
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || String(err))
    }
  }

  const handleDecline = async (request: RideRequest) => {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'rejected', cancelled_by: 'driver' })
        .eq('request_id', request.request_id)

      if (error) throw error

      Alert.alert('Declined', 'You declined the ride request.')
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || String(err))
    }
  }

  const handleConfirmPayment = async (trip: any) => {
    try {
      // create a payment and mark trip completed
      const { data: payment, error: payErr } = await supabase.from('payments').insert([
        {
          trip_id: trip.trip_id,
          payment_method: 'cash',
          status: 'completed',
          amount: trip?.fare ?? 0,
        },
      ])

      if (payErr) throw payErr

      await supabase.from('trips').update({ status: 'completed', end_time: new Date().toISOString() }).eq('trip_id', trip.trip_id)

      // mark ride_request as completed (if linked by passenger_id + driver)
      await supabase
        .from('ride_requests')
        .update({ status: 'completed' })
        .eq('passenger_id', trip.passenger_id)
        .eq('driver_id', driverId)

      Alert.alert('Payment confirmed')
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || String(err))
    }
  }

  const passengerMarkers = useMemo(() => {
    return rideRequests
      .filter((r) => r.from_x && r.from_y)
      .map((r) => ({ id: r.request_id, latitude: r.from_y, longitude: r.from_x, title: r.destination_name || 'Pickup' }))
  }, [rideRequests])

  if (authLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <View className="absolute inset-0">
        <MapComponent />
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[animatedPanelStyle, { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F5F1E8' }]}
          className="rounded-t-3xl shadow-lg overflow-hidden"
        >
          {/* Drag Handle */}
          <View className="items-center py-3 border-b border-gray-200">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
            {/* Driver Status Section */}
            <View className="px-4 py-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm text-zinc-500 font-semibold">Driver Status: Accepting Rides</Text>
                  <Text className="text-green-700 text-lg font-bold mt-1">{driver?.is_online ? 'Online' : 'Offline'}</Text>
                </View>
                <AnimatedSwitch
                  value={driver?.is_online || false}
                  onToggle={async () => {
                    try {
                      const { error } = await supabase
                        .from('drivers')
                        .update({ is_online: !driver?.is_online })
                        .eq('driver_id', driverId)
                      if (error) throw error
                      setDriver((d: any) => ({ ...d, is_online: !d?.is_online }))
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                />
              </View>
            </View>

            {/* Tab Selector */}
            <View className="flex-row border-b border-gray-100">
              <Pressable
                onPress={() => setActiveTab('requests')}
                className="flex-1 py-4 items-center"
                style={{
                  backgroundColor: activeTab === 'requests' ? '#C4B5D8' : 'transparent'
                }}
              >
                <Text className={`font-semibold ${activeTab === 'requests' ? 'text-white' : 'text-gray-500'}`}>
                  Ride Requests
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('passengers')}
                className="flex-1 py-4 items-center"
                style={{
                  backgroundColor: activeTab === 'passengers' ? '#C4B5D8' : 'transparent'
                }}
              >
                <Text className={`font-semibold ${activeTab === 'passengers' ? 'text-white' : 'text-gray-500'}`}>
                  Active Passengers
                </Text>
              </Pressable>
            </View>

            {/* Content Area */}
            <View className="px-4 py-4 pb-10">
              <View className="bg-white rounded-2xl p-4">
                {activeTab === 'requests' && (
                  <View>
                    {rideRequests.length === 0 ? (
                      <Text className="text-zinc-400 text-center py-8">No ride requests</Text>
                    ) : (
                      rideRequests.map((r) => (
                        <View key={r.request_id} className="bg-white border border-orange-200 rounded-xl p-4 mb-3">
                          <View className="flex-row items-start">
                            <Image source={{ uri: 'https://placehold.co/50x50' }} className="w-12 h-12 rounded-full" />
                            <View className="flex-1 ml-3">
                              <Text className="text-black font-semibold text-sm">Passenger</Text>
                              <Text className="text-zinc-500 text-xs mt-1">
                                📍 Pick Up: {r.from_y?.toFixed?.(4) || r.from_y}, {r.from_x?.toFixed?.(4) || r.from_x}
                              </Text>
                              <Text className="text-zinc-500 text-xs">
                                📍 Drop Off: {r.destination_name || 'N/A'}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row mt-3 gap-2">
                            <Pressable
                              onPress={() => handleDecline(r)}
                              className="flex-1 bg-red-100 border border-red-300 rounded-lg py-2"
                            >
                              <Text className="text-red-600 text-center font-semibold text-xs">❌ Decline</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleAccept(r)}
                              className="flex-1 bg-green-500 rounded-lg py-2"
                            >
                              <Text className="text-white text-center font-semibold text-xs">✓ Accept</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {activeTab === 'passengers' && (
                  <View>
                    {activePassengers.length === 0 ? (
                      <Text className="text-zinc-400 text-center py-8">No active passengers</Text>
                    ) : (
                      activePassengers.map((t) => (
                        <View key={t.trip_id} className="bg-white border border-orange-200 rounded-xl p-4 mb-3">
                          <View className="flex-row items-start">
                            <Image source={{ uri: 'https://placehold.co/50x50' }} className="w-12 h-12 rounded-full" />
                            <View className="flex-1 ml-3">
                              <Text className="text-black font-semibold text-sm">Passenger</Text>
                              <Text className="text-zinc-500 text-xs mt-1">
                                📍 Pick Up: {t.pick_up || 'N/A'}
                              </Text>
                              <Text className="text-zinc-500 text-xs">
                                📍 Destination: {t.destination || 'N/A'}
                              </Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => handleConfirmPayment(t)}
                            className="w-full bg-green-500 rounded-lg py-2 mt-3"
                          >
                            <Text className="text-white text-center font-semibold text-xs">✓ Confirm Payment (₱{(t?.fare ?? 0).toFixed(2)})</Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}