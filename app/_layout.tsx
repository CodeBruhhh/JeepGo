import { SplashScreenController } from "@/components/splash-screen-controller";
import { useAuthContext } from "@/hooks/use-auth-context";
import AuthProvider from "@/providers/auth-provider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import './globals.css';

function RootNavigator() {
  const { isLoggedIn, role, isLoading } = useAuthContext();

  if (isLoading) return null; // or splash screen

  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* Passenger Tabs */}
      <Stack.Protected guard={isLoggedIn && role === 'passenger'}>
        <Stack.Screen name="(passenger_tabs)" />
      </Stack.Protected>

      {/* Driver Tabs */}
      <Stack.Protected guard={isLoggedIn && role === 'driver'}>
        <Stack.Screen name="(driver_tabs)" />
      </Stack.Protected>

      {/* Auth / Roles */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="Roles" />
        <Stack.Screen name="login_passenger" />
        <Stack.Screen name="login_driver" />
      </Stack.Protected>

      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
        <SafeAreaView className="flex-1 bg-tertiary">
          <StatusBar hidden={false} style='dark'/>
          <SplashScreenController />
          <RootNavigator />
        </SafeAreaView>
    </AuthProvider>
  );
}
