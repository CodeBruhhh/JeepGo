import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function RolesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#f8efd9ff]">

       <Image
          source={require("../assets/images/brief.png")}
          style={{
            position: "absolute",
            bottom: "10%",
            right: "20%",
            width: 400,
            height: 400,
          zIndex: 0,
            transform: [{ rotate: "-30deg" }],
            shadowColor: "#ffffffff",
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            tintColor: "#fffbf1ff",
          }}
          resizeMode="contain"
          />

             
          
     <View className="
      absolute
       z - 0
       left-[-200px]
       top-[-400px]
       w-[700px] 
       h-[700px] 
       bg-[#C4B5D8] 
       rounded-full 
       opacity-100" 
       />

        <View className="
      absolute
       z - 0
       left-[150px]
       bottom-[-300px]
       w-[600px] 
       h-[600px] 
       bg-[#C4B5D8] 
       rounded-full 
       opacity-100" 
       />

      

   <Image
          source={require("../assets/images/light.png")}
          style={{
            position: "absolute",
            bottom: "-16%",
            right: "-27%",
            width: 325,
            height: 325,
           zIndex: 0,
            transform: [{ rotate: "-30deg" }],
            shadowColor: "#ffffffff",
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            tintColor: "#fffbf1ff",
          }}
          resizeMode="contain"
          />

          
       

      <Text className="text-4xl font-bold mb-5 text-black">Welcome to JeepGo!</Text>
      <Text className="text-3xl font-bold mb-8 text-white">You are a...?</Text>

      <TouchableOpacity
        className="justify-center items-center bg-white rounded-2xl mb-10 p-5"
        style={{ 
          height: 250, 
          width: "90%", 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 20, }}
        onPress={() => router.push("/login_passenger?role=passenger")}
      >
        <View className="w-[150] h-[150] rounded-full bg-highlight items-center justify-center">
        <Image
          source={require("../assets/images/Run.png")}
          style={{ width: 100, height: 100, tintColor: "#ffffff"}}
        />
        </View>
        <Text className="text-center text-white text-3xl text-highlight font-bold mt-2">Passenger</Text>
      </TouchableOpacity>

      {/* DRIVER BUTTON */}
      <TouchableOpacity
        className=" justify-center items-center bg-white rounded-2xl"
        style={{ 
          height: 250, 
          width: "90%", 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 20, }}
        onPress={() => router.push("/login_driver?role=driver")}
      >
        <View className="w-[150] h-[150] bg-[#D4C4A8] items-center justify-center rounded-full">
        <Image
          source={require("../assets/images/Steering.png")}
          style={{ width: 100, height: 100, tintColor: "#ffffff"}}
        />
        </View>
        <Text className="text-center text-[#D4C4A8] text-3xl font-bold mt-2">Jeepney Driver</Text>
      </TouchableOpacity>

    </View>
  );
}
