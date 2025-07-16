import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to check admin authentication from headers
function isAdminRequest(request: NextRequest): boolean {
  const adminSession = request.headers.get('x-admin-session')
  
  if (!adminSession) {
    return false
  }

  try {
    const session = JSON.parse(adminSession)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin'
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

// GET - Get recent center registrations for admin dashboard
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Use service role client for admin operations
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

    console.log('🔍 Admin API: Fetching recent center registrations...')

    // Get recent center registrations from autism_centers table
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data: recentRegistrations, error: registrationsError } = await supabaseAdmin
      .from('autism_centers')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        website,
        description,
        latitude,
        longitude,
        is_verified,
        created_at,
        updated_at
      `)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (registrationsError) {
      console.error('❌ Recent registrations error:', registrationsError)
      return NextResponse.json({ error: registrationsError.message }, { status: 500 })
    }

    // Calculate stats from autism_centers table
    const { data: allCenters, error: allCentersError } = await supabaseAdmin
      .from('autism_centers')
      .select('id, is_verified, created_at')

    let dashboardStats = {
      total_centers: 0,
      verified_centers: 0,
      pending_centers: 0,
      recent_registrations: 0,
      verification_rate: 0
    }

    if (!allCentersError && allCenters) {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

      dashboardStats = {
        total_centers: allCenters.length,
        verified_centers: allCenters.filter(c => c.is_verified).length,
        pending_centers: allCenters.filter(c => !c.is_verified).length,
        recent_registrations: allCenters.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length,
        verification_rate: allCenters.length > 0 ? Math.round((allCenters.filter(c => c.is_verified).length / allCenters.length) * 100) : 0
      }
    }

    // Note: Admin logs functionality can be added later if needed
    const recentLogs: any[] = []

    console.log('✅ Admin API: Retrieved registration data:', {
      registrations: recentRegistrations?.length || 0,
      stats: !!dashboardStats,
      logs: recentLogs?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: {
        registrations: (recentRegistrations || []).slice(0, limit),
        stats: dashboardStats || {
          total_centers: 0,
          verified_centers: 0,
          pending_centers: 0,
          new_centers_30d: 0,
          total_center_managers: 0
        },
        recentActivity: recentLogs || [],
        summary: {
          totalRegistrations: recentRegistrations?.length || 0,
          pendingVerification: recentRegistrations?.filter(r => !r.is_verified).length || 0,
          verifiedCenters: recentRegistrations?.filter(r => r.is_verified).length || 0,
          daysRequested: days
        }
      }
    })

  } catch (error) {
    console.error('❌ Admin center registrations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Verify/approve a center registration or handle notifications
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action } = body

    // Handle new registration notifications (no auth required for system notifications)
    if (action === 'notify_new_registration') {
      const { centerId, centerName, managerEmail, managerName } = body

      console.log('📢 New center registration notification:', {
        centerId,
        centerName,
        managerEmail,
        managerName
      })

      // Use service role client for admin operations
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

      // Log the notification for admin tracking
      const { error: logError } = await supabaseAdmin
        .from('admin_logs')
        .insert({
          action: 'new_center_registration_notification',
          table_name: 'autism_centers',
          record_id: centerId,
          details: {
            center_name: centerName,
            manager_email: managerEmail,
            manager_name: managerName,
            notification_time: new Date().toISOString(),
            source: 'center_portal_registration'
          }
        })

      if (logError) {
        console.error('❌ Notification log error:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'Registration notification logged successfully'
      })
    }

    // For other actions, check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { centerId, notes } = body

    if (!centerId || !action) {
      return NextResponse.json({ error: 'Missing required fields: centerId, action' }, { status: 400 })
    }

    if (!['approve', 'reject', 'pending'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be: approve, reject, or pending' }, { status: 400 })
    }

    // Use service role client for admin operations
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

    console.log('🔧 Admin API: Processing center verification:', { centerId, action })

    // Update center verification status
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.is_verified = true
    } else if (action === 'reject') {
      updateData.is_verified = false
      // Could add a rejection reason field
    } else if (action === 'pending') {
      updateData.is_verified = false
    }

    const { data: updatedCenter, error: updateError } = await supabaseAdmin
      .from('autism_centers')
      .update(updateData)
      .eq('id', centerId)
      .select(`
        id,
        name,
        type,
        is_verified,
        managed_by,
        profiles!managed_by (
          full_name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('❌ Center update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log the admin action
    const { error: logError } = await supabaseAdmin
      .from('admin_logs')
      .insert({
        action: `center_${action}`,
        table_name: 'autism_centers',
        record_id: centerId,
        details: {
          center_name: updatedCenter.name,
          action: action,
          notes: notes || null,
          admin_action: true
        }
      })

    if (logError) {
      console.error('❌ Admin log error:', logError)
    }

    console.log('✅ Admin API: Center verification updated:', {
      centerId,
      action,
      isVerified: updatedCenter.is_verified
    })

    return NextResponse.json({
      success: true,
      message: `Center ${action} successfully`,
      data: {
        centerId: updatedCenter.id,
        centerName: updatedCenter.name,
        isVerified: updatedCenter.is_verified,
        managerName: (updatedCenter.profiles as any)?.full_name || 'N/A',
        managerEmail: (updatedCenter.profiles as any)?.email || 'N/A',
        action: action
      }
    })

  } catch (error) {
    console.error('❌ Admin center verification API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
