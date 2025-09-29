import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { AdminUtils } from '@/lib/admin-utils'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("API route called with email:", email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // console.log("server trying to get session")
    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // console.log("got session",session)

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log("Authenticated user:", userId)
    
    const adminClient = createAdminClient()
    const { data: userData, error: roleError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (roleError) {
      console.log("Role check error:", roleError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (!userData || userData.role !== 'super_admin') {
      console.log("User is not super admin:", userData)
      return NextResponse.json(
        { error: 'Only super admins can create admin invitations' },
        { status: 403 }
      )
    }

    console.log("Super admin verified:", userId)

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const { success, error, inviteUrl } = await AdminUtils.createAdminInvitation(email, userId)

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to create admin invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Admin invitation sent to ${email}`,
      success: true,
      inviteUrl
    })

  } catch (error) {
    console.error('Error creating admin invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
