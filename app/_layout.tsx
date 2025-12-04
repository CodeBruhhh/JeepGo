import { SplashScreenController } from "@/components/splash-screen-controller";
import { useAuthContext } from "@/hooks/use-auth-context";
import AuthProvider from "@/providers/auth-provider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import './globals.css';

function RootNavigator() {
  const { isLoggedIn, role } = useAuthContext();
  const { isLoggedIn, role } = useAuthContext();

  return (
    <Stack screenOptions={{ headerShown: false }}>


      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="Roles" />
        <Stack.Screen name="loginCommute" />
        <Stack.Screen name="loginDriver" />
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
