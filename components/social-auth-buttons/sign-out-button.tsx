import { supabase } from '@/services/supabase'
import React from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'

async function onSignOutButtonPress() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
  }
}

export default function SignOutButton() {
  return <TouchableOpacity 
  onPress={() => {
    Alert.alert(
      'Confirm Sign Out',
      `Are you sure you want to Sign Out?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => onSignOutButtonPress()}
      ]
    );
  }}
  className='w-[80%] h-[50] bg-red-500 justify-center items-center rounded-2xl'
  >
    <Text className='font-bold text-white'>Sign Out</Text>
  </TouchableOpacity>
}