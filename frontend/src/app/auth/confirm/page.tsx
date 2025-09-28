'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ConfirmPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Check for hash parameters (magic link tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (accessToken && refreshToken && type === 'magiclink') {
          // Set the session using the tokens from the hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            setError(error.message)
            setIsLoading(false)
            return
          }

          // Clear the hash to clean up the URL
          window.history.replaceState(null, '', window.location.pathname)
          
          // Get user profile to determine role-based redirect
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single()
            
            // Role-based redirect
            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
              router.push('/admin')
            } else {
              router.push('/')
            }
          } else {
            router.push('/')
          }
          return
        }

        // Check for query parameters (PKCE flow)
        const code = searchParams.get('code')
        if (code) {
          // This should be handled by the callback route, but let's handle it here too
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            setError(error.message)
            setIsLoading(false)
            return
          }
          
          // Get user profile to determine role-based redirect
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single()
            
            // Role-based redirect
            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
              router.push('/admin')
            } else {
              router.push('/')
            }
          } else {
            router.push('/')
          }
          return
        }

        // If no auth data found, check current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(error.message)
          setIsLoading(false)
          return
        }

        if (session) {
          // Already authenticated, determine role-based redirect
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (profile?.role === 'admin' || profile?.role === 'super_admin') {
            router.push('/admin')
          } else {
            router.push('/')
          }
        } else {
          setError('No authentication data found')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        setError('An unexpected error occurred')
        setIsLoading(false)
      }
    }

    handleConfirmation()
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Confirming your email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your authentication.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Confirmation Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  )
}
