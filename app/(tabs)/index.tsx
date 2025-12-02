import SignOutButton from '@/components/social-auth-buttons/sign-out-button';
import { supabase } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from "react-native";

export default function Index() {
  const [profile, setProfile] = useState<User | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  // Load auth user
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setProfile(data.user);
    };
    loadProfile();
  }, []);

  // Load profile photo
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_info')
          .select('photo_url')
          .eq('user_id', profile.id)
          .single();

        if (error) throw error;
        if (data?.photo_url) setProfileUrl(data.photo_url);
      } catch (err) {
        console.error('Error fetching profile photo:', err);
      } finally {
        setLoadingPhoto(false);
      }
    };

    fetchProfilePhoto();
  }, [profile]);

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#550CBF" />
        <Text className="mt-2 text-gray-500">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-secondary gap-4 p-4">
      <Text className="text-5xl text-primary font-bold">Welcome!</Text>

      {loadingPhoto ? (
        <ActivityIndicator size="small" color="#550CBF" />
      ) : profileUrl ? (
        <Image
          source={{ uri: profileUrl }}
          className="w-40 h-40 rounded-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-40 h-40 rounded-full bg-gray-300 justify-center items-center">
          <Text className="text-gray-600">No Photo</Text>
        </View>
      )}

      <Text className="text-2xl text-primary font-bold text-center">
        {profile.user_metadata.full_name}
      </Text>

      <Text className="text-2xl text-primary font-bold text-center">
        Email: {profile.email}
      </Text>

      <SignOutButton />
    </View>
  );
}
