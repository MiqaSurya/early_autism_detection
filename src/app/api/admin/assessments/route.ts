import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin API: Fetching all assessments...')

    // Get all assessments
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .order('started_at', { ascending: false })

    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError)
      return NextResponse.json({ error: 'Failed to fetch assessments', details: assessmentError }, { status: 500 })
    }

    console.log(`📊 Found ${assessments?.length || 0} assessments`)

    if (!assessments || assessments.length === 0) {
      console.log('⚠️ No assessments found in database')
      return NextResponse.json({
        success: true,
        assessments: [],
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0
        }
      })
    }

    // Get all children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, parent_id')

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError)
      return NextResponse.json({ error: 'Failed to fetch children', details: childrenError }, { status: 500 })
    }

    console.log(`👶 Found ${children?.length || 0} children`)

    // Get user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name')

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
    }

    console.log(`👤 Found ${profiles?.length || 0} profiles`)

    // Map assessments with child and parent information
    const adminAssessments = assessments.map(assessment => {
      const child = children?.find(c => c.id === assessment.child_id)
      const profile = profiles?.find(p => p.id === child?.parent_id)

      console.log(`🔗 Mapping assessment ${assessment.id}:`, {
        assessment_child_id: assessment.child_id,
        found_child: child?.name,
        child_parent_id: child?.parent_id,
        found_profile: profile?.email || profile?.display_name
      })

      return {
        id: assessment.id,
        childName: child?.name || 'Unknown Child',
        parentEmail: profile?.email || profile?.display_name || 'Unknown Parent',
        status: assessment.status,
        riskLevel: assessment.risk_level,
        score: assessment.score,
        startedAt: assessment.started_at,
        completedAt: assessment.completed_at,
        responses: assessment.responses,
        parentId: child?.parent_id || '',
        childId: assessment.child_id
      }
    })

    // Calculate stats
    const stats = {
      total: assessments.length,
      completed: assessments.filter(a => a.status === 'completed').length,
      inProgress: assessments.filter(a => a.status === 'in_progress').length,
      lowRisk: assessments.filter(a => a.risk_level === 'low').length,
      mediumRisk: assessments.filter(a => a.risk_level === 'medium').length,
      highRisk: assessments.filter(a => a.risk_level === 'high').length
    }

    console.log('📈 Assessment stats:', stats)
    console.log(`✅ Returning ${adminAssessments.length} admin assessments`)

    return NextResponse.json({
      success: true,
      assessments: adminAssessments,
      stats
    })

  } catch (error) {
    console.error('❌ Admin API: Error fetching assessments:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { assessmentId, updates } = await request.json()

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    console.log(`🔄 Admin API: Updating assessment ${assessmentId}:`, updates)

    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', assessmentId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating assessment:', error)
      return NextResponse.json({ error: 'Failed to update assessment', details: error }, { status: 500 })
    }

    console.log('✅ Assessment updated successfully:', data)

    return NextResponse.json({
      success: true,
      assessment: data
    })

  } catch (error) {
    console.error('❌ Admin API: Error updating assessment:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('id')

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    console.log(`🗑️ Admin API: Deleting assessment ${assessmentId}`)

    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)

    if (error) {
      console.error('❌ Error deleting assessment:', error)
      return NextResponse.json({ error: 'Failed to delete assessment', details: error }, { status: 500 })
    }

    console.log('✅ Assessment deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    })

  } catch (error) {
    console.error('❌ Admin API: Error deleting assessment:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
