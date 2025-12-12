import { AuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/services/supabase'
import type { Session } from '@supabase/supabase-js'
import { PropsWithChildren, useEffect, useState } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | undefined | null>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const role = profile?.role ?? null

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Error fetching session:', error)
      }

      setSession(session)
      
      // Only set loading to false if there's no session
      // If there IS a session, wait for profile to load
      if (!session) {
        setIsLoading(false)
      }
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { event: _event, session })
      setSession(session)
      
      // If user signs out, stop loading immediately
      if (!session) {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        setIsLoading(true) // Keep loading while fetching profile
        
        try {
          // Retry logic for new users whose profile might not be created yet
          let retries = 5
          let data = null
          let error = null

          while (retries > 0 && !data) {
            const result = await supabase
              .from('user_info')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle() // Use maybeSingle instead of single

            error = result.error
            data = result.data

            if (data) {
              break
            }

            // If no data yet and retries remain, wait and try again
            if (retries > 1) {
              console.log(`Profile not found yet, retrying... (${retries - 1} attempts left)`)
              await new Promise(resolve => setTimeout(resolve, 800))
            }

            retries--
          }

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error)
            setProfile(null)
          } else if (data) {
            setProfile(data)
          } else {
            console.error('Profile not found after retries')
            setProfile(null)
          }
        } catch (error) {
          console.error('Unexpected error fetching profile:', error)
          setProfile(null)
        }
        
        setIsLoading(false) // Only set loading false after profile fetch completes
      } else {
        setProfile(null)
        // isLoading already set to false in the session effect
      }
    }

    fetchProfile()
  }, [session])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        profile,
        role,      
        isLoggedIn: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}