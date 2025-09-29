'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'


interface AuthUser {
  id: string;
  email: string;
  profile?: User | null;
}

export function useAuth() {
  console.log("useAuth called")
  // const [user, setUser] = useState<AuthUser | null>(null)
  // const [loading, setLoading] = useState(true)
  // const initialized = useRef(false)

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log("trying to fetchuserprofile")
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      console.log("got user profile",data)

      if (error) {
        console.error('Error fetching user profile:', error)
       
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }, [])

  const getUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      console.log("trying to getsession()")
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      console.log("got supabase session")

      if (error) {
        console.error('Error getting session:', error)
        return null
      }

      const user = session?.user
      if (!user) return null

      const profile = await fetchUserProfile(user.id)
      // console.log("got user profile",profile)
      return { ...user, profile }
    } catch (err) {
      console.error('Unexpected error in getUserWithProfile:', err)
      return null
    }
  }, [fetchUserProfile])

  return { getUser }


}

