import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// DEBUG endpoint to see what's preventing deletion
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = params
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get child info
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json({ 
        error: 'Child profile not found or access denied' 
      }, { status: 404 })
    }

    // Check all related data
    const debugInfo = {
      child: child,
      relatedData: {} as any,
      constraints: null as any
    }

    // Check assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('child_id', id)
    
    debugInfo.relatedData.assessments = {
      count: assessments?.length || 0,
      data: assessments || []
    }

    // Check responses
    if (assessments && assessments.length > 0) {
      const assessmentIds = assessments.map(a => a.id)
      const { data: responses } = await supabase
        .from('responses')
        .select('*')
        .in('assessment_id', assessmentIds)
      
      debugInfo.relatedData.responses = {
        count: responses?.length || 0,
        data: responses || []
      }
    }

    // Check other tables
    const tablesToCheck = [
      'milestones',
      'progress_notes', 
      'interventions',
      'assessment_comparisons',
      'development_photos',
      'assessment_history'
    ]

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('child_id', id)
        
        debugInfo.relatedData[tableName] = {
          count: data?.length || 0,
          data: data || [],
          error: error?.message || null
        }
      } catch (e) {
        debugInfo.relatedData[tableName] = {
          count: 0,
          data: [],
          error: `Table might not exist: ${e}`
        }
      }
    }

    // Check foreign key constraints
    try {
      const { data: constraints } = await supabase
        .rpc('get_foreign_key_constraints', { table_name: 'children' })
      
      debugInfo.constraints = constraints
    } catch (e) {
      debugInfo.constraints = `Could not fetch constraints: ${e}`
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      summary: {
        childName: child.name,
        totalAssessments: debugInfo.relatedData.assessments?.count || 0,
        totalResponses: debugInfo.relatedData.responses?.count || 0,
        tablesWithData: Object.entries(debugInfo.relatedData)
          .filter(([_, info]: [string, any]) => info.count > 0)
          .map(([table, info]: [string, any]) => `${table}: ${info.count} records`)
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
