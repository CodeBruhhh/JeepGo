import { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthData = {
  session?: Session | null
  profile?: any | null
  isLoading: boolean
  role: string | null; 
  isLoggedIn: boolean
  
}

export const AuthContext = createContext<AuthData>({
  session: undefined,
  profile: undefined,
  isLoading: true,
  role: null,   
  isLoggedIn: false,
})

export const useAuthContext = () => useContext(AuthContext)