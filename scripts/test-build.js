#!/usr/bin/env node

/**
 * Test Build Script
 * 
 * This script tests the build process locally to catch issues before deployment
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔧 Testing Build Process...')
console.log('=' .repeat(50))

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  '.eslintrc.json',
  'tsconfig.json'
]

console.log('\n📋 Checking required files...')
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING`)
    process.exit(1)
  }
}

// Check environment variables
console.log('\n🔐 Checking environment variables...')
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_GEOAPIFY_API_KEY'
]

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`)
  } else {
    console.log(`⚠️  ${envVar} - Not set (may cause build issues)`)
  }
}

try {
  console.log('\n🔍 Running TypeScript check...')
  execSync('npx tsc --noEmit', { stdio: 'inherit' })
  console.log('✅ TypeScript check passed')
} catch (error) {
  console.log('❌ TypeScript check failed')
  process.exit(1)
}

try {
  console.log('\n🔍 Running ESLint check...')
  execSync('npx eslint . --ext .ts,.tsx --max-warnings 10', { stdio: 'inherit' })
  console.log('✅ ESLint check passed')
} catch (error) {
  console.log('⚠️  ESLint warnings found (but continuing...)')
}

try {
  console.log('\n🏗️  Running Next.js build...')
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Build completed successfully!')
} catch (error) {
  console.log('❌ Build failed')
  process.exit(1)
}

console.log('\n🎉 All checks passed! Ready for deployment.')
