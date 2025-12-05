import BottomNavigationBar from "@/components/DriverNavigation";
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function DriverTabsLayout() {

  const [showBar, setShowBar] = useState(true); // For hiding navigation

  return (
    <GestureHandlerRootView className="flex-1">
    <View className="flex-1">
    <Tabs 
      initialRouteName="index"
      screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => (
        <BottomNavigationBar
        {...props}
        showBar={showBar}
        hideBar={() => {
            setShowBar(false);
        }}
        />
    )}
    >
      <Tabs.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
      <Tabs.Screen name="analytics" options={{ headerShown: false, title: 'Analytics' }} />
      <Tabs.Screen name="history" options={{ headerShown: false, title: 'History' }} />
      <Tabs.Screen name="account" options={{ headerShown: false, title: 'Account' }} />
    </Tabs>
    </View>
    </GestureHandlerRootView>
  );
}
