#!/usr/bin/env node

/**
 * Production Build Test Script
 * Tests the production build locally before deployment
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

async function checkPrerequisites() {
  log('blue', '🔍 Checking prerequisites...')
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Run this script from the project root.')
  }
  
  // Check if .next directory exists (previous build)
  if (fs.existsSync('.next')) {
    log('yellow', '⚠️  Previous build found, cleaning...')
    await runCommand('npm', ['run', 'clean'])
  }
  
  log('green', '✅ Prerequisites check passed')
}

async function validateEnvironment() {
  log('blue', '🔧 Validating environment variables...')
  
  if (fs.existsSync('scripts/validate-production-env.js')) {
    await runCommand('node', ['scripts/validate-production-env.js'])
  } else {
    log('yellow', '⚠️  Environment validation script not found, skipping...')
  }
  
  log('green', '✅ Environment validation completed')
}

async function runTypeCheck() {
  log('blue', '📝 Running TypeScript type checking...')
  await runCommand('npm', ['run', 'type-check'])
  log('green', '✅ Type checking passed')
}

async function runLinting() {
  log('blue', '🔍 Running ESLint...')
  await runCommand('npm', ['run', 'lint'])
  log('green', '✅ Linting passed')
}

async function buildApplication() {
  log('blue', '🏗️  Building application...')
  
  // Set NODE_ENV to production for the build
  const env = { ...process.env, NODE_ENV: 'production' }
  await runCommand('npm', ['run', 'build'], { env })
  
  log('green', '✅ Build completed successfully')
}

async function analyzeBuildOutput() {
  log('blue', '📊 Analyzing build output...')
  
  const buildDir = '.next'
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found')
  }
  
  // Check for critical files
  const criticalFiles = [
    '.next/static',
    '.next/server',
    '.next/BUILD_ID'
  ]
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Critical build file missing: ${file}`)
    }
  }
  
  // Check build size (basic check)
  const staticDir = '.next/static'
  if (fs.existsSync(staticDir)) {
    const stats = fs.statSync(staticDir)
    log('blue', `📦 Static assets directory size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  }
  
  log('green', '✅ Build output analysis completed')
}

async function testProductionServer() {
  log('blue', '🚀 Testing production server...')
  
  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production', PORT: '3001' }
    })
    
    let serverReady = false
    let timeout
    
    server.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready') || output.includes('started server')) {
        serverReady = true
        log('green', '✅ Production server started successfully')
        
        // Test basic endpoints
        setTimeout(async () => {
          try {
            // Test health endpoint
            const response = await fetch('http://localhost:3001/api/health')
            if (response.ok) {
              log('green', '✅ Health endpoint responding')
            } else {
              log('yellow', '⚠️  Health endpoint returned non-200 status')
            }
          } catch (error) {
            log('yellow', '⚠️  Could not test health endpoint')
          }
          
          server.kill()
          clearTimeout(timeout)
          resolve()
        }, 2000)
      }
    })
    
    server.stderr.on('data', (data) => {
      const error = data.toString()
      if (error.includes('Error') || error.includes('error')) {
        log('red', `❌ Server error: ${error}`)
      }
    })
    
    server.on('close', (code) => {
      clearTimeout(timeout)
      if (!serverReady) {
        reject(new Error(`Server failed to start (exit code: ${code})`))
      }
    })
    
    // Timeout after 30 seconds
    timeout = setTimeout(() => {
      server.kill()
      reject(new Error('Server start timeout'))
    }, 30000)
  })
}

async function runSecurityChecks() {
  log('blue', '🔒 Running security checks...')
  
  // Check for sensitive files that shouldn't be in production
  const sensitiveFiles = [
    '.env.local',
    '.env.development',
    'debug.log',
    'npm-debug.log'
  ]
  
  for (const file of sensitiveFiles) {
    if (fs.existsSync(file)) {
      log('yellow', `⚠️  Sensitive file found: ${file}`)
    }
  }
  
  // Check for debug routes in build
  const serverDir = '.next/server/app'
  if (fs.existsSync(serverDir)) {
    const debugRoutes = ['debug', 'test', 'admin-debug', 'admin-test']
    for (const route of debugRoutes) {
      const routePath = path.join(serverDir, route)
      if (fs.existsSync(routePath)) {
        log('yellow', `⚠️  Debug route found in build: ${route}`)
      }
    }
  }
  
  log('green', '✅ Security checks completed')
}

async function main() {
  console.log('🚀 Starting production build test...')
  console.log('=' .repeat(50))
  
  try {
    await checkPrerequisites()
    await validateEnvironment()
    await runTypeCheck()
    await runLinting()
    await buildApplication()
    await analyzeBuildOutput()
    await testProductionServer()
    await runSecurityChecks()
    
    console.log('=' .repeat(50))
    log('green', '🎉 Production build test completed successfully!')
    log('blue', '✨ Your application is ready for deployment!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Deploy to your hosting platform')
    console.log('2. Run post-deployment verification')
    console.log('3. Monitor application performance')
    
  } catch (error) {
    console.log('=' .repeat(50))
    log('red', `❌ Production build test failed: ${error.message}`)
    console.log('')
    console.log('Please fix the issues above and try again.')
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log('red', `❌ Unhandled error: ${error.message}`)
  process.exit(1)
})

// Run the test
main()
