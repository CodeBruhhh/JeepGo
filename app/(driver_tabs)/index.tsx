import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/services/supabase'
import * as Location from 'expo-location'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import MapView, { Marker } from 'react-native-maps'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
 
type RideRequest = {
  request_id: string
  passenger_id: string
  driver_id?: string | null
  from_x: number
  from_y: number
  to_x?: number | null
  to_y?: number | null
  status: string
  created_at: string
  destination_name?: string | null
  cancelled_by?: string | null
}

type Trip = {
  trip_id: string
  driver_id: string
  passenger_id: string
  start_time: string
  end_time?: string | null
  status: string
  pick_up: string
  destination: string
  distance: number
  rating?: number | null
}

type Payment = {
  payment_id: string
  payment_method: string
  payment_time: string
  trip_id: string
  status: string
  amount: number
}

type Passenger = {
  passenger_id: string
  latitude?: number | null
  longitude?: number | null
}

type UserInfo = {
  user_id: string
  full_name: string
  email: string
  phone_number?: string | null
  role: string
  photo_url?: string | null
}

type TripWithPassenger = Trip & {
  passenger?: Passenger
  passenger_info?: UserInfo
  payment?: Payment
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
  const [activeTrips, setActiveTrips] = useState<TripWithPassenger[]>([])
  const [activeTab, setActiveTab] = useState<'requests' | 'passengers'>('requests')
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
 
  const screenHeight = Dimensions.get('window').height
  const minPanelHeight = screenHeight * 0.25
  const maxPanelHeight = screenHeight * 0.5
 
  const [panelExpanded, setPanelExpanded] = useState(false)
 
  const driverId = profile?.user_id

  // Location tracking for driver
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required')
          return
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({})
        const { latitude, longitude } = location.coords
        setDriverLocation({ latitude, longitude })
        setMapRegion(prev => ({ ...prev, latitude, longitude }))

        // Update driver location in database (if drivers table has latitude/longitude fields)
        if (driverId) {
          await supabase
            .from('drivers')
            .update({ 
              latitude: latitude,
              longitude: longitude,
              last_location_update: new Date().toISOString()
            })
            .eq('driver_id', driverId)
        }

        // Watch position changes
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            const { latitude, longitude } = location.coords
            setDriverLocation({ latitude, longitude })

            // Update driver location in database
            if (driverId) {
              supabase
                .from('drivers')
                .update({ 
                  latitude: latitude,
                  longitude: longitude,
                  last_location_update: new Date().toISOString()
                })
                .eq('driver_id', driverId)
                .then()
            }
          }
        )
      } catch (error) {
        console.error('Error starting location tracking:', error)
      }
    }

    if (driverId && driver?.is_online) {
      startLocationTracking()
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [driverId, driver?.is_online])

  // Fetch passenger locations for active trips
  useEffect(() => {
    if (!driverId || activeTrips.length === 0) return

    const interval = setInterval(async () => {
      const passengerIds = activeTrips.map(t => t.passenger_id)
      
      // Fetch passenger latitude/longitude from passengers table
      const { data: passengers } = await supabase
        .from('passengers')
        .select('passenger_id, latitude, longitude')
        .in('passenger_id', passengerIds)

      if (passengers) {
        setActiveTrips(prev => 
          prev.map(trip => {
            const passenger = passengers.find(p => p.passenger_id === trip.passenger_id)
            return passenger ? { ...trip, passenger } : trip
          })
        )
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [driverId, activeTrips.length])
 
  useEffect(() => {
    if (!driverId) return
 
    let channel: any
    let tripChannel: any
 
    const fetchInitial = async () => {
      setLoading(true)
 
      try {
        // Fetch driver record
        const { data: d } = await supabase
          .from('drivers')
          .select('*')
          .eq('driver_id', driverId)
          .single()
        setDriver(d)
 
        // Fetch pending/searching ride requests (no driver assigned or assigned to this driver)
        const { data: requests } = await supabase
          .from('ride_requests')
          .select('*')
          .or(`driver_id.is.null,driver_id.eq.${driverId}`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
 
        setRideRequests((requests as RideRequest[]) || [])
 
        // Fetch active trips for this driver with passenger info
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select(`
            *,
            passengers!trips_passenger_id_fkey (
              passenger_id,
              latitude,
              longitude,
              user_info!passengers_passenger_id_fkey (
                user_id,
                full_name,
                email,
                phone_number,
                role,
                photo_url
              )
            ),
            payments!payments_trip_id_fkey (
              payment_id,
              payment_method,
              payment_time,
              trip_id,
              status,
              amount
            )
          `)
          .eq('driver_id', driverId)
          .in('status', ['ongoing'])
          .order('start_time', { ascending: false })

        if (tripsError) {
          console.error('Error fetching trips:', tripsError)
        }

        // Transform the data to flatten the structure
        const transformedTrips = (trips || []).map((trip: any) => ({
          ...trip,
          passenger: {
            passenger_id: trip.passengers?.passenger_id,
            latitude: trip.passengers?.latitude,
            longitude: trip.passengers?.longitude
          },
          passenger_info: trip.passengers?.user_info,
          payment: Array.isArray(trip.payments) ? trip.payments[0] : trip.payments
        }))

        setActiveTrips(transformedTrips as TripWithPassenger[])
 
        // Realtime subscription for ride_requests
        channel = supabase
          .channel('driver-ride-requests')
          .on(
            'postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'ride_requests',
              filter: `status=eq.pending`
            }, 
            (payload) => {
              const ev = payload.eventType
              const newRow = payload.new as RideRequest | null
              const oldRow = payload.old as RideRequest | null
 
              if (ev === 'INSERT' && newRow) {
                console.log('New ride request:', newRow)
                setRideRequests((prev) => [newRow, ...prev])
              }
 
              if (ev === 'UPDATE' && newRow) {
                // Remove from list if status changed from pending
                if (newRow.status !== 'pending') {
                  setRideRequests((prev) => prev.filter((r) => r.request_id !== newRow.request_id))
                } else {
                  setRideRequests((prev) => prev.map((r) => (r.request_id === newRow.request_id ? newRow : r)))
                }
              }
 
              if (ev === 'DELETE' && oldRow) {
                setRideRequests((prev) => prev.filter((r) => r.request_id !== oldRow.request_id))
              }
            }
          )
          .subscribe()
 
        // Realtime subscription for trips for this driver
        tripChannel = supabase
          .channel('driver-trips')
          .on(
            'postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'trips',
              filter: `driver_id=eq.${driverId}`
            }, 
            async (payload) => {
              const ev = payload.eventType
              const newRow = payload.new as Trip | null
              const oldRow = payload.old as Trip | null
 
              if (ev === 'INSERT' && newRow) {
                console.log('New trip:', newRow)
                
                // Fetch passenger data for the new trip
                const { data: passengerData } = await supabase
                  .from('passengers')
                  .select('passenger_id, latitude, longitude')
                  .eq('passenger_id', newRow.passenger_id)
                  .single()
                
                const { data: passengerInfo } = await supabase
                  .from('user_info')
                  .select('user_id, full_name, email, phone_number, role, photo_url')
                  .eq('user_id', newRow.passenger_id)
                  .single()
                
                const enrichedTrip: TripWithPassenger = {
                  ...newRow,
                  passenger: passengerData || undefined,
                  passenger_info: passengerInfo || undefined
                }
                
                setActiveTrips((prev) => [enrichedTrip, ...prev])
                // Remove the corresponding ride request
                setRideRequests((prev) => prev.filter((r) => r.passenger_id !== newRow.passenger_id))
                setActiveTab('passengers')
              }
 
              if (ev === 'UPDATE' && newRow) {
                // Remove from active list if completed or cancelled
                if (newRow.status === 'completed' || newRow.status === 'cancelled') {
                  setActiveTrips((prev) => prev.filter((t) => t.trip_id !== newRow.trip_id))
                } else {
                  setActiveTrips((prev) => prev.map((t) => (t.trip_id === newRow.trip_id ? { ...t, ...newRow } : t)))
                }
              }
 
              if (ev === 'DELETE' && oldRow) {
                setActiveTrips((prev) => prev.filter((t) => t.trip_id !== oldRow.trip_id))
              }
            }
          )
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
      if (tripChannel) tripChannel.unsubscribe()
    }
  }, [driverId])
 
  const handleAccept = async (request: RideRequest) => {
    if (!driverId) return Alert.alert('Not signed in')
 
    try {
      // Update ride request to assign driver and change status
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted', driver_id: driverId })
        .eq('request_id', request.request_id)
 
      if (error) throw error

      // Remove from local state
      setRideRequests((prev) => prev.filter((r) => r.request_id !== request.request_id))
 
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
        .update({ status: 'denied', cancelled_by: 'driver' })
        .eq('request_id', request.request_id)
 
      if (error) throw error

      setRideRequests((prev) => prev.filter((r) => r.request_id !== request.request_id))
 
      Alert.alert('Declined', 'You declined the ride request.')
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || String(err))
    }
  }
 
  const handleConfirmPayment = async (trip: TripWithPassenger) => {
    try {
      // Fetch payment details to get the amount
      const { data: payment, error: fetchErr } = await supabase
        .from('payments')
        .select('amount')
        .eq('trip_id', trip.trip_id)
        .single()

      if (fetchErr) throw fetchErr

      // Update payment status to confirmed
      const { error: payErr } = await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .eq('trip_id', trip.trip_id)
 
      if (payErr) throw payErr
 
      Alert.alert('Payment confirmed', `Payment of ₱${payment?.amount || 0} has been confirmed. Waiting for passenger to complete the trip.`)
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || String(err))
    }
  }
 
  const allMarkers = useMemo(() => {
    const markers: any[] = []

    // Add driver location
    if (driverLocation) {
      markers.push({
        id: 'driver',
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        title: 'You',
        description: 'Your location',
        type: 'driver'
      })
    }

    // Add ride request pickup locations
    rideRequests.forEach((r) => {
      if (r.from_x && r.from_y) {
        markers.push({ 
          id: r.request_id, 
          latitude: r.from_y, 
          longitude: r.from_x, 
          title: 'Pickup Request',
          description: r.destination_name || 'Waiting for pickup',
          type: 'pickup'
        })
      }
    })

    // Add active passenger locations
    activeTrips.forEach((trip) => {
      if (trip.passenger?.latitude && trip.passenger?.longitude) {
        markers.push({
          id: `passenger-${trip.trip_id}`,
          latitude: trip.passenger.latitude,
          longitude: trip.passenger.longitude,
          title: trip.passenger_info?.full_name || 'Active Passenger',
          description: `Going to ${trip.destination}`,
          type: 'passenger'
        })
      }
    })

    return markers
  }, [driverLocation, rideRequests, activeTrips])
 
  if (authLoading || loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" />
        </View>
      </GestureHandlerRootView>
    )
  }
 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
        <View className="absolute inset-0">
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {allMarkers.map(m => (
              <Marker
                key={m.id}
                coordinate={{
                  latitude: m.latitude,
                  longitude: m.longitude,
                }}
                title={m.title}
                description={m.description}
                pinColor={m.type === 'driver' ? 'blue' : m.type === 'passenger' ? 'green' : 'red'}
              />
            ))}
          </MapView>
        </View>
 
        <View
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: '#F5F1E8',
            height: panelExpanded ? maxPanelHeight : minPanelHeight
          }}
          className="rounded-t-3xl shadow-lg overflow-hidden"
        >
          <Pressable 
            onPress={() => setPanelExpanded(!panelExpanded)}
            className="items-center py-3 border-b border-gray-200"
          >
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </Pressable>
 
            <View className="flex-1">
              <View className="px-4 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-zinc-500 font-semibold">Driver Status</Text>
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
 
              <View className="flex-row border-b border-gray-100">
                <Pressable
                  onPress={() => setActiveTab('requests')}
                  className="flex-1 py-4 items-center"
                  style={{
                    backgroundColor: activeTab === 'requests' ? '#C4B5D8' : 'transparent'
                  }}
                >
                  <Text className={`font-semibold ${activeTab === 'requests' ? 'text-white' : 'text-gray-500'}`}>
                    Ride Requests ({rideRequests.length})
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
                    Active Trips ({activeTrips.length})
                  </Text>
                </Pressable>
              </View>
 
              <ScrollView 
                className="flex-1 px-4 py-4" 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                {activeTab === 'requests' && (
                  <View>
                    {rideRequests.length === 0 ? (
                      <View className="bg-white rounded-2xl p-8">
                        <Text className="text-zinc-400 text-center">No ride requests available</Text>
                      </View>
                    ) : (
                      rideRequests.map((r) => (
                        <View key={r.request_id} className="bg-white border border-orange-200 rounded-xl p-4 mb-3">
                          <View className="flex-row items-start">
                            <Image source={{ uri: 'https://placehold.co/50x50' }} className="w-12 h-12 rounded-full" />
                            <View className="flex-1 ml-3">
                              <Text className="text-black font-semibold text-sm">New Ride Request</Text>
                              <Text className="text-zinc-500 text-xs mt-1">
                                📍 Pickup: {r.from_y.toFixed(4)}, {r.from_x.toFixed(4)}
                              </Text>
                              <Text className="text-zinc-500 text-xs">
                                🎯 Drop Off: {r.destination_name || (r.to_x && r.to_y ? `${r.to_y.toFixed(4)}, ${r.to_x.toFixed(4)}` : 'N/A')}
                              </Text>
                              <Text className="text-zinc-400 text-xs mt-1">
                                {new Date(r.created_at).toLocaleTimeString()}
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
                    {activeTrips.length === 0 ? (
                      <View className="bg-white rounded-2xl p-8">
                        <Text className="text-zinc-400 text-center">No active trips</Text>
                      </View>
                    ) : (
                      activeTrips
                        .sort((a, b) => {
                          // Sort by payment status - unpaid first, then paid
                          const aConfirmed = a.payment?.status === 'confirmed'
                          const bConfirmed = b.payment?.status === 'confirmed'
                          if (aConfirmed === bConfirmed) return 0
                          return aConfirmed ? 1 : -1
                        })
                        .map((t) => {
                          const isPaymentConfirmed = t.payment?.status === 'confirmed'
                          return (
                            <View key={t.trip_id} className={`bg-white border ${isPaymentConfirmed ? 'border-gray-300 opacity-70' : 'border-green-200'} rounded-xl p-4 mb-3`}>
                              <View className="flex-row items-start">
                                <Image 
                                  source={{ uri: t.passenger_info?.photo_url || 'https://placehold.co/50x50' }} 
                                  className="w-12 h-12 rounded-full" 
                                />
                                <View className="flex-1 ml-3">
                                  <Text className="text-black font-semibold text-sm">
                                    {t.passenger_info?.full_name || 'Passenger'}
                                  </Text>
                                  <Text className="text-zinc-400 text-xs">
                                    {t.passenger_info?.phone_number || 'No phone'}
                                  </Text>
                                  <Text className="text-zinc-500 text-xs mt-2">
                                    📍 Pickup: {t.pick_up}
                                  </Text>
                                  <Text className="text-zinc-500 text-xs">
                                    🎯 Destination: {t.destination}
                                  </Text>
                                  <Text className="text-zinc-500 text-xs">
                                    📏 Distance: {t.distance.toFixed(2)} km
                                  </Text>
                                  {t.passenger?.latitude && t.passenger?.longitude && (
                                    <Text className="text-blue-500 text-xs mt-1">
                                      📍 Current: {t.passenger.latitude.toFixed(4)}, {t.passenger.longitude.toFixed(4)}
                                    </Text>
                                  )}
                                  <Text className="text-zinc-400 text-xs mt-1">
                                    Status: {t.status} • Started: {new Date(t.start_time).toLocaleTimeString()}
                                  </Text>
                                  {isPaymentConfirmed && (
                                    <Text className="text-green-600 text-xs mt-1 font-semibold">
                                      ✓ Payment Confirmed
                                    </Text>
                                  )}
                                </View>
                              </View>
                              <Pressable
                                onPress={() => !isPaymentConfirmed && handleConfirmPayment(t)}
                                disabled={isPaymentConfirmed}
                                className={`w-full rounded-lg py-2 mt-3 ${isPaymentConfirmed ? 'bg-gray-300' : 'bg-green-500'}`}
                              >
                                <Text className={`text-center font-semibold text-xs ${isPaymentConfirmed ? 'text-gray-500' : 'text-white'}`}>
                                  {isPaymentConfirmed 
                                    ? '✓ Payment Confirmed' 
                                    : `✓ Confirm Payment ${t.payment?.amount ? `(₱${t.payment.amount.toFixed(2)})` : ''}`
                                  }
                                </Text>
                              </Pressable>
                            </View>
                          )
                        })
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
      </View>
    </GestureHandlerRootView>
  )
}