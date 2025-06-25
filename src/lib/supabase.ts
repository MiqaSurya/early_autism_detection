import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Use the auth helpers client for consistency with middleware
export const supabase = createClientComponentClient()

// Log initialization
if (typeof window !== 'undefined') {
  console.log('Supabase client initialized with:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    storage: 'cookies (auth-helpers)'
  })
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}
