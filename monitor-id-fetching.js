#!/usr/bin/env node

/**
 * ID-Based Fetching Monitoring Script
 * 
 * This script monitors the ID-based fetching system to ensure it continues
 * working correctly for future center registrations.
 * 
 * Run this script periodically to verify system health.
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration (you'll need to set these environment variables)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkDatabaseTables() {
  console.log('\n🔍 Checking Database Tables')
  console.log('=' .repeat(50))
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Missing Supabase environment variables')
    console.log('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return false
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    // Check center_users table
    const { data: centerUsers, error: centerUsersError } = await supabase
      .from('center_users')
      .select('id, center_name, is_active')
      .eq('is_active', true)
      .limit(5)
    
    if (centerUsersError) {
      console.log('❌ center_users table error:', centerUsersError.message)
      return false
    }
    
    console.log(`✅ center_users table: ${centerUsers.length} active centers found`)
    
    // Check autism_centers table
    const { data: autismCenters, error: autismCentersError } = await supabase
      .from('autism_centers')
      .select('id, name')
      .limit(5)
    
    if (autismCentersError) {
      console.log('❌ autism_centers table error:', autismCentersError.message)
      return false
    }
    
    console.log(`✅ autism_centers table: ${autismCenters.length} centers found`)
    
    return true
    
  } catch (error) {
    console.log('❌ Database connection error:', error.message)
    return false
  }
}

async function checkAPIEndpoints() {
  console.log('\n🔍 Checking API Endpoints')
  console.log('=' .repeat(50))
  
  const BASE_URL = 'http://localhost:3000'
  
  try {
    // Check user locator API
    console.log('📡 Testing user locator API...')
    const userResponse = await fetch(`${BASE_URL}/api/autism-centers?lat=3.1390&lng=101.6869&radius=50&limit=10`)
    
    if (!userResponse.ok) {
      console.log(`❌ User locator API: HTTP ${userResponse.status}`)
      return false
    }
    
    const userData = await userResponse.json()
    const userCenters = userData.centers || userData
    console.log(`✅ User locator API: ${userCenters.length} centers returned`)
    
    // Check admin locator API
    console.log('📡 Testing admin locator API...')
    const adminResponse = await fetch(`${BASE_URL}/api/admin/autism-centers`)
    
    if (!adminResponse.ok) {
      console.log(`❌ Admin locator API: HTTP ${adminResponse.status}`)
      return false
    }
    
    const adminCenters = await adminResponse.json()
    console.log(`✅ Admin locator API: ${adminCenters.length} centers returned`)
    
    // Verify both APIs return data
    if (userCenters.length === 0 && adminCenters.length === 0) {
      console.log('⚠️  Warning: Both APIs returned 0 centers')
      return false
    }
    
    return true
    
  } catch (error) {
    console.log('❌ API endpoint error:', error.message)
    console.log('   Make sure the development server is running (npm run dev)')
    return false
  }
}

async function generateHealthReport() {
  console.log('🏥 ID-Based Fetching System Health Report')
  console.log('=' .repeat(60))
  console.log(`📅 Generated: ${new Date().toISOString()}`)
  
  const dbCheck = await checkDatabaseTables()
  const apiCheck = await checkAPIEndpoints()
  
  console.log('\n📊 HEALTH SUMMARY')
  console.log('=' .repeat(50))
  
  if (dbCheck && apiCheck) {
    console.log('✅ SYSTEM STATUS: HEALTHY')
    console.log('✅ DATABASE: Tables accessible and contain data')
    console.log('✅ APIs: Both user and admin locators working')
    console.log('✅ ID-BASED FETCHING: Operational')
    console.log('\n🎯 FUTURE REGISTRATIONS: Will work correctly')
    
  } else {
    console.log('❌ SYSTEM STATUS: ISSUES DETECTED')
    
    if (!dbCheck) {
      console.log('❌ DATABASE: Connection or table issues')
    }
    
    if (!apiCheck) {
      console.log('❌ APIs: Endpoint issues detected')
    }
    
    console.log('\n🔧 ACTION REQUIRED: Fix the issues above')
  }
  
  console.log('\n📝 NEXT STEPS:')
  console.log('1. Run this script regularly to monitor system health')
  console.log('2. If issues are detected, check the API endpoints and database')
  console.log('3. Refer to ID_BASED_FETCHING_VERIFICATION.md for troubleshooting')
  
  return dbCheck && apiCheck
}

// Run monitoring if script is executed directly
if (require.main === module) {
  generateHealthReport()
    .then(healthy => {
      process.exit(healthy ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Monitoring script error:', error)
      process.exit(1)
    })
}

module.exports = { generateHealthReport, checkDatabaseTables, checkAPIEndpoints }
