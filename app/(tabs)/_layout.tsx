import BottomNavigationBar from "@/components/BottomNavigationBar";
import Header from "@/components/Header";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

const _layout = () => {
  const [showBar, setShowBar] = useState(true); // For hiding navigation
  const headerRef = React.useRef<{ hideHeader: () => void; showHeader: () => void }>(null); // For hiding header
  const { showRideButton } = useRideButton();

  // Sync header/footer visibility with bottom sheet state from context (used on routes screen)
  useEffect(() => {
    if (showRideButton) {
      setShowBar(true);
      headerRef.current?.showHeader();
    } else {
      setShowBar(false);
      headerRef.current?.hideHeader();
    }
  }, [showRideButton]);

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
                const hideList = ['ride', 'routes', 'map_screen'];
                if (hideList.some((name) => e.target?.includes(name))) {
                    setShowBar(false);
                    headerRef.current?.hideHeader();
                }
                },
                blur: (e) => {
                const hideList = ['ride', 'routes', 'map_screen'];
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
            <Tabs.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
            <Tabs.Screen name="history" options={{ headerShown: false , title: 'History'}} />
            <Tabs.Screen name="routes" options={{ headerShown: false , title: 'Routes'}} />
            <Tabs.Screen name="ride" options={{ headerShown: false , title: 'Start Ride'}} />
            <Tabs.Screen name="fares" options={{ headerShown: false , title: 'Fares'}} />
            <Tabs.Screen name="account" options={{ headerShown: false , title: 'Account'}} />
            <Tabs.Screen name="map_screen" options={{ headerShown: false , title: 'MapScreen'}} />
            <Tabs.Screen name="ride_tracking" options={{ headerShown: false , title: 'RideTracking'}} />
            </Tabs>
      </View>
  );
};

export default _layout;
