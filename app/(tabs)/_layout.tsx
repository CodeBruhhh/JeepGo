import BottomNavigationBar from "@/components/BottomNavigationBar";
import Header from "@/components/Header";
import { RideButtonProvider, useRideButton } from "@/contexts/RideButtonContext";
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

const _layout = () => {
  const [showBar, setShowBar] = useState(true); // For hiding navigation
  const headerRef = React.useRef<{ hideHeader: () => void; showHeader: () => void }>(null); // For hiding header

  return (
    <View style={{ flex: 1 }}>
      <Header ref={headerRef} />

      <Tabs
            initialRouteName="index"
            screenOptions={{
                tabBarShowLabel: false,
                tabBarStyle: { display: 'none' },
            }}
            // Screens where the header and nav is hidden when opened
            // Add screen names to the hideList to trigger hiding and showing
            screenListeners={{
                focus: (e) => {
                const hideList = ['ride', 'routes'];
                if (hideList.some((name) => e.target?.includes(name))) {
                    setShowBar(false);
                    headerRef.current?.hideHeader();
                }
                },
                blur: (e) => {
                const hideList = ['ride', 'routes'];
                if (hideList.some((name) => e.target?.includes(name))) {
                    setShowBar(true);
                    headerRef.current?.showHeader();
                }
                },
            }}
            tabBar={(props) => (
                <BottomNavigationBar
                {...props}
                showBar={showBar}
                hideBar={() => {
                    setShowBar(false);
                    headerRef.current?.hideHeader();
                }}
                />
            )}
            >
            <Tabs.Screen name="index" options={{ headerShown: false }} />
            <Tabs.Screen name="history" options={{ headerShown: false }} />
            <Tabs.Screen name="routes" options={{ headerShown: false }} />
            <Tabs.Screen name="ride" options={{ headerShown: false }} />
            <Tabs.Screen name="fares" options={{ headerShown: false }} />
            <Tabs.Screen name="account" options={{ headerShown: false }} />
            </Tabs>
    </View>
  );
};

export default _layout;
