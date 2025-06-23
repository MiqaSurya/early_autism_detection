import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

// DELETE a child profile and all related data
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = params
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Starting deletion process for child: ${id}`)

    // Try using the database function first (if it exists)
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('delete_child_profile', {
          child_uuid: id,
          user_uuid: session.user.id
        })

      if (!functionError && functionResult?.success) {
        console.log('Successfully deleted using database function')
        return NextResponse.json({
          success: true,
          message: functionResult.message
        })
      }
    } catch (funcError) {
      console.log('Database function not available, using manual deletion')
    }

    // Fallback to manual deletion process
    // Verify the child belongs to the authenticated user
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name, parent_id')
      .eq('id', id)
      .eq('parent_id', session.user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json({
        error: 'Child profile not found or access denied'
      }, { status: 404 })
    }

    // Manual deletion in dependency order
    console.log(`Manual deletion for child: ${child.name} (${child.id})`)

    // Get all assessments for this child first
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('child_id', id)

    const assessmentIds = assessments?.map(a => a.id) || []
    console.log(`Found ${assessmentIds.length} assessments to delete`)

    // Step 1: Delete responses first (they reference assessments)
    if (assessmentIds.length > 0) {
      try {
        const { error: responsesError } = await supabase
          .from('responses')
          .delete()
          .in('assessment_id', assessmentIds)

        if (responsesError && !responsesError.message.includes('does not exist')) {
          console.error('Error deleting responses:', responsesError)
        } else {
          console.log('Successfully deleted responses')
        }
      } catch (e) {
        console.log('Responses table might not exist, continuing...')
      }
    }

    // Step 2: Delete assessment history
    if (assessmentIds.length > 0) {
      try {
        const { error: historyError } = await supabase
          .from('assessment_history')
          .delete()
          .in('assessment_id', assessmentIds)

        if (historyError && !historyError.message.includes('does not exist')) {
          console.error('Error deleting assessment history:', historyError)
        } else {
          console.log('Successfully deleted assessment history')
        }
      } catch (e) {
        console.log('Assessment history table might not exist, continuing...')
      }
    }

    // Step 3: Delete other child-related data
    const childTables = [
      'assessment_comparisons',
      'development_photos',
      'interventions',
      'progress_notes',
      'milestones'
    ]

    for (const tableName of childTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('child_id', id)

        if (error && !error.message.includes('does not exist')) {
          console.error(`Error deleting from ${tableName}:`, error)
        } else {
          console.log(`Successfully deleted from ${tableName}`)
        }
      } catch (e) {
        console.log(`Table ${tableName} might not exist, continuing...`)
      }
    }

    // Step 4: Delete assessments
    try {
      const { error: assessmentsError } = await supabase
        .from('assessments')
        .delete()
        .eq('child_id', id)

      if (assessmentsError) {
        console.error('Error deleting assessments:', assessmentsError)
        throw new Error(`Failed to delete assessments: ${assessmentsError.message}`)
      } else {
        console.log('Successfully deleted assessments')
      }
    } catch (e) {
      console.error('Critical error deleting assessments:', e)
      throw e
    }

    // Finally delete the child profile
    const { error: childDeleteError } = await supabase
      .from('children')
      .delete()
      .eq('id', id)
      .eq('parent_id', session.user.id)

    if (childDeleteError) {
      console.error('Error deleting child profile:', childDeleteError)
      return NextResponse.json({
        error: `Failed to delete child profile: ${childDeleteError.message}`
      }, { status: 500 })
    }

    console.log(`Successfully deleted child profile: ${child.name}`)

    return NextResponse.json({
      success: true,
      message: `${child.name}'s profile has been permanently deleted.`
    })

  } catch (error) {
    console.error('Unexpected error during child deletion:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred while deleting the child profile'
    }, { status: 500 })
  }
}

// GET a specific child profile
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = params
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the child profile
    const { data: child, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('parent_id', session.user.id)
      .single()

    if (error || !child) {
      return NextResponse.json({ 
        error: 'Child profile not found or access denied' 
      }, { status: 404 })
    }

    return NextResponse.json(child)

  } catch (error) {
    console.error('Error fetching child profile:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch child profile' 
    }, { status: 500 })
  }
}

// PUT/PATCH to update a child profile
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = params
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, date_of_birth, gender, additional_notes } = body

    // Update the child profile
    const { data: child, error } = await supabase
      .from('children')
      .update({
        name,
        date_of_birth,
        gender,
        additional_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('parent_id', session.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: `Failed to update child profile: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(child)

  } catch (error) {
    console.error('Error updating child profile:', error)
    return NextResponse.json({ 
      error: 'Failed to update child profile' 
    }, { status: 500 })
  }
}
