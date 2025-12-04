import { icons } from '@/constants/icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TAB_COUNT = 4;
const margin = 0;
const TAB_WIDTH = (width - margin) / TAB_COUNT;

interface CustomTabBarProps extends BottomTabBarProps {
  hideBar?: () => void;
  showBar?: boolean; // new: control visibility
}

const BottomNavigationBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  hideBar,
  showBar = true,
}) => {
  const translateY = useSharedValue(0); // controls slide animation

  React.useEffect(() => {
    // slide down when showBar = false
    translateY.value = withTiming(showBar ? 0 : 150, { duration: 300 });
  }, [showBar]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
    ],
  }));

  const iconMap = {
    index: icons.home,
    analytics: icons.analytics,
    history: icons.history_w,
    account: icons.account_w,
  };

  const [pressed, setPressed] = useState(false);


  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          height: 100,
          backgroundColor: '#ffffff',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          zIndex: 10,
          boxShadow: "0px -5px 10px rgba(0, 0, 0, 0.2)"
        },
        animatedStyle,
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const focused = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            style={{
              width: TAB_WIDTH,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <View
              style={{
                width: focused ? 55 : 50,
                height: focused ? 55 : 50,
                backgroundColor: focused ? '#C3B1E1' : '#D4C4A8',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
                borderWidth: 0.5,
              }}
            >
              <Image
                source={iconMap[route.name as keyof typeof iconMap]}
                style={{
                  tintColor: '#ffffff',
                  width: focused ? 30 : 25,
                  height: focused ? 30 : 25,
                }}
              />
            </View>

            <Text
              style={{
                color: focused ? '#C3B1E1' : '#D4C4A8',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

export default BottomNavigationBar;
