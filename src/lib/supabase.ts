import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// TypeScript type assertion since we've checked for undefined
const url = supabaseUrl as string
const key = supabaseAnonKey as string

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    global: {
      headers: {
        'X-Client-Info': '@supabase/auth-helpers-nextjs',
      },
    },
  })

  // Log initialization
  console.log('Supabase client initialized with:', {
    url,
    hasKey: !!key,
    storage: typeof window !== 'undefined' ? 'localStorage' : 'none'
  })

  return supabaseInstance
}

// Export a singleton instance
export const supabase = getSupabase()

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}
