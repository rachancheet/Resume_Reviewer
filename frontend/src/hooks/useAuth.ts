'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

interface AuthUser extends SupabaseUser {
  profile?: User | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        if (error.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: user.email!,
                role: 'user'
              })
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating user profile:', createError)
              return null
            }
            return newProfile
          }
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }, [])

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return

    initialized.current = true

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log("Supabase session created")
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          console.log("User profile set")
          setUser({ ...session.user, profile })
        } else {
          console.log("Supabase session JWT not found")
          setUser(null)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        try {
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id)
            setUser({ ...session.user, profile })
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
          setUser(null)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signInWithMagicLink = useCallback(async (email: string): Promise<{ error?: AuthError | null }> => {

    const getURL = () => {
      let url = process?.env?.NEXT_PUBLIC_SITE_URL ?? process?.env?.NEXT_PUBLIC_VERCEL_URL ??'http://localhost:3000/'

      url = url.startsWith('http') ? url : `https://${url}`
      url = url.endsWith('/') ? url : `${url}/`
      return url
    }
    
    // console.log("email redirect to ",getURL())
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
              emailRedirectTo: getURL(),
      }
    })
    return { error }
  }, [])

  const signOut = useCallback(async (): Promise<{ error?: AuthError | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [])

  const isAdmin = useCallback((): boolean => {
    return user?.profile?.role === 'admin' || user?.profile?.role === 'super_admin'
  }, [user?.profile?.role])

  const isSuperAdmin = useCallback((): boolean => {
    return user?.profile?.role === 'super_admin'
  }, [user?.profile?.role])

  return {
    user,
    loading,
    signInWithMagicLink,
    signOut,
    isAdmin,
    isSuperAdmin
  }
}

