import { supabase } from './supabase'

// Initialize questionnaire_questions table and default questions
export async function initializeQuestionnaireDatabase() {
  try {
    console.log('Initializing questionnaire database...')

    // Check if table exists by trying to select from it
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questionnaire_questions')
      .select('id')
      .limit(1)

    if (checkError) {
      if (checkError.code === 'PGRST116' || checkError.message.includes('does not exist')) {
        console.log('Table does not exist. Please create it manually in Supabase SQL Editor.')
        console.log('Run the SQL script from: sql/create_questionnaire_questions.sql')
        return { success: false, error: 'Table does not exist. Please create it manually.' }
      } else {
        console.error('Error checking table:', checkError)
        return { success: false, error: checkError.message }
      }
    }

    // If we get here, table exists. Check if it has data
    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist in database')
      return { success: true, message: 'Questions already initialized' }
    }

    // Insert default M-CHAT-R questions
    const defaultQuestions = [
      { question_number: 1, text: "If you point at something across the room, does your child look at it?", category: "social_communication", risk_answer: "no" },
      { question_number: 2, text: "Have you ever wondered if your child is deaf?", category: "behavior_sensory", risk_answer: "yes" },
      { question_number: 3, text: "Does your child play pretend or make-believe?", category: "social_communication", risk_answer: "no" },
      { question_number: 4, text: "Does your child like climbing on things?", category: "behavior_sensory", risk_answer: "no" },
      { question_number: 5, text: "Does your child make unusual finger movements near his or her eyes?", category: "behavior_sensory", risk_answer: "yes" },
      { question_number: 6, text: "Does your child point with one finger to ask for something or to get help?", category: "social_communication", risk_answer: "no" },
      { question_number: 7, text: "Does your child point with one finger to show you something interesting?", category: "social_communication", risk_answer: "no" },
      { question_number: 8, text: "Is your child interested in other children?", category: "social_communication", risk_answer: "no" },
      { question_number: 9, text: "Does your child show you things by bringing them to you or holding them up for you to see?", category: "social_communication", risk_answer: "no" },
      { question_number: 10, text: "Does your child respond when you call his or her name?", category: "social_communication", risk_answer: "no" },
      { question_number: 11, text: "When you smile at your child, does he or she smile back at you?", category: "social_communication", risk_answer: "no" },
      { question_number: 12, text: "Does your child get upset by everyday noises?", category: "behavior_sensory", risk_answer: "yes" },
      { question_number: 13, text: "Does your child walk?", category: "behavior_sensory", risk_answer: "no" },
      { question_number: 14, text: "Does your child look you in the eye when you are talking to him or her?", category: "social_communication", risk_answer: "no" },
      { question_number: 15, text: "Does your child try to copy what you do?", category: "social_communication", risk_answer: "no" },
      { question_number: 16, text: "If you turn your head to look at something, does your child look around to see what you are looking at?", category: "social_communication", risk_answer: "no" },
      { question_number: 17, text: "Does your child try to get you to watch him or her?", category: "social_communication", risk_answer: "no" },
      { question_number: 18, text: "Does your child understand when you tell him or her to do something?", category: "social_communication", risk_answer: "no" },
      { question_number: 19, text: "If something new happens, does your child look at your face to see how you feel about it?", category: "social_communication", risk_answer: "no" },
      { question_number: 20, text: "Does your child like movement activities?", category: "behavior_sensory", risk_answer: "no" }
    ]

    const questionsToInsert = defaultQuestions.map(q => ({
      ...q,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('questionnaire_questions')
      .insert(questionsToInsert)

    if (insertError) {
      console.error('Error inserting default questions:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log('Successfully initialized questionnaire database with default M-CHAT-R questions')
    return { success: true, message: 'Database initialized successfully' }

  } catch (error) {
    console.error('Error initializing questionnaire database:', error)
    return { success: false, error: 'Failed to initialize database' }
  }
}

// Function to manually trigger initialization (for testing)
export async function manualInitializeQuestionnaire() {
  const result = await initializeQuestionnaireDatabase()
  console.log('Initialization result:', result)
  return result
}
