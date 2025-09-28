import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { AdminUtils } from '@/lib/admin-utils'

/**
 * API endpoint to invite a new admin user
 * Only super admins can create admin invitations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create admin invitations' },
        { status: 403 }
      )
    }

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

    // Create admin invitation
    const { success, error, inviteUrl } = await AdminUtils.createAdminInvitation(email, user.id)

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
