import ArrowBack from '@/assets/icons/arrow_back.png';
import LocationIcon from '@/assets/icons/purple_location_icon.png';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ride = () => {
  type PlacePrediction = {
      description: string;
      place_id: string;
      structured_formatting?: {
        main_text: string;
        secondary_text?: string;
      };
    };

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  
  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const searchPlaces = async (text: string) => {
    setSearchQuery(text);
    
    if (text.length > 2) {
      setLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
          setPredictions(data.predictions as PlacePrediction[]);

        } else {
          console.error('API Error:', data.status, data.error_message);
          setPredictions(data.predictions as PlacePrediction[]);

        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setPredictions([]);
    }
  };

  const selectPlace = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('Selected place:', data.result);
        const location = data.result.geometry.location;
        console.log('Coordinates:', location.lat, location.lng);
        
        // Clear search and close dropdown
        setSearchQuery(data.result.name);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  return (
        //add linear gradient later
        <View className="flex-1 bg-secondary">
          <View className="py-4 flex-row items-center bg-tertiary">
            <TouchableOpacity className='w-50 h-50 rounded-full ml-4 mr-2' onPress={() => router.back()}>
              <Image source={ArrowBack} className='w-[40] h-[40]'/>
            </TouchableOpacity>
            <Text className="text-3xl ml-4">Start Ride</Text>
          </View>

          <View className='items-center pb-[50]'>
            {/* Search Container - Add relative positioning */}
            <View className='relative w-[90%]'>
              <View className='items-center w-full h-[75] bg-white rounded-2xl mt-[50] elevation-4 shadow-xl flex-row'
                style={{
                  boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)"
                }}>
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
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setPredictions([]); }} className="mr-2">
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggestions Dropdown - Make it absolute */}
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
            <Text className='text-2xl font-bold ml-[35]'>Popular</Text>
            
            <ScrollView
              className=""
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              style={{ height: 300 }}
            >
              <View className='w-full items-center gap-[15]'>
                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]' 
                onPress={() => router.back()}
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <Text className='text-2xl font-bold mt-[15] ml-[35]'>Saved</Text>
            <ScrollView
              className=""
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              style={{ height: 300 }}
            >
              <View className='w-full items-center gap-[15]'>
                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                className='w-[80%] h-[75] rounded-xl bg-highlight p-[15]'
                activeOpacity={0.8}
                >
                  <Text className='text-xl font-bold'>Location Name</Text>
                  <Text className='text-m'>Location Address</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        {/*<MapScreen style={{ flex: 1, width: '100%' }} />*/}
      </View>
  )
}

export default ride