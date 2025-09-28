import { supabase } from './supabase'
import type { Resume, User } from './supabase'

export class ResumeService {
  // Upload resume file to storage with progress callback
  static async uploadResumeFile(
    file: File, 
    userId: string, 
    onProgress?: (progress: number) => void
  ): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      // Create upload with progress tracking
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { error: error.message }
      }

      // Simulate progress completion for now (Supabase doesn't provide real-time progress)
      if (onProgress) {
        onProgress(100)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      return { url: publicUrl }
    } catch (error) {
      return { error: 'Failed to upload file' }
    }
  }

  // Create resume record in database
  static async createResume(userId: string, username:string,fileUrl: string, originalFileName: string): Promise<{ resume?: Resume; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          user_name:username,
          file_url: fileUrl,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return { resume: data }
    } catch (error) {
      return { error: 'Failed to create resume record' }
    }
  }

  // Get user's resumes
  static async getUserResumes(userId: string): Promise<{ resumes?: Resume[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { error: error.message }
      }

      return { resumes: data || [] }
    } catch (error) {
      return { error: 'Failed to fetch resumes' }
    }
  }

  // Get all resumes (admin)
  static async getAllResumes(): Promise<{ resumes?: Resume[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { error: error.message }
      }

      return { resumes: data || [] }
    } catch (error) {
      return { error: 'Failed to fetch all resumes' }
    }
  }

  // Update resume status (admin)
  static async updateResumeStatus(
    resumeId: string, 
    status: Resume['status'], 
    score?: number, 
    notes?: string
  ): Promise<{ resume?: Resume; error?: string }> {
    try {
      const updateData: { status: Resume['status']; updated_at: string; score?: number; notes?: string } = {
        status,
        updated_at: new Date().toISOString()
      }

      if (score !== undefined) {
        updateData.score = score
      }

      if (notes !== undefined) {
        updateData.notes = notes
      }

      const { data, error } = await supabase
        .from('resumes')
        .update(updateData)
        .eq('id', resumeId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return { resume: data }
    } catch (error) {
      return { error: 'Failed to update resume status' }
    }
  }

  // Delete resume
  static async deleteResume(resumeId: string, fileUrl: string): Promise<{ error?: string }> {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl)
      const filePath = url.pathname.split('/storage/v1/object/public/resumes/')[1]

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([filePath])

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError.message)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)

      if (dbError) {
        return { error: dbError.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to delete resume' }
    }
  }

  // Get resume download URL
  static async getResumeDownloadUrl(fileUrl: string): Promise<{ url?: string; error?: string }> {
    try {
      // Try to create a blob URL for proper download behavior
      try {
        const response = await fetch(fileUrl)
        if (response.ok) {
          const blob = await response.blob()
          const downloadUrl = URL.createObjectURL(blob)
          return { url: downloadUrl }
        }
      } catch (fetchError) {
        console.warn('Failed to fetch file for blob creation:', fetchError)
      }
      
      // Fallback: return the original URL
      return { url: fileUrl }
    } catch (error) {
      return { error: 'Failed to generate download URL' }
    }
  }

  // Get resume statistics (admin)
  static async getResumeStats(): Promise<{
    stats?: {
      total: number
      pending: number
      approved: number
      needs_revision: number
      rejected: number
      avg_score: number
    }
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('status, score')

      if (error) {
        return { error: error.message }
      }

      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        approved: data.filter(r => r.status === 'approved').length,
        needs_revision: data.filter(r => r.status === 'needs_revision').length,
        rejected: data.filter(r => r.status === 'rejected').length,
        avg_score: 0
      }

      const scoresData = data.filter(r => r.score !== null && r.score !== undefined)
      if (scoresData.length > 0) {
        const totalScore = scoresData.reduce((sum, r) => sum + (r.score || 0), 0)
        stats.avg_score = Math.round(totalScore / scoresData.length)
      }

      return { stats }
    } catch (error) {
      return { error: 'Failed to fetch resume statistics' }
    }
  }

  // Get leaderboard data (approved resumes with scores)
  static async getLeaderboard(): Promise<{
    leaderboard?: Array<{
      rank: number
      name: string
      email: string
      score: number
      status: Resume['status']
    }>
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select(`
          score,
          status,
          user:users(email)
        `)
        .not('score', 'is', null)
        .order('score', { ascending: false })

      if (error) {
        return { error: error.message }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leaderboard = data?.map((resume: any, index: number) => ({
        rank: index + 1,
        name: resume.user?.email?.split('@')[0] || 'Anonymous',
        email: resume.user?.email || '',
        score: resume.score || 0,
        status: resume.status
      })) || []

      return { leaderboard }
    } catch (error) {
      return { error: 'Failed to fetch leaderboard data' }
    }
  }
}

