import BottomNavigationBar from "@/components/BottomNavigationBar";
import { Tabs } from "expo-router";
import React from "react";

const _layout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            tabBarStyle: { display: 'none' },
        }}
        tabBar={(props) => <BottomNavigationBar {...props} />}
    >
        <Tabs.Screen
            name="home"
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
  )
}

export default _layout