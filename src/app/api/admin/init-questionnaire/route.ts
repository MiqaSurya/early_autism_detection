import { NextResponse } from 'next/server'
import { createQuestionnaireTable, initializeDefaultQuestions } from '@/lib/admin-db'

export async function POST() {
  try {
    console.log('🚀 Initializing questionnaire system...')

    // First try to create the table
    const createResult = await createQuestionnaireTable()
    
    if (!createResult.success) {
      console.log('⚠️ Table creation failed, but continuing with initialization...')
    }

    // Then initialize with default questions
    const initResult = await initializeDefaultQuestions()

    return NextResponse.json({
      success: initResult.success,
      message: initResult.success 
        ? 'Questionnaire system initialized successfully'
        : 'Failed to initialize questionnaire system',
      details: {
        tableCreation: createResult,
        questionInitialization: initResult
      }
    })

  } catch (error) {
    console.error('Error initializing questionnaire system:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize questionnaire system',
        details: error 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to initialize the questionnaire system',
    instructions: [
      '1. This endpoint will create the questionnaire_questions table if it doesn\'t exist',
      '2. It will then populate it with the default 20 M-CHAT-R questions',
      '3. If the table already exists with questions, it will skip initialization',
      '4. Use POST method to trigger the initialization'
    ]
  })
}
