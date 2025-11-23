import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const fares = () => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [passengerType, setPassengerType] = useState('Regular');
  const [calculatedFare, setCalculatedFare] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showPassengerPicker, setShowPassengerPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const locations = ['Parkmall', 'Urgello', 'Capitol', 'Ayala'];
  const passengerTypes = ['Regular', 'Student', 'Senior', 'PWD'];

  const handleCalculateFare = () => {
    if (fromLocation && toLocation && distance) {
      const baseFare = 10;
      const distanceFare = parseFloat(distance) * 1.5;
      let discount = 0;
      
      if (passengerType === 'Student') discount = 0.2;
      else if (passengerType === 'Senior' || passengerType === 'PWD') discount = 0.3;
      
      const total = (baseFare + distanceFare) * (1 - discount);
      setCalculatedFare(`P ${total.toFixed(2)}`);
    } else {
      setCalculatedFare('');
    }
  };

  const PickerModal = ({ 
    visible, 
    onClose, 
    options, 
    selectedValue, 
    onSelect, 
    title 
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-4 max-h-[50%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-dark">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className={`py-4 px-4 border-b border-gray-200 ${
                  selectedValue === item ? 'bg-primary/10' : ''
                }`}
              >
                <Text className={`text-base ${selectedValue === item ? 'text-primary font-bold' : 'text-dark'}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView className="flex-1 bg-secondary" contentContainerStyle={{ paddingBottom: 120 }}>
      <View className="px-4 pt-4">
        {/* Title - Centered */}
        <Text className="text-3xl font-bold text-primary mb-4 text-center">FARES & CALCULATOR</Text>

        {/* Filter Destination */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setShowFilterPicker(true)}
            className="bg-white border-2 border-primary rounded-lg py-3 px-4 flex-row justify-between items-center"
          >
            <Text className="text-dark">{filterDestination || 'Filter Destination'}</Text>
            <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
          </TouchableOpacity>
        </View>

        {/* Fare Calculator Section */}
        <View className="bg-white border-2 border-primary rounded-lg p-4 mb-4">
          <Text className="text-xl font-bold text-primary mb-4 text-center">Fare Calculator</Text>

          {/* From Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">From</Text>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <TouchableOpacity
                onPress={() => setShowFromPicker(true)}
                className="flex-1 bg-highlight border border-gray-300 rounded-lg py-3 px-4 flex-row justify-between items-center"
              >
                <Text className="text-dark">{fromLocation || 'Select starting point'}</Text>
                <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* To Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">To</Text>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <TouchableOpacity
                onPress={() => setShowToPicker(true)}
                className="flex-1 bg-highlight border border-gray-300 rounded-lg py-3 px-4 flex-row justify-between items-center"
              >
                <Text className="text-dark">{toLocation || 'Select destination'}</Text>
                <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Distance Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">Distance</Text>
            <TextInput
              className="bg-highlight border border-gray-300 rounded-lg px-4 py-3 text-dark text-center"
              placeholder="Enter distance (km)"
              placeholderTextColor="#9CA3AF"
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
            />
          </View>

          {/* Passenger Type */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-dark mb-2 text-center">Passenger Type</Text>
            <TouchableOpacity
              onPress={() => setShowPassengerPicker(true)}
              className="bg-highlight border border-gray-300 rounded-lg py-3 px-4 flex-row justify-between items-center"
            >
              <Text className="text-dark">{passengerType}</Text>
              <Ionicons name="chevron-down" size={20} color="#8D5C8A" />
            </TouchableOpacity>
          </View>

          {/* Calculate Fare Button */}
          <TouchableOpacity
            onPress={handleCalculateFare}
            className="bg-primary py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-bold text-lg">Calculate Fare</Text>
          </TouchableOpacity>

          {/* Calculated Fare Result */}
          <TextInput
            className="bg-highlight border border-gray-300 rounded-lg px-4 py-3 text-dark text-center"
            placeholder="Calculated fare will appear here"
            placeholderTextColor="#9CA3AF"
            value={calculatedFare}
            editable={false}
          />
        </View>
      </View>

      {/* Modals */}
      <PickerModal
        visible={showFilterPicker}
        onClose={() => setShowFilterPicker(false)}
        options={['Filter Destination', ...locations]}
        selectedValue={filterDestination || 'Filter Destination'}
        onSelect={(value) => setFilterDestination(value === 'Filter Destination' ? '' : value)}
        title="Filter Destination"
      />

      <PickerModal
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        options={locations}
        selectedValue={fromLocation}
        onSelect={setFromLocation}
        title="Select Starting Point"
      />

      <PickerModal
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        options={locations}
        selectedValue={toLocation}
        onSelect={setToLocation}
        title="Select Destination"
      />

      <PickerModal
        visible={showPassengerPicker}
        onClose={() => setShowPassengerPicker(false)}
        options={passengerTypes}
        selectedValue={passengerType}
        onSelect={setPassengerType}
        title="Passenger Type"
      />
    </ScrollView>
  );
};

export default fares;
