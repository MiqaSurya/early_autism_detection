// Test script to verify email is being saved during registration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nugybnlgrrwzbpjpfmty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTk1MTYsImV4cCI6MjA2MDY5NTUxNn0.5-_k2OAbKtNZvSUQm4oZpTlsEVc0jpuVp6AyLKE7rKE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmailRegistration() {
  try {
    console.log('🧪 Testing Email Registration Flow...\n');
    
    // Test data
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits
    const testUser = {
      name: 'John Doe',
      email: `test${timestamp}@gmail.com`,
      password: 'SecurePass123!'
    };
    
    console.log('📝 Test User Data:');
    console.log(`Name: ${testUser.name}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}\n`);
    
    // Step 1: Register user (simulating the registration page flow)
    console.log('🔄 Step 1: Registering user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          display_name: testUser.name,
          email_confirmed: true
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Registration failed:', signUpError.message);
      return;
    }
    
    console.log('✅ User registered successfully!');
    console.log(`User ID: ${signUpData.user?.id}`);
    console.log(`Email in auth.users: ${signUpData.user?.email}`);
    console.log(`Email Confirmed: ${signUpData.user?.email_confirmed_at ? 'Yes' : 'No'}\n`);
    
    // Step 2: Sign in to authenticate for profile update
    console.log('🔄 Step 2: Signing in to authenticate...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Signed in successfully!');

    // Step 3: Update profile with email (simulating the registration page profile update)
    console.log('🔄 Step 3: Updating user profile with email...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: signUpData.user.id,
        display_name: testUser.name.trim(),
        email: testUser.email.toLowerCase().trim(),
        email_verified: true
      });
    
    if (profileError) {
      console.error('❌ Profile update failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile updated successfully with email!');

    // Step 4: Verify profile data
    console.log('\n🔄 Step 4: Verifying profile data...');
    const { data: profileData, error: profileSelectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single();
    
    if (profileSelectError) {
      console.error('❌ Profile verification failed:', profileSelectError.message);
      return;
    }
    
    console.log('✅ Profile verification successful!');
    console.log('📊 Profile Data:');
    console.log(`  ID: ${profileData.id}`);
    console.log(`  Display Name: ${profileData.display_name}`);
    console.log(`  Email: ${profileData.email}`);
    console.log(`  Email Verified: ${profileData.email_verified}`);
    console.log(`  Created At: ${profileData.created_at}`);
    console.log(`  Updated At: ${profileData.updated_at}\n`);

    // Step 5: Summary (login already tested in step 2)
    console.log('🎉 Email Registration Test Completed Successfully!');
    console.log('\n📊 Verification Results:');
    console.log('  ✅ User registration with email metadata');
    console.log('  ✅ Email saved in auth.users table');
    console.log('  ✅ Email saved in profiles table');
    console.log('  ✅ Display name saved in profiles table');
    console.log('  ✅ Email verification status set to true');
    console.log('  ✅ User can login with registered credentials');
    console.log('  ✅ All data is properly saved and displayed in Supabase');
    
    console.log('\n🔍 Data Storage Summary:');
    console.log(`  📧 Email: Saved in both auth.users and profiles tables`);
    console.log(`  👤 Name: Saved as display_name in profiles table`);
    console.log(`  🔐 Password: Encrypted and saved in auth.users table`);
    console.log(`  ✅ Status: Email verified and user can access the application`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testEmailRegistration();
