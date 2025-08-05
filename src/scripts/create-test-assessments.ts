import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestAssessments() {
  try {
    console.log('🔍 Creating test assessments...')

    // First, get some existing children to create assessments for
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, parent_id')
      .limit(5)

    if (childrenError) {
      console.error('Error fetching children:', childrenError)
      return
    }

    if (!children || children.length === 0) {
      console.log('❌ No children found in database. Please create some children first.')
      return
    }

    console.log(`👶 Found ${children.length} children to create assessments for`)

    // Create test assessments for each child
    const testAssessments = children.map((child, index) => {
      const baseDate = new Date()
      baseDate.setDate(baseDate.getDate() - (index * 7)) // Space assessments 1 week apart

      // Generate realistic M-CHAT-R responses (20 questions)
      const responses = Array.from({ length: 20 }, (_, i) => {
        // Some questions should be more likely to be "concerning" for variety
        const concerningQuestions = [1, 2, 5, 7, 9, 13, 15, 18] // These are typically key questions
        const isConcerning = concerningQuestions.includes(i + 1)
        
        // Generate responses: 0 = No concern, 1 = Some concern, 2 = High concern
        if (index === 0) {
          // First child: Low risk (mostly 0s)
          return Math.random() < 0.1 ? 1 : 0
        } else if (index === 1) {
          // Second child: Medium risk (mix of 0s and 1s)
          return Math.random() < 0.3 ? (Math.random() < 0.7 ? 1 : 2) : 0
        } else {
          // Other children: High risk (more 1s and 2s)
          return Math.random() < 0.6 ? (Math.random() < 0.5 ? 1 : 2) : 0
        }
      })

      // Calculate score (sum of all responses)
      const score = responses.reduce((sum, response) => sum + response, 0)
      
      // Determine risk level based on M-CHAT-R scoring
      let riskLevel: 'low' | 'medium' | 'high'
      let notes: string
      
      if (score <= 2) {
        riskLevel = 'low'
        notes = 'Low risk for autism spectrum disorder. Continue regular developmental monitoring.'
      } else if (score <= 7) {
        riskLevel = 'medium'
        notes = 'Medium risk detected. Consider follow-up assessment with healthcare provider.'
      } else {
        riskLevel = 'high'
        notes = 'High risk for autism spectrum disorder. Recommend immediate consultation with pediatric specialist and consider using the autism center locator to find nearby diagnostic services.'
      }

      return {
        child_id: child.id,
        status: 'completed',
        score,
        risk_level: riskLevel,
        started_at: baseDate.toISOString(),
        completed_at: new Date(baseDate.getTime() + (15 * 60 * 1000)).toISOString(), // 15 minutes later
        responses: JSON.stringify(responses),
        notes
      }
    })

    console.log('📊 Test assessments to create:', testAssessments.map(a => ({
      child_id: a.child_id,
      score: a.score,
      risk_level: a.risk_level
    })))

    // Insert the test assessments
    const { data: insertedAssessments, error: insertError } = await supabase
      .from('assessments')
      .insert(testAssessments)
      .select()

    if (insertError) {
      console.error('❌ Error inserting test assessments:', insertError)
      return
    }

    console.log(`✅ Successfully created ${insertedAssessments?.length || 0} test assessments!`)
    
    // Show summary
    const summary = testAssessments.reduce((acc, assessment) => {
      acc[assessment.risk_level] = (acc[assessment.risk_level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('📈 Assessment summary:', summary)
    console.log('🎉 Test assessments created successfully! You can now view them in the admin panel.')

  } catch (error) {
    console.error('❌ Error creating test assessments:', error)
  }
}

// Run the script
createTestAssessments()
