import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { AdminUtils } from '@/lib/admin-utils'


export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    console.log("API route called with:", { email, userId })

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and user ID are required' },
        { status: 400 }
      )
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Use admin client to verify user role
    const adminClient = createAdminClient()
    
    // Check if the requesting user is super admin
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
