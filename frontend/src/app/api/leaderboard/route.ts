import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    // Get all resumes with scores
    const { data, error } = await adminClient
      .from('resumes')
      .select('score, status, user_name')
      .not('score', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by user and get their best resume (highest score)
    const userBestResumes = new Map()
    
    data?.forEach(resume => {
      const userEmail = resume.user_name || ''
      const currentBest = userBestResumes.get(userEmail)
      
      if (!currentBest || (resume.score || 0) > (currentBest.score || 0)) {
        userBestResumes.set(userEmail, resume)
      }
    })

    // Convert to array and sort by score
    const bestResumes = Array.from(userBestResumes.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))

    const leaderboard = bestResumes.map((resume, index) => ({
      rank: index + 1,
      name: resume.user_name?.split('@')[0] || 'Anonymous',
      email: resume.user_name || '',
      score: resume.score || 0,
      status: resume.status
    }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}