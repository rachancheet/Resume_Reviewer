'use client'

import { useState, useEffect } from 'react'
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

interface AuthUser extends SupabaseUser {
  profile?: User | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If user profile doesn't exist, create it
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
  }

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser({ ...session.user, profile })
        console.log('user', { ...session.user, profile })
        console.log('user', user)  
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          setUser({ ...session.user, profile })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string): Promise<{ error?: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    })
    return { error }
  }

  const signOut = async (): Promise<{ error?: AuthError | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const isAdmin = (): boolean => {
    return user?.profile?.role === 'admin' || user?.profile?.role === 'super_admin'
  }

  const isSuperAdmin = (): boolean => {
    console.log('isSuperAdmin', user)
    return user?.profile?.role === 'super_admin'
  }

  return {
    user,
    loading,
    signInWithMagicLink,
    signOut,
    isAdmin,
    isSuperAdmin
  }
}

