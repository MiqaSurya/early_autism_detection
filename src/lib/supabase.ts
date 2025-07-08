import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabaseConfig, isDevelopment } from './env'

// Use the auth helpers client for consistency with middleware
export const supabase = createClientComponentClient()

// Log initialization (development only)
if (typeof window !== 'undefined' && isDevelopment) {
  console.log('Supabase client initialized with:', {
    url: supabaseConfig.url,
    hasKey: !!supabaseConfig.anonKey,
    storage: 'cookies (auth-helpers)'
  })
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    if (isDevelopment) {
      console.error('Error signing out:', error.message)
    }
    throw error
  }
}
