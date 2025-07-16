import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig, isDevelopment } from './env'

// Use the SSR client for consistency with middleware with real-time configuration
export const supabase = createBrowserClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'early-autism-detector-web',
      },
    },
  }
)

// Log initialization (development only)
if (typeof window !== 'undefined' && isDevelopment) {
  console.log('Supabase client initialized with:', {
    url: supabaseConfig.url,
    hasKey: !!supabaseConfig.anonKey,
    storage: 'cookies (ssr)'
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
