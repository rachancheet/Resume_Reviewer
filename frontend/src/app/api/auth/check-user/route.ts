import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Use admin client to check if user exists
    const adminClient = createAdminClient()
    
    const { data: existingUser, error: checkError } = await adminClient
      .from('users')
      .select('email, id')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Database error checking user:', checkError)
      return NextResponse.json(
        { error: 'Unable to verify email. Please try again.' },
        { status: 500 }
      )
    }

    const userExists = !checkError && existingUser

    return NextResponse.json({
      exists: userExists,
      message: userExists 
        ? 'User exists' 
        : 'User not found'
    })

  } catch (error) {
    console.error('Error checking user existence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}