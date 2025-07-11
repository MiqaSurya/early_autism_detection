import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function ensureTablesExist() {
  try {
    console.log('Checking if database tables exist...')

    // Check if assessments table exists by trying to query it
    const { data, error } = await supabase
      .from('assessments')
      .select('id')
      .limit(1)

    if (error && error.message.includes('relation "assessments" does not exist')) {
      console.log('Assessments table does not exist')
      return { success: false, error: 'Database tables not set up. Please run the SQL setup script.' }
    }

    console.log('Database tables exist')
    return { success: true }
  } catch (error) {
    console.error('Error checking database tables:', error)
    return { success: false, error: 'Failed to check database setup' }
  }
}

export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...')

    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Database connection test failed:', error)
      return { success: false, error: error.message }
    }

    console.log('Database connection successful')
    return { success: true, data }
  } catch (error) {
    console.error('Error testing database connection:', error)
    return { success: false, error: 'Failed to connect to database' }
  }
}

export async function createAssessmentWithRetry(assessmentData: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to save assessment...`)

      const { data, error } = await supabase
        .from('assessments')
        .insert([assessmentData])
        .select()

      if (error) {
        console.error(`Attempt ${attempt} failed:`, error)
        
        if (attempt === maxRetries) {
          return { success: false, error: error.message, data: null }
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }

      console.log(`Assessment saved successfully on attempt ${attempt}:`, data)
      return { success: true, error: null, data }
    } catch (error) {
      console.error(`Attempt ${attempt} threw error:`, error)
      
      if (attempt === maxRetries) {
        return { success: false, error: 'Failed to save assessment after multiple attempts', data: null }
      }
    }
  }

  return { success: false, error: 'Unexpected error in retry logic', data: null }
}
