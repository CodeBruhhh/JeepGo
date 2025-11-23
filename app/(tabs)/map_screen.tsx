import MapComponent from '@/components/Map'
import React from 'react'
import { Text, View } from 'react-native'

const map_screen = () => {
  return (
    <View className='flex-1 items-center bg-white'>
      <Text className='text-xl font-bold'>Map Screen</Text>
      <MapComponent style={{ height: 400, width: '100%' }} />
    </View>
  )
}

export default map_screen