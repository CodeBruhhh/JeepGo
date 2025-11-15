import { supabase } from '@/services/supabase'
import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

async function onSignOutButtonPress() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
  }
}

export default function SignOutButton() {
  return <TouchableOpacity 
  onPress={onSignOutButtonPress}
  className='w-[100] h-[40] bg-red-500 justify-center items-center rounded-2xl'
  >
    <Text className='text-xl font-bold text-white'>Sign Out</Text>
  </TouchableOpacity>
}