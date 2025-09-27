import { createAdminClient } from './supabase-server'

/**
 * Utility functions for admin operations
 * These functions use the service role and should only be called from server-side code
 */

export class AdminUtils {
  /**
   * Create admin user invitation (super admin only)
   * Sends magic link invitation to new admin
   */
  static async createAdminInvitation(
    email: string, 
    createdBy: string
  ): Promise<{ success: boolean; error?: string; inviteUrl?: string }> {
    try {
      const adminClient = createAdminClient()
      
      // Verify the creator is super admin
      const { data: creatorData, error: creatorError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', createdBy)
        .single()

      if (creatorError || !creatorData || creatorData.role !== 'super_admin') {
        return { success: false, error: 'Only super admins can create admin accounts' }
      }

      // Check if email already exists
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }

      // Create admin invitation using Supabase Admin API
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          role: 'admin',
          created_by: createdBy
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?type=admin_invite`
      })

      if (!error && data?.user) {
        // Create user profile with admin role immediately
        const { error: profileError } = await adminClient
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            role: 'admin',
            created_by: createdBy
          })

        if (profileError) {
          console.warn('Failed to create admin profile:', profileError)
        }
      }

      if (error) {
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        inviteUrl: 'Invitation sent to email'
      }
    } catch (error) {
      return { success: false, error: 'Failed to create admin invitation' }
    }
  }

  /**
   * Get all users with their roles (admin only)
   */
  static async getAllUsers(): Promise<{ users?: Array<{id: string, email: string, role: string, created_at: string}>; error?: string }> {
    try {
      const adminClient = createAdminClient()
      
      const { data, error } = await adminClient
        .from('users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        return { error: error.message }
      }

      return { users: data || [] }
    } catch (error) {
      return { error: 'Failed to fetch users' }
    }
  }

  /**
   * Check user role by email
   */
  static async getUserRole(email: string): Promise<{ role?: string; error?: string }> {
    try {
      const adminClient = createAdminClient()
      
      const { data, error } = await adminClient
        .from('users')
        .select('role')
        .eq('email', email)
        .single()

      if (error) {
        return { error: error.message }
      }

      return { role: data?.role }
    } catch (error) {
      return { error: 'Failed to check user role' }
    }
  }

  /**
   * Check if a user is admin by email (includes super_admin)
   */
  static async isUserAdmin(email: string): Promise<{ isAdmin: boolean; error?: string }> {
    try {
      const { role, error } = await this.getUserRole(email)
      
      if (error) {
        return { isAdmin: false, error }
      }

      return { isAdmin: role === 'admin' || role === 'super_admin' }
    } catch (error) {
      return { isAdmin: false, error: 'Failed to check admin status' }
    }
  }

  /**
   * Check if a user is super admin by email
   */
  static async isUserSuperAdmin(email: string): Promise<{ isSuperAdmin: boolean; error?: string }> {
    try {
      const { role, error } = await this.getUserRole(email)
      
      if (error) {
        return { isSuperAdmin: false, error }
      }

      return { isSuperAdmin: role === 'super_admin' }
    } catch (error) {
      return { isSuperAdmin: false, error: 'Failed to check super admin status' }
    }
  }
}
