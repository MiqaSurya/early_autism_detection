const { createClient } = require('@supabase/supabase-js')

// Use service role client to execute SQL commands
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for questionnaire_questions table...')

  try {
    // First, disable RLS temporarily
    console.log('1. Disabling RLS...')
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.questionnaire_questions DISABLE ROW LEVEL SECURITY;'
    })

    // Drop existing policies
    console.log('2. Dropping existing policies...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.questionnaire_questions;',
      'DROP POLICY IF EXISTS "Allow read access for all users" ON public.questionnaire_questions;',
      'DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.questionnaire_questions;',
      'DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.questionnaire_questions;',
      'DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.questionnaire_questions;',
      'DROP POLICY IF EXISTS "Service role full access" ON public.questionnaire_questions;'
    ]

    for (const sql of dropPolicies) {
      await supabaseAdmin.rpc('exec_sql', { sql })
    }

    // Re-enable RLS
    console.log('3. Re-enabling RLS...')
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;'
    })

    // Create new policies
    console.log('4. Creating new policies...')
    const newPolicies = [
      'CREATE POLICY "Public read access" ON public.questionnaire_questions FOR SELECT USING (true);',
      'CREATE POLICY "Service role full access" ON public.questionnaire_questions FOR ALL USING (auth.role() = \'service_role\');',
      'CREATE POLICY "Authenticated users can read" ON public.questionnaire_questions FOR SELECT TO authenticated USING (true);'
    ]

    for (const sql of newPolicies) {
      await supabaseAdmin.rpc('exec_sql', { sql })
    }

    // Grant permissions
    console.log('5. Granting permissions...')
    const grants = [
      'GRANT SELECT ON public.questionnaire_questions TO anon;',
      'GRANT SELECT ON public.questionnaire_questions TO authenticated;',
      'GRANT ALL ON public.questionnaire_questions TO service_role;'
    ]

    for (const sql of grants) {
      await supabaseAdmin.rpc('exec_sql', { sql })
    }

    console.log('✅ RLS policies fixed successfully!')

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    
    // Try alternative approach - just create the policies without dropping
    console.log('🔄 Trying alternative approach...')
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          -- Enable RLS
          ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
          
          -- Create policies (ignore if they already exist)
          DO $$ 
          BEGIN
            -- Public read access
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questionnaire_questions' AND policyname = 'Public read access') THEN
              CREATE POLICY "Public read access" ON public.questionnaire_questions FOR SELECT USING (true);
            END IF;
            
            -- Service role full access
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questionnaire_questions' AND policyname = 'Service role full access') THEN
              CREATE POLICY "Service role full access" ON public.questionnaire_questions FOR ALL USING (auth.role() = 'service_role');
            END IF;
            
            -- Authenticated users can read
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questionnaire_questions' AND policyname = 'Authenticated users can read') THEN
              CREATE POLICY "Authenticated users can read" ON public.questionnaire_questions FOR SELECT TO authenticated USING (true);
            END IF;
          END $$;
          
          -- Grant permissions
          GRANT SELECT ON public.questionnaire_questions TO anon;
          GRANT SELECT ON public.questionnaire_questions TO authenticated;
          GRANT ALL ON public.questionnaire_questions TO service_role;
        `
      })
      console.log('✅ Alternative approach succeeded!')
    } catch (altError) {
      console.error('❌ Alternative approach also failed:', altError)
    }
  }
}

// Run the fix
fixRLSPolicies().then(() => {
  console.log('🏁 Script completed')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
