import ArrowBack from '@/assets/icons/arrow_back.png';
import LocationIcon from '@/assets/icons/purple_location_icon.png';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

class Cache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes: number = 30) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }
}

const autocompleteCache = new Cache(30);
const placeDetailsCache = new Cache(60);

const ride = () => {
  type PlacePrediction = {
      description: string;
      place_id: string;
      structured_formatting?: {
        main_text: string;
        secondary_text?: string;
      };
  };

  type SavedPlace = {
    place_id: string;
    place_name: string;
    address: string;
    latitude: number;
    longitude: number;
  };

  type PopularPlace = {
    place_id: string;
    name: string;
    vicinity: string;
    rating?: number;
    user_ratings_total?: number;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };

  // Search Places Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Popular places
  const [popularPlaces, setPopularPlaces] = useState<PopularPlace[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  // Safe UUID generator
  const generateUUID = async () => {
    const maybeUuid = Crypto.randomUUID();
    return typeof maybeUuid === 'string' ? maybeUuid : await maybeUuid;
  };

  // Session token ref
  const sessionTokenRef = useRef<string>('');

  // Saved places
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  
  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Initialize session token and fetch popular places
  useEffect(() => {
    (async () => {
      sessionTokenRef.current = await generateUUID();
      await fetchPopularPlaces();
    })();
  }, []);

  // Fetch popular places nearby
  const fetchPopularPlaces = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setPopularLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch nearby popular places (restaurants, tourist attractions, shopping)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&type=tourist_attraction|shopping_mall|restaurant&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        // Sort by rating and popularity
        const sortedPlaces = data.results
          .filter((place: PopularPlace) => place.rating && place.user_ratings_total)
          .sort((a: PopularPlace, b: PopularPlace) => {
            const scoreA = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
            const scoreB = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
            return scoreB - scoreA;
          })
          .slice(0, 5); // Top 5 places

        setPopularPlaces(sortedPlaces);
      }
    } catch (error) {
      console.error('Error fetching popular places:', error);
    } finally {
      setPopularLoading(false);
    }
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
      const cached = autocompleteCache.get(cacheKey);
      if (cached) {
        console.log('Using cached results for:', text);
        setPredictions(cached);
        return;
      }

      // Fetch from API
      console.log('Fetching from Places API:', text);
      setLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&sessiontoken=${sessionTokenRef.current}&key=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
          setPredictions(data.predictions);
          autocompleteCache.set(cacheKey, data.predictions);
        } else {
          console.error('API Error:', data.status);
          setPredictions([]);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const selectPlace = async (placeId: string) => {
    const cacheKey = `place_details_${placeId}`;
    
    // Check cache
    const cached = placeDetailsCache.get(cacheKey);
    if (cached) {
      console.log('Using cached place details');
      navigateToMap(cached.name, cached.geometry.location.lat, cached.geometry.location.lng);
      setSearchQuery('');
      setPredictions([]);
      sessionTokenRef.current = await generateUUID();
      return;
    }

    // Fetch from API
    console.log('Fetching place details');
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&sessiontoken=${sessionTokenRef.current}&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        const place = data.result;
        placeDetailsCache.set(cacheKey, place);
        
        navigateToMap(place.name, place.geometry.location.lat, place.geometry.location.lng);
        setSearchQuery('');
        setPredictions([]);
        sessionTokenRef.current = await generateUUID();
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const navigateToMap = (name: string, lat: number, lng: number) => {
    router.push({
      pathname: '/(tabs)/map_screen',
      params: {
        lat: lat.toString(),
        lng: lng.toString(),
        name: name,
      },
    });
  };

  // Reset session token when user clears search
  const clearSearch = async () => {
    setSearchQuery('');
    setPredictions([]);
    sessionTokenRef.current = await generateUUID();
  };

  const fetchSavedPlaces = async () => {
    setLoading(true); 
    const { data, error } = await supabase
      .from('saved_places')
      .select('place_id, place_name, address, latitude, longitude');

    if (error) {
      console.error('Error fetching saved places:', error.message);
    } else {
      setPlaces(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSavedPlaces();
  }, []);

  return (
    <View className="flex-1 bg-secondary">
      <View className="py-4 flex-row items-center bg-tertiary">
        <TouchableOpacity className='w-50 h-50 rounded-full ml-4 mr-2' onPress={() => router.back()}>
          <Image source={ArrowBack} className='w-[40] h-[40]'/>
        </TouchableOpacity>
        <Text className="text-3xl ml-4">Start Ride</Text>
      </View>

      <View className='items-center pb-[50]'>
        <View className='relative w-[90%]'>
          <View className='items-center w-full h-[75] bg-white rounded-2xl mt-[50] elevation-4 shadow-xl flex-row'
            style={{ boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" }}>
            <Image
              source={LocationIcon}
              className="w-[40] h-[40] ml-2"
              resizeMode="contain"
            />
            
            <TextInput 
              placeholder='Enter Destination...' 
              placeholderTextColor="#3B3B3B"
              value={searchQuery}
              onChangeText={searchPlaces}
              className='flex-1 pl-4'
              style={{ color: 'black', fontSize: 16}}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" className="mr-2" />}
            {searchQuery.length > 0 && !loading && (
              <TouchableOpacity onPress={clearSearch} className="mr-2">
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggestions Dropdown */}
          {predictions.length > 0 && (
            <View 
              className="absolute top-[125] w-full bg-white rounded-lg border border-gray-200 z-50 max-h-[300]"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                nestedScrollEnabled={true}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-highlight"
                    onPress={() => selectPlace(item.place_id)}
                  >
                    <Ionicons name="location-outline" size={20} color="#550CBF" />
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-bold">
                        {item.structured_formatting?.main_text}
                      </Text>
                      <Text className="text-sm">
                        {item.structured_formatting?.secondary_text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>

      <View className=''>
        <Text className='text-2xl font-bold ml-[35] mb-[20]'>Popular Nearby</Text>
        
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          style={{ height: '25%' }}
        >
          <View className='w-full items-center gap-[15]'>
            {popularLoading ? (
              <ActivityIndicator size="large" color="#550CBF" className="mt-10" />
            ) : popularPlaces.length === 0 ? (
              <Text className="text-gray-500 text-center mt-10">
                No popular places found nearby
              </Text>
            ) : (
              popularPlaces.map((place) => (
                <TouchableOpacity 
                  key={place.place_id}
                  className='w-[80%] rounded-xl bg-highlight p-[15]' 
                  onPress={() => navigateToMap(place.name, place.geometry.location.lat, place.geometry.location.lng)}
                  activeOpacity={0.8}
                >
                  <Text 
                    className='text-xl font-bold'
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {place.name}
                  </Text>
                  <Text 
                    className='text-m'
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {place.vicinity}
                  </Text>
                  {place.rating && (
                    <Text className='text-sm text-gray-600 mt-1'>
                      ⭐ {place.rating} • {place.user_ratings_total} reviews
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        <Text className='text-2xl font-bold mt-[15] ml-[35] mb-[20]'>Saved</Text>
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          style={{ height: '25%' }}
        >
          <View className='w-full items-center gap-[15]'>
            {loading ? (
              <ActivityIndicator size="large" color="#550CBF" className="mt-10" />
            ) : places.length === 0 ? (
              <Text className="text-gray-500 text-center mt-10">
                You have no saved places yet.
              </Text>
            ) : (
              places.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  className='w-[80%] rounded-xl bg-highlight p-[15]'
                  activeOpacity={0.8}
                  onPress={() => navigateToMap(place.place_name, place.latitude, place.longitude)}
                >
                  <Text 
                    className='text-xl font-bold'
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {place.place_name}
                  </Text>
                  <Text 
                    className='text-m'
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {place.address}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default ride;