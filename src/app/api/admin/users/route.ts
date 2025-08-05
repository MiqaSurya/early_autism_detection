import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Helper function to check admin authentication from headers
function isAdminRequest(request: NextRequest): boolean {
  // Check for admin session in headers (sent from client)
  const adminSession = request.headers.get('x-admin-session')
  
  if (!adminSession) {
    return false
  }

  try {
    const session = JSON.parse(adminSession)
    
    // Verify admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin'
    
    // Check if session is valid and matches admin credentials
    const sessionAge = Date.now() - session.loginTime
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    return session.isAdmin === true && 
           session.email === adminEmail && 
           sessionAge < maxAge
  } catch (error) {
    console.error('Error parsing admin session:', error)
    return false
  }
}

// Admin-only users endpoint
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Use service role client for admin operations to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Admin API: Fetching all users...')

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth users error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Get profiles data
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError)
    }

    // Get children data
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('parent_id, id, name')

    if (childrenError) {
      console.error('❌ Children error:', childrenError)
    }

    // Get assessments data - note: assessments table has child_id, not user_id
    const { data: assessments, error: assessmentsError } = await supabaseAdmin
      .from('assessments')
      .select('child_id, id, started_at, completed_at, status')

    if (assessmentsError) {
      console.error('❌ Assessments error:', assessmentsError)
    }

    console.log('📊 Raw data counts:', {
      authUsers: authUsers?.users?.length || 0,
      profiles: profiles?.length || 0,
      children: children?.length || 0,
      assessments: assessments?.length || 0
    })

    // Process the data
    const users = (authUsers?.users || []).map(user => {
      const profile = profiles?.find(p => p.id === user.id)
      const userChildren = children?.filter(c => c.parent_id === user.id) || []
      // Get assessments for this user's children
      const userAssessments = assessments?.filter(a =>
        userChildren.some(child => child.id === a.child_id)
      ) || []

      return {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || 'No email',
        joinDate: user.created_at,
        lastActive: user.last_sign_in_at || user.created_at,
        assessments: userAssessments.length,
        children: userChildren.length,
        status: (new Date(user.last_sign_in_at || user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ? 'active' : 'inactive',
        emailVerified: user.email_confirmed_at !== null
      }
    })

    console.log('✅ Admin API: Processed users:', {
      totalUsers: users.length,
      sampleUser: users[0]
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('❌ Admin users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
