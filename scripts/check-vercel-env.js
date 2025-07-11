#!/usr/bin/env node

/**
 * Vercel Environment Variables Checker
 * Helps verify that all required environment variables are set in Vercel
 */

const requiredEnvVars = {
  'NODE_ENV': 'production',
  'NEXT_PUBLIC_SITE_URL': 'https://autismearlydetectioncompanion.vercel.app',
  'NEXT_PUBLIC_SUPABASE_URL': 'https://nugybnlgrrwzbpjpfmty.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTk1MTYsImV4cCI6MjA2MDY5NTUxNn0.5-_k2OAbKtNZvSUQm4oZpTlsEVc0jpuVp6AyLKE7rKE',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTExOTUxNiwiZXhwIjoyMDYwNjk1NTE2fQ.Ud6tx1GR3KLG_yR-7jhXFC2R3kQkVUbY0jkY-9lav18',
  'DEEPSEEK_API_KEY': 'sk-993802b2249f454284002a6071a471c2',
  'DEEPSEEK_API_BASE_URL': 'https://api.deepseek.com',
  'NEXT_PUBLIC_GEOAPIFY_API_KEY': '4de47a12d22c4b2d94f1eb9c8f66c23e',
  'NEXTAUTH_SECRET': 'On3fWoM+/pXkHwHhxpOUvv3cJY9iNUDY4urISzJt5Pc=',
  'NEXTAUTH_URL': 'https://autismearlydetectioncompanion.vercel.app'
}

console.log('🔧 Vercel Environment Variables Setup Guide')
console.log('=' .repeat(50))
console.log('')
console.log('📋 Copy and paste these into your Vercel Dashboard:')
console.log('   Go to: Settings > Environment Variables')
console.log('')

for (const [key, value] of Object.entries(requiredEnvVars)) {
  console.log(`${key}=${value}`)
}

console.log('')
console.log('⚠️  IMPORTANT NOTES:')
console.log('1. Replace "your-app-name" with your actual Vercel app name')
console.log('2. Set each variable for ALL environments (Production, Preview, Development)')
console.log('3. After adding all variables, redeploy your application')
console.log('')
console.log('🚀 After setting up, redeploy by:')
console.log('   - Going to Deployments tab')
console.log('   - Clicking "Redeploy" on latest deployment')
console.log('   - Or pushing a new commit')
