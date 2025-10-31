import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold mb-4">404 - Page Not Found</Text>
      <Link href="/(tabs)">
        <Text className="text-blue-500 underline">Go back home</Text>
      </Link>
    </View>
  );
}
