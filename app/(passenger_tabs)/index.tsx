import MapComponent from '@/components/Map';
import { supabase } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Constants from 'expo-constants';

const API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  (Constants.expoConfig?.extra as { googleMapsApiKey?: string })?.googleMapsApiKey ||
  '';


interface Trip {
  trip_id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  pick_up: string;
  destination: string;
  distance: number;
  rating: number | null;
  driver_id: string;
  drivers?: {
    jeep_code: string;
  };
}

interface SavedPlace {
  saved_place_id: string;
  place_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Index() {
  const [profile, setProfile] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef(Math.random().toString(36).substring(7));
  const autocompleteCache = useRef(new Map<string, any[]>());

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setProfile(data.user);
        await fetchTrips(data.user.id);
        await fetchSavedPlaces(data.user.id);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const fetchTrips = async (userId: string) => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        drivers (
          jeep_code
        )
      `)
      .eq('passenger_id', userId)
      .order('start_time', { ascending: false });

    if (!error && data) {
      setTrips(data);
    }
  };

  const fetchSavedPlaces = async (userId: string) => {
    const { data, error } = await supabase
      .from('saved_places')
      .select('*')
      .eq('passenger_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedPlaces(data);
    }
  };

  const formatRoute = (pickup: string, destination: string) => {
    const shortenText = (text: string, maxLength: number = 15) => {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    return `${shortenText(pickup)} - ${shortenText(destination)}`;
  };

  const searchPlaces = useCallback(async (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    // Debounce - wait 500ms after user stops typing
    debounceTimerRef.current = setTimeout(async () => {
      const cacheKey = `autocomplete_${text.toLowerCase()}`;
      
      // Check cache first
      const cached = autocompleteCache.current.get(cacheKey);
      if (cached) {
        console.log('Using cached results for:', text);
        setPredictions(cached);
        return;
      }

      // Fetch from API
      console.log('Fetching from Places API:', text);
      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&sessiontoken=${sessionTokenRef.current}&key=${API_KEY}&components=country:ph&location=10.3157,123.8854&radius=50000`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
          setPredictions(data.predictions);
          autocompleteCache.current.set(cacheKey, data.predictions);
        } else {
          console.error('API Error:', data.status);
          setPredictions([]);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, []);

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}&sessiontoken=${sessionTokenRef.current}`
      );
      const data = await response.json();
      
      // Generate new session token after getting place details
      sessionTokenRef.current = Math.random().toString(36).substring(7);
      
      return data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  const savePlace = async (prediction: any) => {
    if (!profile) return;

    const placeDetails = await getPlaceDetails(prediction.place_id);
    
    const { error } = await supabase
      .from('saved_places')
      .insert({
        passenger_id: profile.id,
        place_id: prediction.place_id,
        place_name: prediction.structured_formatting.main_text,
        address: prediction.description,
        latitude: placeDetails?.geometry?.location?.lat || null,
        longitude: placeDetails?.geometry?.location?.lng || null,
      });

    if (!error) {
      await fetchSavedPlaces(profile.id);
      setShowAddPlace(false);
      setSearchQuery('');
      setPredictions([]);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4EED4]">
        <ActivityIndicator size="large" color="#C69C6D" />
        <Text className="text-center text-gray-500 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4EED4]">
        <Text className="text-center text-gray-500">Unable to load profile</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F4EED4]">
      <ScrollView showsVerticalScrollIndicator={false} style = {{ maxHeight: SCREEN_HEIGHT - 100}}>
        {/* Title */}
        <Text className="text-center text-2xl font-semibold text-black mt-[75] mb-[20]">
          Welcome back, {profile?.user_metadata.full_name}!
        </Text>

        <View className='items-center'>
          {/* Placeholder where map would be */}
          <MapComponent 
            style={{ width: '90%', height: 300, borderRadius: 20, overflow: 'hidden', borderWidth: 2}}
          />
        </View>

        {/* Previous Rides Section */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-semibold mb-3">Previous Rides</Text>

          {trips.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {trips.map((trip) => (
                <View 
                  key={trip.trip_id} 
                  className="items-center bg-[#E5DDF4] rounded-xl px-4 py-3 w-32"
                >
                  <Text className="text-2xl font-bold text-[#8B5CF6]">
                    {trip.drivers?.jeep_code || 'N/A'}
                  </Text>
                  <Text className="text-xs text-center text-gray-600 mt-1" numberOfLines={2}>
                    {formatRoute(trip.pick_up, trip.destination)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-[#E5DDF4] rounded-xl px-4 py-6 items-center">
              <Text className="text-sm text-gray-600 text-center">
                No previous rides yet. Start your first ride!
              </Text>
            </View>
          )}
        </View>

        {/* Saved Section */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-semibold mb-3">Saved Places</Text>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {/* Add Place Button */}
            <TouchableOpacity 
              onPress={() => setShowAddPlace(true)}
              className="items-center justify-center bg-[#D2A8FF] rounded-xl px-4 py-3 w-32 border-2 border-dashed border-[#8B5CF6]"
            >
              <Text className="text-3xl">➕</Text>
              <Text className="text-xs text-center mt-2 font-semibold">
                Add Place
              </Text>
            </TouchableOpacity>

            {savedPlaces.length > 0 ? (
              savedPlaces.map((place) => (
                <View 
                  key={place.saved_place_id} 
                  className="items-center bg-[#E5DDF4] rounded-xl px-4 py-3 w-32"
                >
                  <Text className="text-xl font-bold">📍</Text>
                  <Text className="text-xs text-center" numberOfLines={3}>
                    {place.place_name}
                  </Text>
                  {place.address && (
                    <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
                      {place.address}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View className="bg-[#E5DDF4] rounded-xl px-4 py-3 w-64 justify-center">
                <Text className="text-sm text-gray-600 text-center">
                  No saved places yet. Add your favorite destinations!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Add Place Modal */}
      <Modal
        visible={showAddPlace}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPlace(false)}
      >
        <View className="flex-1 justify-center bg-black/50">
          <View className="bg-white rounded-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold">Add Saved Place</Text>
              <TouchableOpacity onPress={() => {
                setShowAddPlace(false);
                setSearchQuery('');
                setPredictions([]);
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
              }}>
                <Text className="text-2xl text-gray-500">✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
              placeholder="Search for a place..."
              value={searchQuery}
              onChangeText={searchPlaces}
              autoFocus
            />

            {searchLoading && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            )}

            <ScrollView>
              {predictions.length === 0 && searchQuery.length >= 3 && !searchLoading && (
                <Text className="text-center text-gray-500 py-4">
                  No results found
                </Text>
              )}
              {predictions.length === 0 && searchQuery.length < 3 && searchQuery.length > 0 && (
                <Text className="text-center text-gray-500 py-4">
                  Type at least 3 characters to search
                </Text>
              )}
              {predictions.map((result) => (
                <TouchableOpacity
                  key={result.place_id}
                  onPress={() => savePlace(result)}
                  className="py-3 border-b border-gray-200"
                >
                  <Text className="font-semibold">
                    {result.structured_formatting.main_text}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {result.structured_formatting.secondary_text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}