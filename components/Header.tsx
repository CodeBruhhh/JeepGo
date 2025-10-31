import { icons } from '@/constants/icons'
import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

const Header = () => {
  return (
    <View className='
        w-full
        h-[60px] 
        bg-tertiary 
        flex-row 
        absolute 
        top-0
        z-10 
        items-center
        pr-4
        justify-between
        border
        elevation-5
        border-t-0
     '>
      <Image source={icons.jeepGo} className='w-[60] h-[60]' />

      <TouchableOpacity>
        <Image source={icons.notification} className='w-[30] h-[30]'/>
      </TouchableOpacity>
    </View>
  )
}

export default Header