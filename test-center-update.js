// Test script to verify center update duplicate prevention
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCenterUpdateDuplicatePrevention() {
  console.log('🧪 TESTING CENTER UPDATE DUPLICATE PREVENTION');
  console.log('='.repeat(50));

  try {
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current state...');
    
    const { data: centerUsers, error: cuError } = await supabase
      .from('center_users')
      .select('id, email, center_name, address, latitude, longitude')
      .eq('is_active', true)
      .limit(3);

    if (cuError) {
      console.error('❌ Error fetching center users:', cuError);
      return;
    }

    console.log(`✅ Found ${centerUsers.length} active center users`);
    
    if (centerUsers.length === 0) {
      console.log('⚠️ No center users found to test with');
      return;
    }

    // Step 2: Check for existing duplicates
    console.log('\n🔍 Step 2: Checking for existing duplicates...');
    
    const { data: autismCenters, error: acError } = await supabase
      .from('autism_centers')
      .select('id, name, center_user_id')
      .not('center_user_id', 'is', null);

    if (acError) {
      console.error('❌ Error fetching autism centers:', acError);
      return;
    }

    console.log(`📋 Found ${autismCenters.length} autism centers with center_user_id`);

    // Check for duplicates by name
    const centerNames = {};
    autismCenters.forEach(center => {
      if (centerNames[center.name]) {
        centerNames[center.name]++;
      } else {
        centerNames[center.name] = 1;
      }
    });

    const duplicates = Object.entries(centerNames).filter(([name, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️ Found existing duplicates:');
      duplicates.forEach(([name, count]) => {
        console.log(`  - "${name}": ${count} entries`);
      });
    } else {
      console.log('✅ No duplicates found in autism_centers table');
    }

    // Step 3: Test the user locator API to see combined results
    console.log('\n🌐 Step 3: Testing user locator API...');
    
    const response = await fetch('http://localhost:3000/api/autism-centers?lat=3.1390&lng=101.6869&radius=50&limit=50');
    
    if (!response.ok) {
      console.error('❌ User locator API failed:', response.status);
      return;
    }

    const locatorData = await response.json();
    const centers = locatorData.centers || locatorData;
    
    console.log(`📍 User locator returned ${centers.length} centers`);

    // Check for duplicates in locator results
    const locatorNames = {};
    centers.forEach(center => {
      const name = center.name || center.center_name;
      if (locatorNames[name]) {
        locatorNames[name]++;
      } else {
        locatorNames[name] = 1;
      }
    });

    const locatorDuplicates = Object.entries(locatorNames).filter(([name, count]) => count > 1);
    
    if (locatorDuplicates.length > 0) {
      console.log('⚠️ Found duplicates in user locator results:');
      locatorDuplicates.forEach(([name, count]) => {
        console.log(`  - "${name}": ${count} entries`);
      });
    } else {
      console.log('✅ No duplicates found in user locator results');
    }

    // Step 4: Test admin API
    console.log('\n🔧 Step 4: Testing admin API...');
    
    const adminResponse = await fetch('http://localhost:3000/api/admin/autism-centers');
    
    if (!adminResponse.ok) {
      console.error('❌ Admin API failed:', adminResponse.status);
      return;
    }

    const adminData = await adminResponse.json();
    console.log(`🔧 Admin API returned ${adminData.length} centers`);

    // Check for duplicates in admin results
    const adminNames = {};
    adminData.forEach(center => {
      const name = center.name || center.center_name;
      if (adminNames[name]) {
        adminNames[name]++;
      } else {
        adminNames[name] = 1;
      }
    });

    const adminDuplicates = Object.entries(adminNames).filter(([name, count]) => count > 1);
    
    if (adminDuplicates.length > 0) {
      console.log('⚠️ Found duplicates in admin results:');
      adminDuplicates.forEach(([name, count]) => {
        console.log(`  - "${name}": ${count} entries`);
      });
    } else {
      console.log('✅ No duplicates found in admin results');
    }

    console.log('\n📋 SUMMARY:');
    console.log(`- Center users: ${centerUsers.length}`);
    console.log(`- Autism centers with center_user_id: ${autismCenters.length}`);
    console.log(`- User locator results: ${centers.length}`);
    console.log(`- Admin API results: ${adminData.length}`);
    console.log(`- Database duplicates: ${duplicates.length}`);
    console.log(`- Locator duplicates: ${locatorDuplicates.length}`);
    console.log(`- Admin duplicates: ${adminDuplicates.length}`);

    if (duplicates.length > 0 || locatorDuplicates.length > 0 || adminDuplicates.length > 0) {
      console.log('\n❌ DUPLICATE ISSUE CONFIRMED - Fix needed');
    } else {
      console.log('\n✅ NO DUPLICATES FOUND - System working correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCenterUpdateDuplicatePrevention();
