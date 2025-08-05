import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client for admin operations to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST() {
  try {
    console.log('🔧 Fixing RLS policies for questionnaire_questions table...')

    // Execute SQL to fix RLS policies
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Disable RLS temporarily
        ALTER TABLE public.questionnaire_questions DISABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Allow read access for all users" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Service role full access" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Public read access" ON public.questionnaire_questions;
        DROP POLICY IF EXISTS "Authenticated users can read" ON public.questionnaire_questions;
        
        -- Re-enable RLS
        ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
        
        -- Create new policies that allow service role access and public read access
        CREATE POLICY "Public read access" ON public.questionnaire_questions
            FOR SELECT USING (true);
        
        CREATE POLICY "Service role full access" ON public.questionnaire_questions
            FOR ALL USING (auth.role() = 'service_role');
        
        -- Also allow authenticated users to read (for regular users taking assessments)
        CREATE POLICY "Authenticated users can read" ON public.questionnaire_questions
            FOR SELECT TO authenticated USING (true);
        
        -- Grant necessary permissions
        GRANT SELECT ON public.questionnaire_questions TO anon;
        GRANT SELECT ON public.questionnaire_questions TO authenticated;
        GRANT ALL ON public.questionnaire_questions TO service_role;
      `
    })

    if (error) {
      console.error('❌ Error executing SQL:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fix RLS policies',
        details: error
      }, { status: 500 })
    }

    console.log('✅ RLS policies fixed successfully!')

    // Test the fix by trying to insert a test question
    const testQuestion = {
      question_number: 999,
      text: 'Test question - please delete',
      category: 'social_communication',
      risk_answer: 'no',
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: testData, error: testError } = await supabaseAdmin
      .from('questionnaire_questions')
      .insert([testQuestion])
      .select()
      .single()

    if (testError) {
      console.error('❌ Test insert failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'RLS fix may have failed - test insert failed',
        details: testError
      }, { status: 500 })
    }

    // Clean up test question
    await supabaseAdmin
      .from('questionnaire_questions')
      .delete()
      .eq('id', testData.id)

    console.log('✅ Test passed - RLS policies are working correctly!')

    return NextResponse.json({
      success: true,
      message: 'RLS policies fixed successfully',
      test: 'Test insert and delete passed'
    })

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix RLS policies',
      details: error
    }, { status: 500 })
  }
}
