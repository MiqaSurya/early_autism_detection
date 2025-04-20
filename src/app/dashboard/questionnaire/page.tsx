import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function QuestionnairePage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get user's previous questionnaires
  const { data: previousQuestionnaires } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Early Signs Questionnaire</h1>
        <Link href="/dashboard/questionnaire/new" className="btn-primary">
          Start New Assessment
        </Link>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">About the Assessment</h2>
        <p className="text-neutral-600 mb-4">
          This questionnaire is designed to help identify potential early signs of autism
          in children aged 18 months to 5 years. It takes approximately 15-20 minutes
          to complete and consists of questions about your child&apos;s behavior and development.
        </p>
        <div className="bg-primary/10 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Important Note:</h3>
          <p className="text-sm text-neutral-700">
            This assessment is not a diagnosis. It is a screening tool designed to help
            identify children who may benefit from a more comprehensive evaluation by
            healthcare professionals.
          </p>
        </div>
      </div>

      {previousQuestionnaires && previousQuestionnaires.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Previous Assessments</h2>
          <div className="space-y-4">
            {previousQuestionnaires.map((questionnaire) => (
              <div
                key={questionnaire.id}
                className="card flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    Assessment on {new Date(questionnaire.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-neutral-600">
                    Risk Level: {questionnaire.risk_level}
                  </p>
                </div>
                <Link
                  href={`/dashboard/questionnaire/${questionnaire.id}`}
                  className="text-primary hover:text-primary/90"
                >
                  View Results →
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card bg-neutral-50">
          <p className="text-center text-neutral-600">
            No previous assessments found. Start your first assessment to track your results.
          </p>
        </div>
      )}
    </div>
  )
}
