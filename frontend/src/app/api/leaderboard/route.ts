import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('resumes')
      .select('score, status, user_name')
      .not('score', 'is', null)
      .order('score', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const leaderboard = data?.map((resume, index) => ({
      rank: index + 1,
      name: resume.user_name?.split('@')[0] || 'Anonymous',
      email: resume.user_name || '',
      score: resume.score || 0,
      status: resume.status
    })) || []

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}