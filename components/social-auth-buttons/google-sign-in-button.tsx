import { supabase } from '@/services/supabase';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

export default function GoogleSignInButton() {
  GoogleSignin.configure({
    scopes: ['email', 'profile'],
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID, // For Android
  });

  const onPress = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // idToken is on userInfo object
      const idToken = (userInfo as any).idToken; // use 'any' to bypass TS typing issue

      if (!idToken) throw new Error('No ID token returned from Google Sign-In!');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) console.error('Supabase login error:', error);
      else console.log('Supabase login success:', data);

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play Services not available or outdated');
      } else {
        console.error('Google Sign-In error:', error);
      }
    }
  };

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={onPress}
    />
  );
}
