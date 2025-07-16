// Debug utility to check database state
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function checkUserProfile(email: string) {
  try {
    // First get the user by email from auth
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.log('User not found with email:', email)
      return
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    })

    // Now check the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return
    }

    console.log('Profile found:', profile)

    // Check if there's a center managed by this user
    const { data: centers, error: centersError } = await supabase
      .from('autism_centers')
      .select('*')
      .eq('managed_by', user.id)

    if (centersError) {
      console.error('Centers error:', centersError)
    } else {
      console.log('Centers managed by user:', centers)
    }

  } catch (error) {
    console.error('Debug error:', error)
  }
}
