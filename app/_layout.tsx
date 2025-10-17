import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import './globals.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden={false} />
      <Stack>
        <Stack.Screen
          name = "(tabs)"
          options = {{headerShown: false}}
        />
      </Stack>;
    </>
  )
}
