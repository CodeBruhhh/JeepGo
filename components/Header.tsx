import { icons } from '@/constants/icons';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Image, TouchableOpacity, Modal, View, Text, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const Header = forwardRef((_, ref) => {
  const translateY = useSharedValue(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const hideHeader = () => {
    translateY.value = withTiming(-80, { duration: 250 }); // slides up
  };

  const showHeader = () => {
    translateY.value = withTiming(0, { duration: 250 }); // slides back down
  };

  useImperativeHandle(ref, () => ({
    hideHeader,
    showHeader,
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      <Animated.View
        style={[
          animatedStyle,
          {
            boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)"
          }
        ]}
        className='
          w-full
          h-[60px] 
          bg-tertiary 
          flex-row 
          absolute 
          top-0
          z-10 
          items-center
          pr-4
          justify-between
          elevation-4 
          shadow-xl'
      >
        <Image source={icons.jeepGo} className='w-[60] h-[60]' />
        <TouchableOpacity onPress={() => setShowNotifications(true)}>
          <Image source={icons.notification} className='w-[30] h-[30]' />
        </TouchableOpacity>
      </Animated.View>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View className="flex-1" />
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-6 max-h-[80%]"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold">Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text className="text-2xl text-gray-500">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* No Notifications Message */}
              <View className="items-center justify-center py-12">
                <Text className="text-6xl mb-4">🔔</Text>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  No notifications yet
                </Text>
                <Text className="text-sm text-gray-500 text-center">
                  You'll see updates about your rides and saved places here
                </Text>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

export default Header;