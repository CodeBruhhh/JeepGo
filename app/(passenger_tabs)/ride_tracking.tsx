import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_TRANSLATE = SCREEN_HEIGHT * 0.5;
const MIN_TRANSLATE = SCREEN_HEIGHT * 0.85;

const RideTracking = () => {
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    name?: string;
    requestId?: string;
    driverId?: string;
    userLat?: string;
    userLng?: string;
    passengerId?: string;
  }>();

  // Extract params with fallbacks
  const requestId = params.requestId;
  const driverId = params.driverId;
  const passengerId = params.passengerId;
  const lat = params.lat;
  const lng = params.lng;
  const name = params.name;
  const userLat = params.userLat;
  const userLng = params.userLng;

  const [userLocation, setUserLocation] = useState<LatLng | null>(
    userLat && userLng
      ? { latitude: Number(userLat), longitude: Number(userLng) }
      : null
  );
  const [pickupLocation, setPickupLocation] = useState<LatLng | null>(null);
  const [pickupLocationName, setPickupLocationName] = useState<string>('');
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [rideStatus, setRideStatus] = useState<string>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<{ name: string; jeepCode: string; rating?: number; photo_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [submittedRating, setSubmittedRating] = useState(false);
  const [destination, setDestination] = useState<LatLng | null>(
    lat && lng ? { latitude: Number(lat), longitude: Number(lng) } : null
  );
  const [destinationName, setDestinationName] = useState<string | null>(name || null);
  const [rideStartTime, setRideStartTime] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [fareAmount, setFareAmount] = useState<number>(0);
  
  // Calculate fare based on distance (base fare + per km rate)
  const calculateFare = (distanceInMeters: number): number => {
    const distanceInKm = distanceInMeters / 1000;
    const baseFare = 13; // Base fare in PHP
    const perKmRate = 1.80; // Rate per km in PHP
    
    if (distanceInKm <= 4) {
      return baseFare;
    } else {
      const additionalKm = distanceInKm - 4;
      const totalFare = baseFare + (additionalKm * perKmRate);
      return Math.round(totalFare * 100) / 100; // Round to 2 decimal places
    }
  };
  
  // Route coordinates for polylines
  const [userToPickupRoute, setUserToPickupRoute] = useState<LatLng[]>([]);
  const [jeepToDestinationRoute, setJeepToDestinationRoute] = useState<LatLng[]>([]);

  const mapRef = useRef<MapView>(null);
  const translateY = useRef(new Animated.Value(MIN_TRANSLATE)).current;

  const [isCancelling, setIsCancelling] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);

  // Update all data when params change
  useEffect(() => {
    console.log('=== RIDE TRACKING PARAMS UPDATED ===');
    console.log('requestId:', requestId, 'Type:', typeof requestId);
    console.log('driverId:', driverId, 'Type:', typeof driverId);
    console.log('passengerId:', passengerId, 'Type:', typeof passengerId);
    console.log('userLat:', userLat, 'userLng:', userLng);
    console.log('lat:', lat, 'lng:', lng, 'name:', name);
    console.log('============================');

    if (userLat && userLng) {
      setUserLocation({ latitude: Number(userLat), longitude: Number(userLng) });
    }
    if (lat && lng) {
      setDestination({ latitude: Number(lat), longitude: Number(lng) });
    }
    if (name) {
      setDestinationName(name);
    }
  }, [requestId, driverId, passengerId, userLat, userLng, lat, lng, name]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = MIN_TRANSLATE + gestureState.dy;
        if (newY >= MAX_TRANSLATE && newY <= MIN_TRANSLATE) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = MIN_TRANSLATE + gestureState.dy;
        const midPoint = (MAX_TRANSLATE + MIN_TRANSLATE) / 2;

        if (currentY < midPoint) {
          Animated.spring(translateY, {
            toValue: MAX_TRANSLATE,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        } else {
          Animated.spring(translateY, {
            toValue: MIN_TRANSLATE,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const decodePolyline = (encoded: string): LatLng[] => {
    let points: LatLng[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  // Get location name from coordinates using reverse geocoding
  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Fetch route from Google Maps Directions API
  const fetchRoute = async (
    start: LatLng,
    end: LatLng,
    jeepCode: string
  ): Promise<{ route: LatLng[]; distance: number }> => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}` +
        `&destination=${end.latitude},${end.longitude}&mode=transit&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes?.length) return { route: [start, end], distance: 0 };

      const matchingRoute = data.routes.find((route: any) => {
        const steps = route.legs?.[0]?.steps || [];
        return steps.some(
          (step: any) =>
            step.transit_details &&
            step.transit_details.line?.short_name === jeepCode
        );
      });

      const selectedRoute = matchingRoute ?? data.routes[0];
      const distanceKm = (selectedRoute.legs[0]?.distance?.value ?? 0) / 1000;

      console.log(`Route distance for jeep ${jeepCode}:`, distanceKm);

      if (selectedRoute.overview_polyline?.points) {
        return {
          route: decodePolyline(selectedRoute.overview_polyline.points),
          distance: distanceKm
        };
      }
    } catch (error) {
      console.error("Route fetch error:", error);
    }

    return { route: [start, end], distance: 0 };
  };

  // Update walking route from user to pickup location
  useEffect(() => {
    if (userLocation && pickupLocation) {
      fetchRoute(userLocation, pickupLocation, 'walking').then(({ route }) => setUserToPickupRoute(route));
    }
  }, [userLocation, pickupLocation]);

  // Update jeep route from driver location to destination and track distance
  useEffect(() => {
    if (driverLocation && destination && driverInfo?.jeepCode) {
      fetchRoute(driverLocation, destination, driverInfo.jeepCode).then(({ route, distance }) => {
        setJeepToDestinationRoute(route);
        setTotalDistance(distance);
        const fare = calculateFare(distance);
        setFareAmount(fare);
        console.log(`Distance: ${(distance).toFixed(2)} km, Fare: ₱${fare}`);
      });
    }
  }, [driverLocation, destination, driverInfo]);

  // Fetch passenger location
  useEffect(() => {
    const fetchLocation = async () => {
      if (userLat && userLng) {
        setLoading(false);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      } catch (err) {
        console.error('Location error', err);
        Alert.alert('Error', 'Could not get your location.');
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  // Fetch driver info
  useEffect(() => {
    const fetchDriver = async () => {
      if (!driverId) return;

      try {
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('driver_id, jeep_code, rating')
          .eq('driver_id', driverId)
          .single();

        if (driverError) {
          console.error('Driver fetch error:', driverError);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('user_info')
          .select('full_name, photo_url')
          .eq('user_id', driverId)
          .single();

        if (userError) {
          console.error('User info fetch error:', userError);
          return;
        }

        setDriverInfo({
          name: `${userData.full_name}`,
          jeepCode: driverData.jeep_code,
          rating: driverData.rating,
          photo_url: userData.photo_url,
        });
      } catch (err) {
        console.error('Error fetching driver info:', err);
      }
    };

    fetchDriver();
  }, [driverId]);

  // Fetch driver initial location and set pickup location
  useEffect(() => {
    if (!driverId) return;

    const fetchDriverLocation = async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('latitude, longitude')
        .eq('driver_id', driverId)
        .single();

      if (!error && data) {
        const jeepLocation = { latitude: data.latitude, longitude: data.longitude };
        setDriverLocation(jeepLocation);
        setPickupLocation(jeepLocation);
        
        // Get pickup location name
        const locationName = await getLocationName(data.latitude, data.longitude);
        setPickupLocationName(locationName);
      }
    };

    fetchDriverLocation();
  }, [driverId]);

  // Fetch destination and initial ride status from database
  useEffect(() => {
    if (!requestId) return;

    const fetchRideInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('ride_requests')
          .select('to_x, to_y, destination_name, status, created_at')
          .eq('request_id', requestId)
          .single();

        if (error) throw error;

        console.log('Fetched ride info:', data);
        
        if (!destination || !destinationName) {
          setDestination({ latitude: Number(data.to_x), longitude: Number(data.to_y) });
          setDestinationName(data.destination_name);
        }
        
        setRideStatus(data.status);
        
        // Set ride start time (when request was created)
        if (data.created_at) {
          setRideStartTime(data.created_at);
        }
      } catch (err) {
        console.error('Ride info fetch error:', err);
      }
    };

    fetchRideInfo();
  }, [requestId]);

  // Function to create trip record
  const createOrFetchTripRecord = async () => {
    if (tripId) return tripId; // trip already created

    if (!requestId || !driverId || !passengerId) return;

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          driver_id: driverId,
          passenger_id: passengerId,
          start_time: rideStartTime,
          end_time: null,                        
          status: 'ongoing',                     // ride in progress
          pick_up: pickupLocationName || null,
          destination: destinationName || null,
          distance: totalDistance,
          rating: null
        })
        .select()
        .single();

      if (!error) {
        setTripId(data.trip_id);
        console.log("Trip creation success", data);
        return data.trip_id;
      }
    } catch (err) {
      console.error("Trip creation error:", err);
    }
  };

  const finalizeTrip = async (finalStatus: 'completed' | 'cancelled') => {
    if (!tripId) return;

    await supabase
      .from('trips')
      .update({
        end_time: new Date().toISOString(),
        status: finalStatus,
        distance: totalDistance,
        destination: destinationName
      })
      .eq('trip_id', tripId);
  };

  // Subscribe to ride updates
  useEffect(() => {
    if (!requestId) {
      console.log('No requestId, skipping ride request subscription');
      return;
    }

    console.log('Setting up ride subscription for requestId:', requestId);

    const subscription = supabase
      .channel(`ride_${requestId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ride_requests', filter: `request_id=eq.${requestId}` },
        async (payload) => {
          console.log('Ride update received:', payload);
          const ride = payload.new;
          console.log('New ride status:', ride.status);
          setRideStatus(ride.status);
          
          if (ride.status === 'accepted') {
            await createOrFetchTripRecord(); 
          }

          if (ride.status === 'cancelled') {
            // Create trip record for cancelled ride
            await createOrFetchTripRecord();
            await finalizeTrip('cancelled');
            
            if (ride.cancelled_by === 'driver') {
              Alert.alert('Ride Cancelled', 'The driver cancelled your ride.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            }
          } else if (ride.status === 'completed') {
            // Create trip record immediately for completed ride
            await createOrFetchTripRecord();
            await finalizeTrip('completed');
            Alert.alert('Ride Completed', 'You have arrived at your destination!');
          }
        }
      )
      .subscribe((status) => {
        console.log('Ride subscription status:', status);
      });

    return () => {
      console.log('Cleaning up ride subscription');
      supabase.removeChannel(subscription);
    };
  }, [requestId, driverId, passengerId, rideStartTime, pickupLocationName, destinationName, totalDistance]);

  // Subscribe to payment updates
  useEffect(() => {
    if (!paymentId) {
      console.log('No paymentId, skipping payment subscription');
      return;
    }

    console.log('Setting up payment subscription for paymentId:', paymentId);

    const subscription = supabase
      .channel(`payment_${paymentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: `payment_id=eq.${paymentId}` },
        (payload) => {
          console.log('Payment update received:', payload);
          const payment = payload.new;
          console.log('New payment status:', payment.status);
          
          if (payment.status === 'confirmed') {
            setPaymentStatus('confirmed');
            Alert.alert('Payment Confirmed!', 'Your payment has been confirmed by the driver.');
          }
        }
      )
      .subscribe((status) => {
        console.log('Payment subscription status:', status);
      });

    return () => {
      console.log('Cleaning up payment subscription');
      supabase.removeChannel(subscription);
    };
  }, [paymentId]);

  // Subscribe to driver location
  useEffect(() => {
    if (!driverId) {
      console.log('No driverId, skipping driver location subscription');
      return;
    }

    console.log('Setting up driver location subscription for driverId:', driverId);

    const subscription = supabase
      .channel(`driver_location_${driverId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `driver_id=eq.${driverId}` },
        async (payload) => {
          console.log('Driver location update received:', payload);
          const newLocation = {
            latitude: payload.new.latitude,
            longitude: payload.new.longitude,
          };
          console.log('New driver location:', newLocation);
          setDriverLocation(newLocation);
          setPickupLocation(newLocation);
          
          // Update pickup location name
          const locationName = await getLocationName(newLocation.latitude, newLocation.longitude);
          setPickupLocationName(locationName);
        }
      )
      .subscribe((status) => {
        console.log('Driver location subscription status:', status);
      });

    return () => {
      console.log('Cleaning up driver location subscription');
      supabase.removeChannel(subscription);
    };
  }, [driverId]);

  const cancelRide = async () => {
    if (!requestId) return;

    setIsCancelling(true);

    const { error } = await supabase
      .from('ride_requests')
      .update({ status: 'cancelled', cancelled_by: 'passenger' })
      .eq('request_id', requestId);

    if (error) {
      Alert.alert('Error', 'Failed to cancel ride.');
      setIsCancelling(false);
      return;
    }

    // Create trip record for cancelled ride
    await createOrFetchTripRecord();

    Alert.alert('Ride Cancelled', 'Your ride has been cancelled.', [
      {
        text: 'OK',
        onPress: () => {
          setIsCancelling(false);
          router.back();
        },
      },
    ]);
  };

  const submitRating = async () => {
    if (!tripId || rating <= 0) {
      Alert.alert('Error', 'Please select a rating.');
      return;
    }

    // Update rating in trips table
    const { error } = await supabase
      .from('trips')
      .update({ rating })
      .eq('trip_id', tripId);

    if (error) {
      Alert.alert('Error', 'Failed to submit rating.');
      console.error('Rating update error:', error);
      return;
    }
    
    setSubmittedRating(true);
    Alert.alert('Thank you!', 'Your rating has been submitted.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handlePaymentSelection = async (method: 'cash' | 'gcash') => {
    if (!tripId) {
      console.log('No tripId available yet');
      return;
    }
    
    if (paymentStatus === 'confirmed') {
      console.log('Payment already confirmed');
      return;
    }

    // If changing payment method and there's an existing pending payment, delete it first
    if (paymentId && paymentMethod && paymentMethod !== method && paymentStatus === 'pending') {
      console.log('Deleting previous pending payment:', paymentId);
      
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('payment_id', paymentId);

      if (deleteError) {
        console.error('Error deleting previous payment:', deleteError);
      }
      
      // Reset payment states
      setPaymentId(null);
      setPaymentStatus(null);
    }

    // If clicking the same method that's already selected and pending, don't create duplicate
    if (paymentMethod === method && paymentStatus === 'pending') {
      console.log('Payment method already selected and pending');
      return;
    }

    setPaymentMethod(method);
    setPaymentStatus('pending');

    try {
      // Create new payment record
      const paymentData = {
        payment_method: method,
        trip_id: tripId,
        status: 'pending',
        amount: Math.round(fareAmount * 100) // Store in centavos/cents
      };

      console.log('Creating payment record:', paymentData);

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        Alert.alert('Error', 'Failed to process payment selection.');
        setPaymentStatus(null);
        return;
      }

      console.log('Payment record created:', data);
      setPaymentId(data.payment_id);
    } catch (err) {
      console.error('Payment selection error:', err);
      setPaymentStatus(null);
      setPaymentMethod(null);
    }
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'pending':
        return 'Waiting for driver to accept request...';
      case 'accepted':
        return 'Your jeep is on the way';
      case 'ongoing':
        return 'On the way to destination';
      case 'completed':
        return 'Ride completed';
      case 'cancelled':
        return 'Ride cancelled';
      default:
        return 'Processing...';
    }
  };

  const getInitialRegion = () => {
    const points = [userLocation, driverLocation, destination, pickupLocation].filter(Boolean) as LatLng[];
    if (points.length === 0) return { latitude: 14.5995, longitude: 120.9842, latitudeDelta: 0.1, longitudeDelta: 0.1 };

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(...lats) - Math.min(...lats) + 0.1,
      longitudeDelta: Math.max(...lngs) - Math.min(...lngs) + 0.1,
    };
  };

  if (!userLocation && !driverLocation && !destination && loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#550CBF" />
        <Text className="mt-2 text-gray-600">Loading ride...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={styles.map}
        region={getInitialRegion()}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {userLocation && <Marker coordinate={userLocation} title="You" pinColor="blue" />}
        {pickupLocation && rideStatus === 'pending' && <></>}
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver">
            <Image source={require('@/assets/images/jeep_icon.png')} style={{ width: 30, height: 30 }} />
          </Marker>
        )}
        {destination && (
          <Marker coordinate={destination} title={destinationName || 'Destination'} pinColor="red" />
        )}

        {userToPickupRoute.length > 0 && rideStatus === 'pending' && (
          <Polyline
            coordinates={userToPickupRoute}
            strokeColor="#808080"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {jeepToDestinationRoute.length > 0 && (
          <Polyline
            coordinates={jeepToDestinationRoute}
            strokeColor="#550CBF"
            strokeWidth={4}
          />
        )}
      </MapView>

      <TouchableOpacity
        className="absolute top-12 left-4 bg-white p-3 rounded-full z-50"
        style={styles.shadow}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Animated.View style={[styles.draggableModal, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} className="py-3 items-center">
          <View className="w-12 h-1 bg-gray-300 rounded-full" />
        </View>

        <View className="px-4 py-2 items-center bg-gray-50">
          <Text className="text-xl font-bold text-[#550CBF]">
            {getStatusText()}
          </Text>
        </View>

        <ScrollView 
          className="flex-1"
          style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="px-4 pb-4 pt-3">
            <Text className="text-lg font-bold mb-3">Driver Information</Text>

            {driverInfo ? (
              <View className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                <View className="flex-row items-center">
                  {driverInfo?.photo_url && (
                    <Image
                      source={{ uri: driverInfo.photo_url }}
                      style={{ width: 50, height: 50 }}
                      className="rounded-full mr-3"
                    />
                  )}
                  <View className="flex-1">
                    <Text className="text-base font-semibold">Name: {driverInfo.name}</Text>
                    <Text className="text-base font-semibold">Jeep: {driverInfo.jeepCode}</Text>
                    {driverInfo.rating !== undefined && (
                      <Text className="text-base font-semibold">Rating: {driverInfo.rating} ⭐</Text>
                    )}
                    <Text className="text-sm text-gray-600 mt-1">Status: {rideStatus}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <ActivityIndicator size="small" color="#550CBF" />
            )}

            {/* Trip Details and Payment - Only show when accepted or later */}
            {(rideStatus === 'accepted' || rideStatus === 'ongoing' || rideStatus === 'completed') && (
              <>
                <Text className="text-lg font-bold mb-2">Trip Details</Text>
                <View className="mb-3 p-3 rounded-lg bg-gray-50">
                  <Text className="text-sm text-gray-700">
                    Distance: <Text className="font-semibold">{(totalDistance).toFixed(2)} km</Text>
                  </Text>
                  <Text className="text-sm text-gray-700 mt-1">
                    Fare: <Text className="font-semibold">₱{fareAmount.toFixed(2)}</Text>
                  </Text>
                </View>

                <Text className="text-lg font-bold mb-2">Payment Method</Text>
                <View className="flex-row gap-3 mb-2">
                  <TouchableOpacity
                    onPress={() => handlePaymentSelection('cash')}
                    disabled={paymentStatus === 'confirmed'}
                    className="flex-1 p-4 rounded-lg items-center border-2"
                    style={{
                      backgroundColor: paymentStatus === 'confirmed' ? '#E5E5E5' : '#F5F5DC',
                      borderColor: paymentMethod === 'cash' ? '#550CBF' : 'transparent',
                      opacity: paymentStatus === 'confirmed' && paymentMethod !== 'cash' ? 0.5 : 1,
                    }}
                  >
                    <Ionicons 
                      name="cash-outline" 
                      size={24} 
                      color={paymentMethod === 'cash' ? '#550CBF' : '#666'} 
                    />
                    <Text 
                      className="mt-2 font-semibold text-center"
                      style={{ color: paymentMethod === 'cash' ? '#550CBF' : '#666' }}
                    >
                      Pay in Person
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handlePaymentSelection('gcash')}
                    disabled={paymentStatus === 'confirmed'}
                    className="flex-1 p-4 rounded-lg items-center border-2"
                    style={{
                      backgroundColor: paymentStatus === 'confirmed' ? '#E5E5E5' : '#F5F5DC',
                      borderColor: paymentMethod === 'gcash' ? '#550CBF' : 'transparent',
                      opacity: paymentStatus === 'confirmed' && paymentMethod !== 'gcash' ? 0.5 : 1,
                    }}
                  >
                    <Ionicons 
                      name="phone-portrait-outline" 
                      size={24} 
                      color={paymentMethod === 'gcash' ? '#550CBF' : '#666'} 
                    />
                    <Text 
                      className="mt-2 font-semibold text-center"
                      style={{ color: paymentMethod === 'gcash' ? '#550CBF' : '#666' }}
                    >
                      Pay via GCash
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Payment Status Text */}
                {paymentStatus === 'pending' && (
                  <View className="items-center mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Text className="text-sm text-yellow-800 font-semibold">
                      ⏳ Waiting for driver to confirm your payment
                    </Text>
                  </View>
                )}

                {paymentStatus === 'confirmed' && (
                  <View className="items-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Text className="text-base text-green-700 font-bold">
                      ✓ Payment Confirmed!
                    </Text>
                  </View>
                )}
              </>
            )}

            {rideStatus === 'completed' && !submittedRating && (
              <View className="mt-4">
                <Text className="mb-2 font-semibold">Rate your driver:</Text>
                <View className="flex-row mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Ionicons name={star <= rating ? "star" : "star-outline"} size={30} color="#facc15" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  className="bg-green-500 rounded-full py-3 items-center"
                  onPress={submitRating}
                >
                  <Text className="text-white font-bold text-lg">Submit Rating</Text>
                </TouchableOpacity>
              </View>
            )}

            {rideStatus !== 'completed' && rideStatus !== 'cancelled' && (
              <TouchableOpacity
                className="bg-red-500 rounded-full py-3 items-center mt-4"
                onPress={() => {
                  Alert.alert(
                    'Confirm Cancellation',
                    `Are you sure you want to cancel this Ride?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Yes', onPress: () => cancelRide() }
                    ]
                  );
                }}
                disabled={isCancelling}
              >
                <Text className="text-white font-bold text-lg">
                  {isCancelling ? 'Cancelling...' : 'Cancel Ride'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default RideTracking;

const styles = StyleSheet.create({
  map: { flex: 1 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  draggableModal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: SCREEN_HEIGHT,
  },
});