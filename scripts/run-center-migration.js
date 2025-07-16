const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🚀 Running center portal migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '00005_center_portal_separate_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      })
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error)
        console.log('Statement:', statement)
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('🎉 Migration completed!')
    
    // Test the new tables
    console.log('\n🔍 Testing new tables...')
    
    const { data: centerUsers, error: centerUsersError } = await supabase
      .from('center_users')
      .select('count')
      .limit(1)
    
    if (centerUsersError) {
      console.error('❌ center_users table test failed:', centerUsersError)
    } else {
      console.log('✅ center_users table is accessible')
    }
    
    const { data: centerSessions, error: centerSessionsError } = await supabase
      .from('center_sessions')
      .select('count')
      .limit(1)
    
    if (centerSessionsError) {
      console.error('❌ center_sessions table test failed:', centerSessionsError)
    } else {
      console.log('✅ center_sessions table is accessible')
    }
    
    console.log('\n🎯 Center portal database setup complete!')
    console.log('You can now test the registration and login flow.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
