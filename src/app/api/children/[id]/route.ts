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

    // Get all assessments for this child
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('child_id', id)

    const assessmentIds = assessments?.map(a => a.id) || []

    // Delete in reverse dependency order
    const deletionSteps = [
      // 1. Delete responses (reference assessments)
      { table: 'responses', condition: { assessment_id: assessmentIds }, useIn: true },
      // 2. Delete assessment history (reference assessments)
      { table: 'assessment_history', condition: { assessment_id: assessmentIds }, useIn: true },
      // 3. Delete assessment comparisons (reference child)
      { table: 'assessment_comparisons', condition: { child_id: id } },
      // 4. Delete development photos (reference child)
      { table: 'development_photos', condition: { child_id: id } },
      // 5. Delete interventions (reference child)
      { table: 'interventions', condition: { child_id: id } },
      // 6. Delete progress notes (reference child)
      { table: 'progress_notes', condition: { child_id: id } },
      // 7. Delete milestones (reference child)
      { table: 'milestones', condition: { child_id: id } },
      // 8. Delete assessments (reference child)
      { table: 'assessments', condition: { child_id: id } },
    ]

    for (const step of deletionSteps) {
      try {
        let query = supabase.from(step.table).delete()

        if (step.useIn && Array.isArray(Object.values(step.condition)[0])) {
          const [key, values] = Object.entries(step.condition)[0]
          if (values.length > 0) {
            query = query.in(key, values)
          } else {
            continue // Skip if no values to delete
          }
        } else {
          const [key, value] = Object.entries(step.condition)[0]
          query = query.eq(key, value)
        }

        const { error } = await query

        if (error && !error.message.includes('does not exist')) {
          console.error(`Error deleting from ${step.table}:`, error)
        }
      } catch (stepError) {
        console.error(`Error in deletion step for ${step.table}:`, stepError)
        // Continue with other deletions
      }
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
