import { NextRequest, NextResponse } from 'next/server'
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

// GET - Fetch all questionnaire questions
export async function GET() {
  try {
    console.log('📋 Admin API: Fetching questionnaire questions')

    const { data, error } = await supabaseAdmin
      .from('questionnaire_questions')
      .select('*')
      .order('question_number', { ascending: true })

    if (error) {
      console.error('❌ Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions', details: error }, { status: 500 })
    }

    console.log(`✅ Fetched ${data?.length || 0} questions`)

    return NextResponse.json({
      success: true,
      questions: data || []
    })

  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new questionnaire question
export async function POST(request: NextRequest) {
  try {
    console.log('➕ Admin API: Adding new questionnaire question')
    
    const questionData = await request.json()
    
    // Validate required fields
    if (!questionData.text || !questionData.category || !questionData.riskAnswer) {
      return NextResponse.json({ 
        error: 'Missing required fields: text, category, riskAnswer' 
      }, { status: 400 })
    }

    // Validate category
    if (!['social_communication', 'behavior_sensory'].includes(questionData.category)) {
      return NextResponse.json({ 
        error: 'Invalid category. Must be social_communication or behavior_sensory' 
      }, { status: 400 })
    }

    // Validate risk answer
    if (!['yes', 'no'].includes(questionData.riskAnswer)) {
      return NextResponse.json({ 
        error: 'Invalid riskAnswer. Must be yes or no' 
      }, { status: 400 })
    }

    // Get the next question number
    const { data: existingQuestions, error: countError } = await supabaseAdmin
      .from('questionnaire_questions')
      .select('question_number')
      .order('question_number', { ascending: false })
      .limit(1)

    if (countError && countError.code !== 'PGRST116') {
      console.error('Error getting question count:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const nextQuestionNumber = existingQuestions && existingQuestions.length > 0
      ? existingQuestions[0].question_number + 1
      : 1

    const newQuestion = {
      question_number: nextQuestionNumber,
      text: questionData.text,
      category: questionData.category,
      risk_answer: questionData.riskAnswer,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Admin API: Insert data:', newQuestion)

    const { data, error } = await supabaseAdmin
      .from('questionnaire_questions')
      .insert([newQuestion])
      .select()
      .single()

    if (error) {
      console.error('❌ Error adding question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Question added successfully:', data)

    const question = {
      id: data.id,
      questionNumber: data.question_number,
      text: data.text,
      category: data.category,
      riskAnswer: data.risk_answer,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json({
      success: true,
      question
    })

  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update existing questionnaire question
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Admin API: Updating questionnaire question')
    
    const { questionId, updates } = await request.json()

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    // Validate category if provided
    if (updates.category && !['social_communication', 'behavior_sensory'].includes(updates.category)) {
      return NextResponse.json({ 
        error: 'Invalid category. Must be social_communication or behavior_sensory' 
      }, { status: 400 })
    }

    // Validate risk answer if provided
    if (updates.riskAnswer && !['yes', 'no'].includes(updates.riskAnswer)) {
      return NextResponse.json({ 
        error: 'Invalid riskAnswer. Must be yes or no' 
      }, { status: 400 })
    }

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.text !== undefined) dbUpdates.text = updates.text
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.riskAnswer !== undefined) dbUpdates.risk_answer = updates.riskAnswer
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

    console.log(`🔄 Admin API: Updating question ${questionId}:`, dbUpdates)

    const { data, error } = await supabaseAdmin
      .from('questionnaire_questions')
      .update(dbUpdates)
      .eq('id', questionId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question', details: error }, { status: 500 })
    }

    console.log('✅ Question updated successfully:', data)

    const question = {
      id: data.id,
      questionNumber: data.question_number,
      text: data.text,
      category: data.category,
      riskAnswer: data.risk_answer,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json({
      success: true,
      question
    })

  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete questionnaire question
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    console.log(`🗑️ Admin API: Deleting question ${questionId}`)

    const { error } = await supabaseAdmin
      .from('questionnaire_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('❌ Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question', details: error }, { status: 500 })
    }

    console.log('✅ Question deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    })

  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
