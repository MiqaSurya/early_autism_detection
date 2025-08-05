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

export async function GET() {
  try {
    console.log('🧪 Testing RLS policies...')

    // Test 1: Try to read from questionnaire_questions table
    console.log('Test 1: Reading from questionnaire_questions table...')
    const { data: questions, error: readError } = await supabaseAdmin
      .from('questionnaire_questions')
      .select('*')
      .limit(5)

    if (readError) {
      console.error('❌ Read test failed:', readError)
    } else {
      console.log(`✅ Read test passed: Found ${questions?.length || 0} questions`)
    }

    // Test 2: Try to insert a test question
    console.log('Test 2: Inserting test question...')
    const testQuestion = {
      question_number: 999,
      text: 'Test question - please delete',
      category: 'social_communication',
      risk_answer: 'no',
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('questionnaire_questions')
      .insert([testQuestion])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Insert test failed:', insertError)
    } else {
      console.log('✅ Insert test passed:', insertData)

      // Clean up - delete the test question
      const { error: deleteError } = await supabaseAdmin
        .from('questionnaire_questions')
        .delete()
        .eq('id', insertData.id)

      if (deleteError) {
        console.error('⚠️ Cleanup failed:', deleteError)
      } else {
        console.log('🧹 Test question cleaned up')
      }
    }

    return NextResponse.json({
      success: true,
      tests: {
        read: {
          success: !readError,
          error: readError?.message,
          count: questions?.length || 0
        },
        insert: {
          success: !insertError,
          error: insertError?.message,
          data: insertData
        }
      }
    })

  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error
    }, { status: 500 })
  }
}
