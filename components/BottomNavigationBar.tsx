import { icons } from '@/constants/icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
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
    history: icons.history,
    routes: icons.routes,
    ride: icons.ride,
    fares: icons.fares,
    account: icons.account,
  };

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          height: 100,
          backgroundColor: '#CDA678',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderColor: '#0f0d23',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        animatedStyle,
      ]}
    >
      {state.routes.map((route, index) => {
        if (['home', 'index', 'ride'].includes(route.name)) return null;

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
                backgroundColor: focused ? '#ffffff' : '#C3B1E1',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Image
                source={iconMap[route.name as keyof typeof iconMap]}
                style={{
                  tintColor: focused ? '#8D5C8A' : '#000000',
                  width: focused ? 30 : 25,
                  height: focused ? 30 : 25,
                }}
              />
            </View>

            <Text
              style={{
                color: focused ? '#4B285E' : '#000000',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Ride Button */}
      <TouchableOpacity
        onPress={() => {
          hideBar?.(); // triggers slide down
          navigation.navigate('ride');
        }}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: [{ translateX: -35 }],
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: '#C57BFF',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
          borderWidth: 1,
          borderColor: '#0f0d23',
        }}
      >
        <Image
          source={icons.ride}
          style={{
            tintColor: '#000000',
            width: 60,
            height: 60,
          }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default BottomNavigationBar;
