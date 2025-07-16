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

// Admin-only stats endpoint
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

    console.log('🔍 Admin API: Fetching stats...')

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth users error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Get assessments data
    const { data: assessments, error: assessmentsError } = await supabaseAdmin
      .from('assessments')
      .select('user_id, id, created_at, completed')

    if (assessmentsError) {
      console.error('❌ Assessments error:', assessmentsError)
    }

    // Get autism centers data
    const { data: centers, error: centersError } = await supabaseAdmin
      .from('autism_centers')
      .select('id, created_at')

    if (centersError) {
      console.error('❌ Centers error:', centersError)
    }

    // Calculate stats
    const totalUsers = authUsers?.users?.length || 0
    const totalAssessments = assessments?.length || 0
    const totalLocations = centers?.length || 0

    // Calculate active users (signed in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeUsers = authUsers?.users?.filter(user => 
      new Date(user.last_sign_in_at || user.created_at) > thirtyDaysAgo
    ).length || 0

    // Calculate new users this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const newThisMonth = authUsers?.users?.filter(user => 
      new Date(user.created_at) >= startOfMonth
    ).length || 0

    const stats = {
      totalUsers,
      activeUsers,
      newThisMonth,
      totalAssessments,
      totalLocations,
      userGrowth: '0%', // Could calculate if we had historical data
      assessmentGrowth: '0%',
      locationGrowth: '0%',
      activeUserGrowth: '0%'
    }

    console.log('✅ Admin API: Stats calculated:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ Admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
