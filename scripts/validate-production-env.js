#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that all required environment variables are set for production deployment
 */

const requiredEnvVars = {
  // Core application
  'NODE_ENV': production,
  'NEXT_PUBLIC_SITE_URL': https://autismearlydetectioncompanion-m2xezi56j.vercel.app
  
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': https://nugybnlgrrwzbpjpfmty.supabase.co,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTk1MTYsImV4cCI6MjA2MDY5NTUxNn0.5-_k2OAbKtNZvSUQm4oZpTlsEVc0jpuVp6AyLKE7rKE,
  'SUPABASE_SERVICE_ROLE_KEY': eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTExOTUxNiwiZXhwIjoyMDYwNjk1NTE2fQ.Ud6tx1GR3KLG_yR-7jhXFC2R3kQkVUbY0jkY-9lav18,
  
  // AI API (at least one required)
  'DEEPSEEK_API_KEY': sk-993802b2249f454284002a6071a471c2,
  'DEEPSEEK_API_BASE_URL': https://api.deepseek.com,
  
  // Maps
  'NEXT_PUBLIC_GEOAPIFY_API_KEY': 4de47a12d22c4b2d94f1eb9c8f66c23e,
  
  // Security
  'NEXTAUTH_SECRET': 'Random secret for NextAuth (use: openssl rand -base64 32)',
  'NEXTAUTH_URL': 'Production URL for NextAuth'
}

const optionalEnvVars = {
  // Monitoring
  'NEXT_PUBLIC_SENTRY_DSN': 'Sentry DSN for error tracking',
  
  // Email
  'SENDGRID_API_KEY': 'SendGrid API key for email notifications',
  'SENDGRID_FROM_EMAIL': 'From email address for notifications',
  
  // Admin
  'ADMIN_EMAIL': 'Admin panel email (default: admin)',
  'ADMIN_PASSWORD': 'Admin panel password (default: admin)',
  
  // Analytics
  'NEXT_PUBLIC_GA_MEASUREMENT_ID': 'Google Analytics measurement ID',
  'NEXT_PUBLIC_VERCEL_ANALYTICS': 'Vercel Analytics flag'
}

function validateEnvironment() {
  console.log('🔍 Validating production environment variables...\n')

  let hasErrors = false
  let hasWarnings = false

  // Check required variables
  console.log('📋 Required Variables:')
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName]

    if (!value || value.trim() === '') {
      console.log(`❌ ${varName}: MISSING - ${description}`)
      hasErrors = true
    } else {
      // Additional validation
      if (varName === 'NODE_ENV' && value !== 'production') {
        console.log(`⚠️  ${varName}: "${value}" - Should be "production" for production deployment`)
        hasWarnings = true
      } else if (varName === 'NEXT_PUBLIC_SITE_URL' && value.includes('localhost')) {
        console.log(`⚠️  ${varName}: "${value}" - Should not be localhost for production`)
        hasWarnings = true
      } else if (varName.startsWith('NEXT_PUBLIC_SUPABASE')) {
        // Show partial key for Supabase variables for debugging
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`✅ ${varName}: Set`)
      }
    }
  }
  
  // Check AI API keys (at least one required)
  const hasDeepSeek = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_BASE_URL
  const hasOpenAI = process.env.OPENAI_API_KEY
  
  if (!hasDeepSeek && !hasOpenAI) {
    console.log(`❌ AI API: MISSING - Need either DeepSeek (DEEPSEEK_API_KEY + DEEPSEEK_API_BASE_URL) or OpenAI (OPENAI_API_KEY)`)
    hasErrors = true
  } else {
    console.log(`✅ AI API: ${hasDeepSeek ? 'DeepSeek' : 'OpenAI'} configured`)
  }
  
  // Check optional variables
  console.log('\n📋 Optional Variables:')
  for (const [varName, description] of Object.entries(optionalEnvVars)) {
    const value = process.env[varName]
    
    if (!value || value.trim() === '') {
      console.log(`⚪ ${varName}: Not set - ${description}`)
    } else {
      console.log(`✅ ${varName}: Set`)
    }
  }
  
  // Security warnings
  console.log('\n🔒 Security Checks:')
  
  if (process.env.ADMIN_PASSWORD === 'admin') {
    console.log(`⚠️  ADMIN_PASSWORD: Using default password - Change for production!`)
    hasWarnings = true
  } else {
    console.log(`✅ ADMIN_PASSWORD: Custom password set`)
  }
  
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    console.log(`⚠️  NEXTAUTH_SECRET: Should be at least 32 characters long`)
    hasWarnings = true
  } else {
    console.log(`✅ NEXTAUTH_SECRET: Adequate length`)
  }
  
  // Summary
  console.log('\n📊 Summary:')
  if (hasErrors) {
    console.log('❌ Environment validation FAILED - Missing required variables')
    console.log('   Please set all required environment variables before deploying to production.')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('⚠️  Environment validation PASSED with warnings')
    console.log('   Consider addressing the warnings above for better security and functionality.')
    process.exit(0)
  } else {
    console.log('✅ Environment validation PASSED')
    console.log('   All required variables are set and configured correctly.')
    process.exit(0)
  }
}

// Run validation
validateEnvironment()
