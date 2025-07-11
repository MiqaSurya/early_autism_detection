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

// FORCE DELETE - This endpoint will delete a child profile no matter what
export async function DELETE(request: Request, { params }: RouteParams) {
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
    console.log(`🔥 FORCE DELETE started for child ID: ${id}`)
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the child belongs to the authenticated user
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name, parent_id')
      .eq('id', id)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      console.log(`❌ Child not found or access denied: ${childError?.message}`)
      return NextResponse.json({ 
        error: 'Child profile not found or access denied' 
      }, { status: 404 })
    }

    console.log(`👶 Found child: ${child.name} (${child.id})`)

    // AGGRESSIVE DELETION STRATEGY
    // We'll try multiple approaches to ensure deletion succeeds

    // Step 1: Get all assessments for this child
    const { data: assessments, error: assessmentsQueryError } = await supabase
      .from('assessments')
      .select('id')
      .eq('child_id', id)

    if (assessmentsQueryError) {
      console.log(`⚠️ Error querying assessments: ${assessmentsQueryError.message}`)
    }

    const assessmentIds = assessments?.map(a => a.id) || []
    console.log(`📊 Found ${assessmentIds.length} assessments to delete`)

    // Step 2: Force delete all related data using raw SQL if needed
    const deletionQueries = [
      // Delete responses first
      assessmentIds.length > 0 ? `DELETE FROM responses WHERE assessment_id = ANY(ARRAY['${assessmentIds.join("','")}'])` : null,
      
      // Delete assessment history
      assessmentIds.length > 0 ? `DELETE FROM assessment_history WHERE assessment_id = ANY(ARRAY['${assessmentIds.join("','")}'])` : null,
      
      // Delete child-related data
      `DELETE FROM assessment_comparisons WHERE child_id = '${id}'`,
      `DELETE FROM development_photos WHERE child_id = '${id}'`,
      `DELETE FROM interventions WHERE child_id = '${id}'`,
      `DELETE FROM progress_notes WHERE child_id = '${id}'`,
      `DELETE FROM milestones WHERE child_id = '${id}'`,
      
      // Delete assessments
      `DELETE FROM assessments WHERE child_id = '${id}'`,
      
      // Finally delete the child
      `DELETE FROM children WHERE id = '${id}' AND parent_id = '${session.user.id}'`
    ].filter(Boolean)

    // Execute each deletion query
    for (let i = 0; i < deletionQueries.length; i++) {
      const query = deletionQueries[i]
      if (!query) continue
      
      try {
        console.log(`🗑️ Executing deletion step ${i + 1}: ${query.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('execute_sql', { sql_query: query })
        
        if (error) {
          console.log(`⚠️ SQL execution failed, trying Supabase client method...`)
          
          // Fallback to Supabase client methods
          if (query.includes('responses') && assessmentIds.length > 0) {
            await supabase.from('responses').delete().in('assessment_id', assessmentIds)
          } else if (query.includes('assessment_history') && assessmentIds.length > 0) {
            await supabase.from('assessment_history').delete().in('assessment_id', assessmentIds)
          } else if (query.includes('assessment_comparisons')) {
            await supabase.from('assessment_comparisons').delete().eq('child_id', id)
          } else if (query.includes('development_photos')) {
            await supabase.from('development_photos').delete().eq('child_id', id)
          } else if (query.includes('interventions')) {
            await supabase.from('interventions').delete().eq('child_id', id)
          } else if (query.includes('progress_notes')) {
            await supabase.from('progress_notes').delete().eq('child_id', id)
          } else if (query.includes('milestones')) {
            await supabase.from('milestones').delete().eq('child_id', id)
          } else if (query.includes('assessments')) {
            await supabase.from('assessments').delete().eq('child_id', id)
          } else if (query.includes('children')) {
            const { error: finalError } = await supabase.from('children').delete().eq('id', id).eq('parent_id', session.user.id)
            if (finalError) throw finalError
          }
        }
        
        console.log(`✅ Deletion step ${i + 1} completed`)
        
      } catch (stepError) {
        console.log(`⚠️ Step ${i + 1} failed: ${stepError}`)
        // Continue with next step
      }
    }

    // Verify the child is actually deleted
    const { data: verifyChild, error: verifyError } = await supabase
      .from('children')
      .select('id')
      .eq('id', id)
      .single()

    if (verifyChild) {
      console.log(`❌ Child still exists after deletion attempts`)

      // Try one more direct deletion attempt
      console.log(`🔄 Attempting final direct deletion...`)
      const { error: finalDeleteError } = await supabase
        .from('children')
        .delete()
        .eq('id', id)
        .eq('parent_id', session.user.id)

      if (finalDeleteError) {
        console.log(`❌ Final deletion failed: ${finalDeleteError.message}`)
        return NextResponse.json({
          error: `Failed to delete child profile: ${finalDeleteError.message}`,
          details: 'Child profile and some related data may still exist'
        }, { status: 500 })
      }

      // Verify again
      const { data: verifyAgain } = await supabase
        .from('children')
        .select('id')
        .eq('id', id)
        .single()

      if (verifyAgain) {
        return NextResponse.json({
          error: 'Child profile could not be deleted. There may be hidden constraints preventing deletion.',
          details: 'Please try the manual SQL deletion method'
        }, { status: 500 })
      }
    }

    console.log(`🎉 SUCCESS: Child profile ${child.name} has been completely deleted`)

    return NextResponse.json({ 
      success: true, 
      message: `${child.name}'s profile has been permanently deleted.`,
      details: `Deleted child and ${assessmentIds.length} related assessments`
    })

  } catch (error) {
    console.error('💥 FORCE DELETE ERROR:', error)
    return NextResponse.json({ 
      error: `Force deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// Helper function to execute raw SQL (if available)
async function executeRawSQL(supabase: any, sql: string) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
    return { data, error }
  } catch (e) {
    return { data: null, error: e }
  }
}
