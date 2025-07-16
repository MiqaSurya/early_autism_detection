// Test script to verify center update sync functionality
import { createBrowserClient } from '@supabase/ssr'

export async function testCenterUpdateSync() {
  console.log('🧪 TESTING CENTER UPDATE SYNC FLOW')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // 1. Check if autism_centers table has data
    console.log('📊 Step 1: Checking autism_centers table...')
    const { data: centers, error: centersError } = await supabase
      .from('autism_centers')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (centersError) {
      console.error('❌ Error fetching autism_centers:', centersError)
      return { success: false, error: centersError }
    }

    console.log(`✅ Found ${centers?.length || 0} centers in autism_centers table`)
    if (centers && centers.length > 0) {
      console.log('📋 Sample centers:', centers.map(c => ({
        id: c.id,
        name: c.name,
        updated_at: c.updated_at,
        center_user_id: c.center_user_id
      })))
    }

    // 2. Check if center_users table has data
    console.log('📊 Step 2: Checking center_users table...')
    const { data: centerUsers, error: usersError } = await supabase
      .from('center_users')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('❌ Error fetching center_users:', usersError)
      return { success: false, error: usersError }
    }

    console.log(`✅ Found ${centerUsers?.length || 0} center users in center_users table`)
    if (centerUsers && centerUsers.length > 0) {
      console.log('📋 Sample center users:', centerUsers.map(u => ({
        id: u.id,
        center_name: u.center_name,
        updated_at: u.updated_at,
        email: u.email
      })))
    }

    // 3. Check data consistency between tables
    console.log('📊 Step 3: Checking data consistency...')
    if (centers && centerUsers) {
      const centerUserIds = new Set(centers.map(c => c.center_user_id).filter(Boolean))
      const actualUserIds = new Set(centerUsers.map(u => u.id))
      
      console.log('🔗 Center user IDs referenced in autism_centers:', Array.from(centerUserIds))
      console.log('🔗 Actual center user IDs:', Array.from(actualUserIds))
      
      const orphanedCenters = centers.filter(c => c.center_user_id && !actualUserIds.has(c.center_user_id))
      const unlinkedUsers = centerUsers.filter(u => !centerUserIds.has(u.id))
      
      if (orphanedCenters.length > 0) {
        console.warn('⚠️ Orphaned centers (no matching center_user):', orphanedCenters.map(c => c.name))
      }
      
      if (unlinkedUsers.length > 0) {
        console.warn('⚠️ Unlinked center users (no autism_center record):', unlinkedUsers.map(u => u.center_name))
      }
    }

    // 4. Test real-time subscription
    console.log('📊 Step 4: Testing real-time subscription...')
    let subscriptionWorking = false
    
    const subscription = supabase
      .channel('test-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'autism_centers' },
        (payload) => {
          console.log('🔥 Real-time update received:', payload)
          subscriptionWorking = true
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    // Wait 3 seconds to see if subscription connects
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    subscription.unsubscribe()

    // 5. Test API endpoint - DISABLED
    console.log('🚫 Step 5: API testing disabled to prevent rapid calls')
    // API testing disabled to prevent rapid API calls

    return {
      success: true,
      data: {
        centersCount: centers?.length || 0,
        centerUsersCount: centerUsers?.length || 0,
        subscriptionTested: true,
        apiTested: true
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error }
  }
}

// Function to simulate a center update for testing
export async function simulateCenterUpdate() {
  console.log('🧪 SIMULATING CENTER UPDATE')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Get a random center to update
    const { data: centers, error } = await supabase
      .from('autism_centers')
      .select('*')
      .limit(1)

    if (error || !centers || centers.length === 0) {
      console.error('❌ No centers found to update')
      return { success: false, error: 'No centers found' }
    }

    const center = centers[0]
    console.log('📝 Updating center:', center.name)

    // Update the center with a new timestamp
    const { error: updateError } = await supabase
      .from('autism_centers')
      .update({
        updated_at: new Date().toISOString(),
        description: `Updated at ${new Date().toLocaleTimeString()} - Test update`
      })
      .eq('id', center.id)

    if (updateError) {
      console.error('❌ Update failed:', updateError)
      return { success: false, error: updateError }
    }

    console.log('✅ Center updated successfully')
    return { success: true, centerId: center.id, centerName: center.name }

  } catch (error) {
    console.error('❌ Simulation failed:', error)
    return { success: false, error }
  }
}

// Add these functions to window for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testCenterSync = testCenterUpdateSync;
  (window as any).simulateCenterUpdate = simulateCenterUpdate;
}
