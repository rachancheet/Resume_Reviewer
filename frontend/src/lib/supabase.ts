import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  role: 'user' | 'admin' | 'super_admin'
  created_by?: string
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  user_name: string
  file_name: string
  file_url: string
  preview_url?: string
  status: 'pending' | 'approved' | 'needs_revision' | 'rejected'
  score?: number
  notes?: string
  created_at: string
  updated_at: string
  // Joined user data
  user?: User
}

// Helper function to get file extension
export const getFileExtension = (filename: string) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// Helper function to validate PDF file
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }

  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Only PDF files are allowed' }
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  return { isValid: true }
}

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

