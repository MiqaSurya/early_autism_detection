import { z } from 'zod'

// Check if we're running on the client side
const isClient = typeof window !== 'undefined'

// Define the schema for server-side environment variables
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Site configuration
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI configuration (server-only)
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_API_BASE_URL: z.string().url(),

  // Maps configuration
  NEXT_PUBLIC_GEOAPIFY_API_KEY: z.string().min(1),

  // Monitoring (optional in development)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().transform(val => {
    if (!val || val === '' || val === 'undefined') return undefined
    try {
      new URL(val)
      return val
    } catch {
      console.warn(`⚠️ Invalid NEXT_PUBLIC_SENTRY_DSN: ${val}`)
      return undefined
    }
  }),
  SENTRY_ORG: z.string().optional().or(z.literal('')),
  SENTRY_PROJECT: z.string().optional().or(z.literal('')),
  SENTRY_AUTH_TOKEN: z.string().optional().or(z.literal('')),

  // Email (optional)
  SENDGRID_API_KEY: z.string().optional().or(z.literal('')),
  SENDGRID_FROM_EMAIL: z.union([
    z.string().email(),
    z.literal(''),
    z.undefined()
  ]).optional(),

  // Security
  NEXTAUTH_SECRET: z.string().optional().or(z.literal('')),
  NEXTAUTH_URL: z.union([
    z.string().url(),
    z.literal(''),
    z.undefined()
  ]).optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_VERCEL_ANALYTICS: z.string().optional().or(z.literal('')),

  // Admin configuration (optional)
  ADMIN_EMAIL: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
})

// For client-side, create a more lenient approach
const clientEnvDefaults = {
  NODE_ENV: 'development' as const,
  NEXT_PUBLIC_SITE_URL: 'https://autismearlydetectioncompanion.vercel.app',
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_GEOAPIFY_API_KEY: '',
  NEXT_PUBLIC_SENTRY_DSN: '',
  NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
  NEXT_PUBLIC_VERCEL_ANALYTICS: '',
}

// Parse and validate environment variables
function validateEnv() {
  // On client side, use a more lenient approach
  if (isClient) {
    // Create a client environment object with fallbacks
    const clientEnv = {
      NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || clientEnvDefaults.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || clientEnvDefaults.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || clientEnvDefaults.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GEOAPIFY_API_KEY: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || clientEnvDefaults.NEXT_PUBLIC_GEOAPIFY_API_KEY,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || clientEnvDefaults.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || clientEnvDefaults.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_VERCEL_ANALYTICS: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS || clientEnvDefaults.NEXT_PUBLIC_VERCEL_ANALYTICS,
    }

    // Only warn about missing critical variables in development
    if (process.env.NODE_ENV === 'development') {
      const missingVars = []
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      if (!process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY) missingVars.push('NEXT_PUBLIC_GEOAPIFY_API_KEY')

      if (missingVars.length > 0) {
        console.warn(`⚠️ Client-side environment variables not loaded: ${missingVars.join(', ')}`)
        console.warn('⚠️ Using fallback values. Check your .env.local file and restart the server.')
      }
    }

    return clientEnv
  }

  // Server-side validation
  try {
    const env = serverEnvSchema.parse(process.env)

    // Additional validation for production (server-side only)
    if (env.NODE_ENV === 'production') {
      // Ensure critical production variables are set
      if (!env.NEXT_PUBLIC_SENTRY_DSN) {
        console.warn('⚠️  NEXT_PUBLIC_SENTRY_DSN not set - error tracking disabled')
      }

      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - some features may not work')
      }

      if (env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
        console.warn('⚠️  NEXT_PUBLIC_SITE_URL is localhost - should be updated for production')
      }

      if (!env.NEXTAUTH_SECRET) {
        console.warn('⚠️  NEXTAUTH_SECRET not set - using default (not recommended)')
      }
    }

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed (server):')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('❌ Environment validation error:', error)
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }

    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Export utility functions
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

// Export configuration objects
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: !isClient && 'SUPABASE_SERVICE_ROLE_KEY' in env ? env.SUPABASE_SERVICE_ROLE_KEY : undefined,
}

export const sentryConfig = {
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  org: !isClient && 'SENTRY_ORG' in env ? env.SENTRY_ORG : undefined,
  project: !isClient && 'SENTRY_PROJECT' in env ? env.SENTRY_PROJECT : undefined,
  authToken: !isClient && 'SENTRY_AUTH_TOKEN' in env ? env.SENTRY_AUTH_TOKEN : undefined,
}

export const apiConfig = {
  deepseek: {
    apiKey: !isClient && 'DEEPSEEK_API_KEY' in env ? env.DEEPSEEK_API_KEY : undefined,
    baseUrl: !isClient && 'DEEPSEEK_API_BASE_URL' in env ? env.DEEPSEEK_API_BASE_URL : undefined,
  },
  geoapify: {
    apiKey: env.NEXT_PUBLIC_GEOAPIFY_API_KEY,
  },
  sendgrid: {
    apiKey: !isClient && 'SENDGRID_API_KEY' in env ? env.SENDGRID_API_KEY : undefined,
    fromEmail: !isClient && 'SENDGRID_FROM_EMAIL' in env ? env.SENDGRID_FROM_EMAIL : undefined,
  },
}

// Log environment status (server-side only)
if (!isClient && isDevelopment) {
  console.log('🔧 Environment:', env.NODE_ENV)
  console.log('🌐 Site URL:', env.NEXT_PUBLIC_SITE_URL)
  console.log('📊 Sentry:', env.NEXT_PUBLIC_SENTRY_DSN ? 'Enabled' : 'Disabled')
}
