import SignOutButton from '@/components/social-auth-buttons/sign-out-button';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface UserInfo {
  photo_url: string | null;
  full_name: string;
  email: string;
  role: string;
  phone_number: string | null;
  passenger_type: 'Regular' | 'Student' | 'Senior' | 'PWD';
}

export default function account() {
  
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields
  const [editedFullName, setEditedFullName] = useState('');
  const [editedPhoneNumber, setEditedPhoneNumber] = useState('');
  const [editedPhotoUrl, setEditedPhotoUrl] = useState<string | null>(null);
  const [editedPassengerType, setEditedPassengerType] = useState<'Regular' | 'Student' | 'Senior' | 'PWD'>('Regular');
  const [showPassengerTypeDropdown, setShowPassengerTypeDropdown] = useState(false);
  
  // Password change fields
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setLoading(false);
        return;
      }

      // Fetch user info
      const { data: userInfoData } = await supabase
        .from("user_info")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      if (userInfoData) {
        setUserInfo(userInfoData);
        setEditedFullName(userInfoData.full_name);
        setEditedPhoneNumber(userInfoData.phone_number || '');
        setEditedPhotoUrl(userInfoData.photo_url);
      }

      // Fetch passenger type from passengers table
      const { data: passengerData } = await supabase
        .from("passengers")
        .select("passenger_type")
        .eq("passenger_id", auth.user.id)
        .single();

      if (passengerData?.passenger_type) {
        setEditedPassengerType(passengerData.passenger_type);
      }

      // Fetch total trips count for passenger
      const { count } = await supabase
        .from("trips")
        .select("*", { count: 'exact', head: true })
        .eq("passenger_id", auth.user.id);

      if (count !== null) setTotalTrips(count);

      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    // Close dropdown when editing is disabled
    if (!isEditing) {
      setShowPassengerTypeDropdown(false);
    }
  }, [isEditing]);

  const pickImage = async () => {
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

      // Update passenger type in passengers table
      const { error: passengerError } = await supabase
        .from("passengers")
        .update({
          passenger_type: editedPassengerType,
        })
        .eq("passenger_id", auth.user.id);

      if (passengerError) throw passengerError;

      // Update local state
      if (userInfo) {
        setUserInfo({
          ...userInfo,
          full_name: editedFullName,
          phone_number: editedPhoneNumber || null,
          photo_url: editedPhotoUrl,
          passenger_type: editedPassengerType,
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
    setEditedPhotoUrl(userInfo?.photo_url || null);
    setEditedPassengerType(userInfo?.passenger_type || 'Regular');
    setShowPassengerTypeDropdown(false); // Close dropdown
    setIsEditing(false);
    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ScrollView 
      className="flex-1 gap-4 bg-secondary"
      contentContainerStyle={{
        alignItems: 'center',
        paddingBottom: 100
      }}
    >
      {/* Back button */}
      <TouchableOpacity
        className="absolute top-12 left-4 bg-white p-3 rounded-full z-50"
        style={styles.shadow}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      {/* Profile Picture */}
      <TouchableOpacity onPress={isEditing ? pickImage : undefined} activeOpacity={isEditing ? 0.7 : 1}>
        {loading ? (
          <View className='mt-[50] w-40 h-40 rounded-full bg-gray-300 justify-center items-center'>
            <ActivityIndicator size="large" color="#550CBF" />
          </View>
        ) : editedPhotoUrl ? (
          <View className='mt-[50]'>
            <Image
              source={{ uri: editedPhotoUrl }}
              className="w-40 h-40 rounded-full border-2 border-[#996FD6]"
              resizeMode="cover"
            />
            {isEditing && (
              <View className="absolute bottom-0 right-0 bg-[#550CBF] w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-white text-lg">✎</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="mt-[50] w-40 h-40 rounded-full bg-gray-300 justify-center items-center">
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

      {/* Stats Card */}
      <View className='flex-row gap-[10] mt-[25] mb-[25]'>
        <View className='w-[120] h-[80] bg-[#BBA3E1] rounded-2xl items-center justify-center p-2'>
          <Text className='text-xs text-white font-bold mb-1'>Total Trips</Text>
          <View className='w-[70] h-[30] rounded-lg bg-white justify-center items-center'>
            {loading ? (
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

        {/* Passenger Type Field */}
        <Text className='font-bold mb-[10]'>Passenger Type: </Text>
        {isEditing ? (
          <View className='w-[100%] mb-[20]'>
            <TouchableOpacity
              onPress={() => setShowPassengerTypeDropdown(!showPassengerTypeDropdown)}
              className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 flex-row items-center'
              style={{ borderWidth: 1, borderColor: '#E5E5E5' }}
            >
              <Text className="flex-1">{editedPassengerType}</Text>
              <Ionicons 
                name={showPassengerTypeDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
                style={{ marginRight: 15 }}
              />
            </TouchableOpacity>
            
            {/* Dropdown Options */}
            {showPassengerTypeDropdown && (
              <View className='w-[100%] bg-white rounded-2xl mt-2 overflow-hidden' style={styles.dropdownShadow}>
                <TouchableOpacity
                  onPress={() => {
                    setEditedPassengerType('Regular');
                    setShowPassengerTypeDropdown(false);
                  }}
                  className='w-[100%] h-[50] justify-center pl-5 border-b border-gray-200'
                  style={{ backgroundColor: editedPassengerType === 'Regular' ? '#F3E8FF' : 'white' }}
                >
                  <Text className={editedPassengerType === 'Regular' ? 'font-semibold text-[#550CBF]' : ''}>
                    Regular
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEditedPassengerType('Student');
                    setShowPassengerTypeDropdown(false);
                  }}
                  className='w-[100%] h-[50] justify-center pl-5 border-b border-gray-200'
                  style={{ backgroundColor: editedPassengerType === 'Student' ? '#F3E8FF' : 'white' }}
                >
                  <Text className={editedPassengerType === 'Student' ? 'font-semibold text-[#550CBF]' : ''}>
                    Student
                  </Text>
                  <Text className="text-xs text-green-600 pl-5">20% discount on fares</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEditedPassengerType('Senior');
                    setShowPassengerTypeDropdown(false);
                  }}
                  className='w-[100%] h-[50] justify-center pl-5 border-b border-gray-200'
                  style={{ backgroundColor: editedPassengerType === 'Senior' ? '#F3E8FF' : 'white' }}
                >
                  <Text className={editedPassengerType === 'Senior' ? 'font-semibold text-[#550CBF]' : ''}>
                    Senior Citizen
                  </Text>
                  <Text className="text-xs text-green-600 pl-5">20% discount on fares</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEditedPassengerType('PWD');
                    setShowPassengerTypeDropdown(false);
                  }}
                  className='w-[100%] h-[50] justify-center pl-5'
                  style={{ backgroundColor: editedPassengerType === 'PWD' ? '#F3E8FF' : 'white' }}
                >
                  <Text className={editedPassengerType === 'PWD' ? 'font-semibold text-[#550CBF]' : ''}>
                    PWD
                  </Text>
                  <Text className="text-xs text-green-600 pl-5">20% discount on fares</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View className='w-[100%] h-[50] bg-white rounded-2xl justify-center pl-5 mb-[20]'>
            <Text>{editedPassengerType}</Text>
            {(editedPassengerType === 'Student' || editedPassengerType === 'Senior' || editedPassengerType === 'PWD') && (
              <Text className="text-xs text-green-600"> (20% discount on fares)</Text>
            )}
          </View>
        )}

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

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  }
});