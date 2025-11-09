import MapScreen from '@/components/Map'
import React from 'react'
import { View } from 'react-native'

const ride = () => {
  return (
    <View className="flex-1  items-center bg-secondary">
          <MapScreen />
    </View>
  )
}

export default ride