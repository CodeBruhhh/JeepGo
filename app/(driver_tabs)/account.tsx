import SignOutButton from '@/components/social-auth-buttons/sign-out-button';
import { supabase } from '@/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface UserInfo {
  photo_url: string | null;
  full_name: string;
  email: string;
  role: string;
  phone_number: string | null;
}

interface DriverInfo {
  rating: number | null;
  license_no: string;
  status: string;
  jeep_code: string;
  is_online: boolean;
  qr_photo_url: string | null;
}

export default function account() {
  
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [loadingDriver, setLoadingDriver] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields
  const [editedFullName, setEditedFullName] = useState('');
  const [editedPhoneNumber, setEditedPhoneNumber] = useState('');
  const [editedLicenseNo, setEditedLicenseNo] = useState('');
  const [editedJeepCode, setEditedJeepCode] = useState('');
  const [editedPhotoUrl, setEditedPhotoUrl] = useState<string | null>(null);
  const [editedQRUrl, setEditedQRUrl] = useState<string | null>(null);
  
  // Password change fields
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoadingPhoto(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setLoadingPhoto(false);
        setLoadingDriver(false);
        return;
      }

      // Fetch user info
      const { data } = await supabase
        .from("user_info")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      if (data) {
        setUserInfo(data);
        setEditedFullName(data.full_name);
        setEditedPhoneNumber(data.phone_number || '');
        setEditedPhotoUrl(data.photo_url);
      }

      setLoadingPhoto(false);

      // Fetch driver info
      const { data: driverData } = await supabase
        .from("drivers")
        .select("rating, license_no, status, jeep_code, is_online, qr_photo_url")
        .eq("driver_id", auth.user.id)
        .single();

      if (driverData) {
        setDriverInfo(driverData);
        setEditedLicenseNo(driverData.license_no);
        setEditedJeepCode(driverData.jeep_code);
        setEditedQRUrl(driverData.qr_photo_url);
      }

      // Fetch total trips count
      const { count } = await supabase
        .from("trips")
        .select("*", { count: 'exact', head: true })
        .eq("driver_id", auth.user.id);

      if (count !== null) setTotalTrips(count);

      setLoadingDriver(false);
    };

    fetchUserInfo();
  }, []);

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditedPhotoUrl(result.assets[0].uri);
    }
  };

  const pickQRImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled) {
      setEditedQRUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Update user info
      const { error: userError } = await supabase
        .from("user_info")
        .update({
          full_name: editedFullName,
          phone_number: editedPhoneNumber,
          photo_url: editedPhotoUrl,
        })
        .eq("user_id", auth.user.id);

      if (userError) throw userError;

      // Update driver info
      const { error: driverError } = await supabase
        .from("drivers")
        .update({
          license_no: editedLicenseNo,
          jeep_code: editedJeepCode,
          qr_photo_url: editedQRUrl,
        })
        .eq("driver_id", auth.user.id);

      if (driverError) throw driverError;

      // Update local state
      if (userInfo) {
        setUserInfo({
          ...userInfo,
          full_name: editedFullName,
          phone_number: editedPhoneNumber || null,
          photo_url: editedPhotoUrl,
        });
      }

      if (driverInfo) {
        setDriverInfo({
          ...driverInfo,
          license_no: editedLicenseNo,
          jeep_code: editedJeepCode,
          qr_photo_url: editedQRUrl,
        });
      }

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.email) {
        Alert.alert('Error', 'User email not found');
        return;
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: auth.user.email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedFullName(userInfo?.full_name || '');
    setEditedPhoneNumber(userInfo?.phone_number || '');
    setEditedLicenseNo(driverInfo?.license_no || '');
    setEditedJeepCode(driverInfo?.jeep_code || '');
    setEditedPhotoUrl(userInfo?.photo_url || null);
    setEditedQRUrl(driverInfo?.qr_photo_url || null);
    setIsEditing(false);
    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ScrollView 
    className="flex-1 gap-4 bg-[#F5F1E8] mb-[50]"
    contentContainerStyle = {{
      alignItems: 'center',
      paddingBottom: 100
    }}
    >
      {/* Profile Picture */}
      <TouchableOpacity onPress={isEditing ? pickProfileImage : undefined} activeOpacity={isEditing ? 0.7 : 1}>
        {loadingPhoto ? (
          <ActivityIndicator size="small" color="#550CBF" />
        ) : editedPhotoUrl ? (
          <View className='mt-[50]'>
            <Image
              source={{ uri: editedPhotoUrl }}
              className="w-40 h-40 rounded-full"
              resizeMode="cover"
            />
            {isEditing && (
              <View className="absolute bottom-0 right-0 bg-[#550CBF] w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-white text-lg">✎</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="w-40 h-40 rounded-full bg-gray-300 justify-center items-center">
            <Text className="text-gray-600">{isEditing ? 'Tap to add' : 'No Photo'}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Full Name */}
      {isEditing ? (
        <TextInput
          value={editedFullName}
          onChangeText={setEditedFullName}
          className="text-3xl font-bold text-center bg-white px-4 py-2 rounded-lg w-[80%] mt-[10]"
          placeholder="Full Name"
        />
      ) : (
        <Text className="text-4xl font-bold text-center mt-[10]">{userInfo?.full_name}</Text>
      )}

      {/* Stats Cards */}
      <View className='flex-row gap-[10] mt-[25] mb-[25]'>
        <View className='w-[80] h-[80] bg-[#BBA3E1] rounded-2xl items-center justify-center p-2'>
          <Text className='text-xs text-white font-bold mb-1'>Jeep Code</Text>
          <View className='w-[50] h-[30] rounded-lg bg-white justify-center items-center'>
            {loadingDriver ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className='text-sm font-semibold'>{driverInfo?.jeep_code || 'N/A'}</Text>
            )}
          </View>
        </View>

        <View className='w-[80] h-[80] bg-[#BBA3E1] rounded-2xl items-center justify-center p-2'>
          <Text className='text-xs text-white font-bold mb-1'>Rating</Text>
          <View className='w-[50] h-[30] rounded-lg bg-white justify-center items-center'>
            {loadingDriver ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className='text-sm font-semibold'>
                {driverInfo?.rating ? driverInfo.rating.toFixed(1) : 'N/A'}
              </Text>
            )}
          </View>
        </View>

        <View className='w-[80] h-[80] bg-[#BBA3E1] rounded-2xl items-center justify-center p-2'>
          <Text className='text-xs text-white font-bold mb-1'>Total Rides</Text>
          <View className='w-[50] h-[30] rounded-lg bg-white justify-center items-center'>
            {loadingDriver ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className='text-sm font-semibold'>{totalTrips}</Text>
            )}
          </View>
        </View>
      </View>
      
      {/* Editable Fields */}
      <View className='w-[80%]'>
        <Text className='font-bold mb-[10]'>Email: </Text>
        <View className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 mb-[20]'>
          <Text className="text-gray-500">{userInfo?.email}</Text>
        </View>

        <Text className='font-bold mb-[10]'>Phone: </Text>
        {isEditing ? (
          <TextInput
            value={editedPhoneNumber}
            onChangeText={setEditedPhoneNumber}
            className='w-[100%] h-[50] bg-white rounded-2xl pl-5 mb-[20]'
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        ) : (
          <View className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 mb-[20]'>
            <Text>{userInfo?.phone_number || 'Not provided'}</Text>
          </View>
        )}

        <Text className='font-bold mb-[10]'>License No: </Text>
        {isEditing ? (
          <TextInput
            value={editedLicenseNo}
            onChangeText={setEditedLicenseNo}
            className='w-[100%] h-[50] bg-white rounded-2xl pl-5 mb-[20]'
            placeholder="License number"
          />
        ) : (
          <View className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 mb-[20]'>
            {loadingDriver ? (
              <ActivityIndicator size="small" color="#550CBF" />
            ) : (
              <Text>{driverInfo?.license_no || 'Not available'}</Text>
            )}
          </View>
        )}

        <Text className='font-bold mb-[10]'>Jeep Code: </Text>
        {isEditing ? (
          <TextInput
            value={editedJeepCode}
            onChangeText={setEditedJeepCode}
            className='w-[100%] h-[50] bg-white rounded-2xl pl-5 mb-[20]'
            placeholder="Jeep code"
          />
        ) : (
          <View className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 mb-[20]'>
            {loadingDriver ? (
              <ActivityIndicator size="small" color="#550CBF" />
            ) : (
              <Text>{driverInfo?.jeep_code || 'Not available'}</Text>
            )}
          </View>
        )}

        <Text className='font-bold mb-[10]'>Gcash QR Code: </Text>
        {/* Gcash QR Code */}
        <View className="items-center justify-center bg-white rounded-lg border-2 border-[#550CBF]">
          <TouchableOpacity onPress={isEditing ? pickQRImage : undefined} activeOpacity={isEditing ? 0.7 : 1}>
            {loadingPhoto ? (
              <ActivityIndicator size="small" color="#550CBF" />
            ) : editedQRUrl ? (
              <View>
                <Image
                  source={{ uri: editedQRUrl }}
                  className="w-40 h-80 "
                  resizeMode="center"
                />
                {isEditing && (
                  <View className="absolute bottom-0 right-0 bg-[#550CBF] w-10 h-10 items-center justify-center">
                    <Text className="text-white text-lg">✎</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="w-40 h-40 bg-gray-300 justify-center items-center">
                <Text className="text-gray-600">{isEditing ? 'Tap to add' : 'No Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text className='font-bold mb-[10]'>Password: </Text>
        <TouchableOpacity 
          onPress={() => setShowPasswordChange(!showPasswordChange)}
          className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 mb-[20]'
        >
          <Text className="text-[#550CBF]">
            {showPasswordChange ? 'Cancel password change' : 'Click to change password'}
          </Text>
        </TouchableOpacity>

        {/* Password Change Section */}
        {showPasswordChange && (
          <View className="mb-[20]">
            <Text className='font-bold mb-[10]'>Current Password: </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              className='w-[100%] h-[50] bg-white rounded-2xl pl-5 mb-[15]'
              placeholder="Enter current password"
            />

            <Text className='font-bold mb-[10]'>New Password: </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              className='w-[100%] h-[50] bg-white rounded-2xl pl-5 mb-[15]'
              placeholder="Enter new password"
            />

            <Text className='font-bold mb-[10]'>Confirm New Password: </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              className='w-[100%] h-[50] bg-white rounded-2xl pl-5 mb-[15]'
              placeholder="Confirm new password"
            />

            <TouchableOpacity
              onPress={handlePasswordChange}
              disabled={isSaving}
              className='w-[100%] h-[50] bg-[#550CBF] rounded-2xl justify-center items-center mb-[10]'
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="text-white font-bold">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="w-[80%] gap-2 mb-[20]">
        {isEditing ? (
          <>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className='w-[100%] h-[50] bg-[#550CBF] rounded-2xl justify-center items-center'
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="text-white font-bold">Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              className='w-[100%] h-[50] bg-gray-400 rounded-2xl justify-center items-center'
            >
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            className='w-[100%] h-[50] bg-[#550CBF] rounded-2xl justify-center items-center'
          >
            <Text className="text-white font-bold">Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <SignOutButton />
    </ScrollView>
  );
}