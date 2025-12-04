import SignOutButton from '@/components/social-auth-buttons/sign-out-button';
import { supabase } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Text, View } from "react-native";


export default function account() {
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setProfile(data.user);
    };
    loadProfile();
  }, []);

  if (!profile)
    return <Text className="text-center text-gray-500">Loading profile...</Text>;

  return (
    <View className="flex-1 items-center justify-center bg-secondary gap-4">
      <Text className="text-5xl text-primary font-bold">Welcome!</Text>
      <Text className="text-2xl text-primary font-bold text-center">Email: {profile?.email}</Text>
      <Text className="text-2xl text-primary font-bold text-center">Full Name: {profile?.user_metadata.full_name}</Text>
      <SignOutButton />
    </View>
  );
}
