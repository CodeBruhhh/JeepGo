import { supabase } from '@/services/supabase';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LogInScreen() {

   const { role } = useLocalSearchParams(); // "driver" or "passenger"
  
  // Login form states 
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('')
  // Register form states
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [loading, setLoading] = useState(false);

  // Tab form state
  const [activeTab, setActiveTab] = useState("login");

  // Forgot password modal
  const [showResetModal, setShowResetModal] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoading(false);
      Alert.alert('Login Failed', error.message);
      return;
    }

    // Check user's role in database
    const { data: userInfo, error: roleError } = await supabase
      .from('user_info')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    setLoading(false);

    if (roleError) {
      await supabase.auth.signOut();
      Alert.alert('Error', 'Failed to verify user role.');
      return;
    }

    // Verify role matches the screen role
    if (userInfo.role !== role) {
      await supabase.auth.signOut();
      Alert.alert(
        'Access Denied',
        `This account is registered as a ${userInfo.role}. Please use the ${userInfo.role} login.`
      );
      return;
    }

    Alert.alert('Success', `Welcome ${data.user.user_metadata?.full_name || 'back'}!`);
  };

  async function handleRegister() {
    if (!registerEmail || !registerPassword || !registerFullName) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: { data: { full_name: registerFullName } },
    });

    if (error) {
      Alert.alert('Sign-up Error', error.message);
      setLoading(false);
      return;
    }

    // Insert with the role from URL params
    if (data.user) {
      const { error: insertError } = await supabase
        .from('user_info')
        .insert({
          user_id: data.user.id,
          full_name: registerFullName,
          email: registerEmail,
          role: role || "driver", // Use role from params
        });

      if (insertError) {
        Alert.alert('DB Insert Error', insertError.message);
        console.log(insertError);
      }

      // If driver, also insert into driver table
      if (role === "driver") {
        await supabase
          .from('driver')
          .insert({
            driver_id: data.user.id
          });
      }
    }

    Alert.alert('Success', 'Check your email to confirm your account.');
    setLoading(false);
  }

  const handleForgotPassword = async () => {
    if (!loginEmail) return Alert.alert('Error', 'Please enter your email');

    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: 'jeepgo://auth/callback',
    });

    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Check your email', 'Password reset link sent');

    setShowResetModal(false);
  };


  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const onGoogleSignInPress = async () => {
    try {
      console.log('🔹 Checking Play Services...');
      await GoogleSignin.hasPlayServices();

      console.log('🔹 Launching Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In response:', JSON.stringify(userInfo, null, 2));

      const idToken = (userInfo as any).idToken ?? (userInfo.data?.idToken ?? null);
      console.log('🧾 Extracted ID Token:', idToken ? '✅ FOUND' : '❌ MISSING');

      if (!idToken) throw new Error('No ID token returned from Google Sign-In!');

      console.log('🔹 Sending ID token to Supabase...');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('❌ Supabase sign-in error:', error);
        return;
      }

      console.log('✅ Supabase login success:', data);
      if (data.user) {
        const { user } = data;

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('user_info')
          .select('user_id, role')
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Failed to check existing user:', checkError);
          await supabase.auth.signOut();
          Alert.alert('Error', 'Failed to verify user information.');
          return;
        }

        // If user exists, verify role matches
        if (existingUser) {
          console.log('ℹ️ User already exists, verifying role...');
          
          if (existingUser.role !== role) {
            await supabase.auth.signOut();
            Alert.alert(
              'Access Denied',
              `This Google account is registered as a ${existingUser.role}. Please use the ${existingUser.role} login.`
            );
            return;
          }
          
          console.log('✅ Role verified, login successful!');
          Alert.alert('Success', 'Welcome back!');
          return;
        }

        // User doesn't exist, create new account with current role
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          null;

        const email = user.email;

        // Insert into user_info table with role from params
        const { error: insertError } = await supabase
          .from('user_info')
          .insert({
            user_id: user.id,
            full_name: fullName,
            email: email,
            role: role || "driver",
            photo_url: user.user_metadata.picture
          });

        if (insertError) {
          console.error('❌ Failed to insert user_info:', insertError);
          await supabase.auth.signOut();
          Alert.alert('Error', 'Failed to create user profile.');
          return;
        }

        // If driver, also insert into driver table
        if (role === "driver") {
          const { error: driverError } = await supabase
            .from('driver')
            .insert({
              driver_id: user.id
            });

          if (driverError) {
            console.error('❌ Failed to insert driver:', driverError);
          }
        }

        console.log('✅ User and profile created!');
        Alert.alert('Success', 'Account created successfully!');
      }

    } catch (error: any) {
      console.error('🔥 Sign-in Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('⚠️ User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('⚠️ Sign-in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('⚠️ Play Services not available or outdated');
      }
    }
  };

  return (
<View
  className="flex-1 justify-center p-5"
  style={{ backgroundColor: "#fdf5c6ff" }}
>

      {/* BACKGROUND DESIGNS */}


          <Image
          source={require("../assets/images/Commute_test.png")}
          style={{
            position: "absolute",
            top: "-10%",
            left: "-40%",
            width: 450,
            height: 450,
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

          <Image
          source={require("../assets/images/Two-wheel.png")}
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "0%",
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

      <Image
          source={require("../assets/images/Tranportation.png")}
          style={{
            position: "absolute",
            top: "15%",
            right: "-70%",
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

          
      <Image
          source={require("../assets/images/Steering.png")}
          style={{
            position: "absolute",
            bottom: "-16%",
            right: "-27%",
            width: 325,
            height: 325,
           zIndex: 1,
            transform: [{ rotate: "-30deg" }],
            shadowColor: "#ffffffff",
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            tintColor: "#fffbf1ff",
          }}
          resizeMode="contain"
          />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "-5%",
          right: "51%",
          width: 250,
          height: 250,
          zIndex: 1,
        }}
      >
        <Image
          source={require("../assets/images/Jeepgo_logo2.png")}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      </View>

     {/* TOP RIGHT CIRCLE  */}
      <View className="
      absolute
       z - 0
       right-[-60px]
       top-[-180px]
       w-[300px]  
       h-[300px] 
       bg-[#E4D685] 
       rounded-full 
       opacity-100" 
       />

       {/* TOP LEFT CIRCLE  */}
      <View className="
      absolute
       z - 0
       left-[-90px]
       top-[-130px]
       w-[330px] 
       h-[330px] 
       bg-[#E4D685] 
       rounded-full 
       opacity-100" 
       />

       {/* BOTTOM RIGHT CIRCLE */}
      <View className="
      absolute
       z - 0
       right-[-120px]
       bottom-[-150px]
       w-[350px] 
       h-[350px] 
       bg-[#E4D685] 
       rounded-full 
       opacity-100" 
       />


      {/* Tabs */}
       <View className="flex-row mb-6 mt-10 ml-11 justify-start">
        <TouchableOpacity
          className={`px-6 py-2 rounded-full ${
            activeTab === "login" ? "bg-[#8593E4]" : "bg-[#C4B5D8]"
          }`}
          onPress={() => setActiveTab("login")}
        >
          <Text className="text-white font-bold">Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-5 py-2 rounded-full ml-3 ${
            activeTab === "register" ? "bg-[#8593E4]" : "bg-gray-300"
          }`}
          onPress={() => setActiveTab("register")}
        >
          <Text className="text-white font-bold">Register</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {activeTab === "login" ? (
        
        //Log in page
        <View className='items-center gap-2'>

          <Text className='text-3xl font-bold'>Welcome!</Text>
          <Text className='text-sm text-[#FFBCBC] font-bold leading-none'>Enter your details below</Text>
          
          <TextInput 
          placeholder=" Email..." 
          placeholderTextColor="#000000ff"
          value={loginEmail}
          onChangeText={setLoginEmail}
          className="input-field2"
          keyboardType="email-address"
          textContentType="username"
          autoComplete="email"
          autoCapitalize="none"
          />

          {/* password */}
          <TextInput 
          placeholder=' Password...' 
          placeholderTextColor="#000000ff"
          value={loginPassword}
          onChangeText={setLoginPassword}
          className="input-field2"
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          autoCapitalize="none"
          />

          <View className='w-[300]'>
            <Pressable onPress={() => setShowResetModal(true)}>
              <Text className="text-[#4C0078] ">Forgot Password?</Text>
            </Pressable>
          </View>

          <Pressable disabled={loading} onPress={handleLogin} className='w-[300] h-[50] bg-[#8593E4] border-[#8593E4] justify-center items-center border rounded-full'>
            <Text className='text-xl text-white font-bold '>{loading ? 'Logging in...' : 'Log In'}</Text>
          </Pressable>

          <Text>OR</Text>

          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={onGoogleSignInPress}
            style = {{zIndex:2}}
          />
        </View>
        ) : (


          //Register Page
          <View className="w-full items-center gap-2">
            <Text className='text-3xl font-bold'>Register</Text>
            <Text className='font-bold text-[#FFBCBC]'>Create your account!</Text>
            <TextInput
              placeholder="Enter Full Name"
              placeholderTextColor="#000000ff"
              className= "input-field2"
              value={registerFullName}
              onChangeText={setRegisterFullName}
            />
            <TextInput
              placeholder="Enter Email"
              placeholderTextColor="#000000ff"
              className= "input-field2"
              value={registerEmail}
              onChangeText={setRegisterEmail}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Enter Password"
              placeholderTextColor="#000000ff"
              className="input-field2"
              value={registerPassword}
              onChangeText={setRegisterPassword}
              secureTextEntry
              style={{ color: 'black' }}
              textContentType="password"
              autoComplete="password"
              autoCapitalize="none"
            />
            <Pressable disabled={loading} onPress={handleRegister} className='w-[300] h-[50] bg-[#8593E4] border-[#8593E4] justify-center items-center border rounded-full'>
            <Text className='text-xl text-white font-bold'>{loading ? 'Registering...' : 'Register'}</Text>
            </Pressable>

            <Text>OR</Text>

            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={onGoogleSignInPress}
              style = {{zIndex:2}}
            />
        </View>
      )}

      <Modal
        visible={showResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
        
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-[300] h-[200] bg-white rounded-lg p-4">
            <Text className="text-lg font-bold mb-4">Reset Password</Text>
            <TextInput
              placeholder="Enter your email..."
              placeholderTextColor="#3B3B3B"
              value={loginEmail}
              onChangeText={setLoginEmail}
              className="border rounded-md px-3 mb-4"
            />
            <Pressable
              onPress={handleForgotPassword}
              className="bg-primary p-3 rounded-md"
            >
              <Text className="text-white text-center font-bold">Send Reset Link</Text>
            </Pressable>
            <Pressable onPress={() => setShowResetModal(false)} className="mt-2">
              <Text className="text-center text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}