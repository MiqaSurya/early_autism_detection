import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

// DELETE a saved location
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = params
  const supabase = createRouteHandlerClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Delete the saved location
  const { error } = await supabase
    .from('saved_locations')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

// PATCH to update a saved location
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = params
  const supabase = createRouteHandlerClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get request body
  const body = await request.json()
  
  // Update the saved location
  const { data, error } = await supabase
    .from('saved_locations')
    .update({
      name: body.name,
      type: body.type,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      phone: body.phone,
      notes: body.notes
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
} 