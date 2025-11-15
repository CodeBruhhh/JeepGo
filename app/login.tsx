import { supabase } from '@/services/supabase';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LogInScreen() {

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      Alert.alert('Success', `Welcome ${data.user.app_metadata.full_name}`);
      
    }
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

    if (error) Alert.alert('Sign-up Error', error.message);
    else Alert.alert('Success', 'Check your email to confirm your account.');

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

      // Attempt to extract the ID token
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
      } else {
        console.log('✅ Supabase login success:', data);
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
    <View className="flex-1 justify-center bg-secondary p-5">
      {/* Tabs */}
      <View className="flex-row mb-6 justify-center">
        <TouchableOpacity
          className={`px-5 py-2 rounded-full ${
            activeTab === "login" ? "bg-primary" : "bg-gray-300"
          }`}
          onPress={() => setActiveTab("login")}
        >
          <Text className="text-white font-bold">Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-5 py-2 rounded-full ml-3 ${
            activeTab === "register" ? "bg-primary" : "bg-gray-300"
          }`}
          onPress={() => setActiveTab("register")}
        >
          <Text className="text-white font-bold">Register</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {activeTab === "login" ? (
        
        //Log in page
        <View className='items-center gap-4'>
          
          <Text className='text-4xl font-bold mb-4'>Log In</Text>
          {/* email */}
          <TextInput 
          placeholder=' Email...' 
          placeholderTextColor="#3B3B3B"
          value={loginEmail}
          onChangeText={setLoginEmail}
          className='w-[300] h-[50] bg-highlight border' 
          keyboardType="email-address"
          textContentType="username"
          autoComplete="email"
          autoCapitalize="none"
          />
          {/* password */}
          <TextInput 
          placeholder=' Password...' 
          placeholderTextColor="#3B3B3B"
          className='w-[300] h-[50] bg-highlight border' 
          value={loginPassword}
          onChangeText={setLoginPassword}
          secureTextEntry
          style={{ color: 'black' }}
          textContentType="password"
          autoComplete="password"
          autoCapitalize="none"
          />

          <View className='w-[300]'>
            <Pressable onPress={() => setShowResetModal(true)}>
              <Text className="text-blue-500 ">Forgot Password?</Text>
            </Pressable>
          </View>

          <Pressable disabled={loading} onPress={handleLogin} className='w-[300] h-[50] bg-tertiary justify-center items-center border rounded-xl'>
            <Text className='text-xl font-bold'>{loading ? 'Logging in...' : 'Log In'}</Text>
          </Pressable>

          <Text>OR</Text>

          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={onGoogleSignInPress}
          />
        </View>
        ) : (

          //Register Page
          <View className="w-full items-center gap-4">
            <Text className='text-4xl font-bold mb-4'>Register</Text>
            <TextInput
              placeholder="Enter Full Name"
              placeholderTextColor="#3B3B3B"
              className='w-[300] h-[50] bg-highlight border'
              value={registerFullName}
              onChangeText={setRegisterFullName}
            />
            <TextInput
              placeholder="Enter Email"
              placeholderTextColor="#3B3B3B"
              className='w-[300] h-[50] bg-highlight border'
              value={registerEmail}
              onChangeText={setRegisterEmail}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Enter Password"
              placeholderTextColor="#3B3B3B"
              className='w-[300] h-[50] bg-highlight border'
              value={registerPassword}
              onChangeText={setRegisterPassword}
              secureTextEntry
              style={{ color: 'black' }}
              textContentType="password"
              autoComplete="password"
              autoCapitalize="none"
            />
            <Pressable disabled={loading} onPress={handleRegister} className='w-[300] h-[50] bg-tertiary justify-center items-center border rounded-xl'>
            <Text className='text-xl font-bold'>{loading ? 'Registering...' : 'Register'}</Text>
            </Pressable>

            <Text>OR</Text>

            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={onGoogleSignInPress}
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