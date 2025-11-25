import { icons } from '@/constants/icons';
import React, { forwardRef, useImperativeHandle } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const Header = forwardRef((_, ref) => {
  const translateY = useSharedValue(0);

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
      <TouchableOpacity>
        <Image source={icons.notification} className='w-[30] h-[30]' />
      </TouchableOpacity>
    </Animated.View>
  );
});

export default Header;
