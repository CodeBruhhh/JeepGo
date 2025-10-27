import BottomNavigationBar from "@/components/BottomNavigationBar";
import Header from "@/components/Header";
import { RideButtonProvider, useRideButton } from "@/contexts/RideButtonContext";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

const TabsContent = () => {
  const { showRideButton } = useRideButton();
  
  return (
    <Tabs
        initialRouteName="index"
        screenOptions={{
            tabBarShowLabel: false,
            tabBarStyle: { display: 'none' },
        }}
        tabBar={(props) => <BottomNavigationBar {...props as any} showRideButton={showRideButton} />}
    >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name = "history"
                options = {{
                    title: 'History',
                    headerShown: false
                    }}
            />
            <Tabs.Screen
                name = "routes"
                options = {{
                    title: 'Routes',
                    headerShown: false
                    }}
            />
            <Tabs.Screen
                name = "ride"
                options = {{
                    title: 'Ride',
                    headerShown: false
                    }}
            />
            <Tabs.Screen
                name = "fares"
                options = {{
                    title: 'Fares',
                    headerShown: false
                    }}
            />
            <Tabs.Screen
                name = "account"
                options = {{
                    title: 'Account',
                    headerShown: false
                    }}
            />
        </Tabs>
  );
};

const _layout = () => {
  return (
    <RideButtonProvider>
      <View className="flex-1">
        <Header />
        <TabsContent />
      </View>
    </RideButtonProvider>
  );
};

export default _layout