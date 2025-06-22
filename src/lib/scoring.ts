import { Question, ScoringRange, SCORING_RANGES } from '@/types/questions'

export type Answer = {
  question_id: number
  answer: 'yes' | 'no'
}

// M-CHAT-R Scoring Algorithm
export function calculateScore(questions: Question[], answers: Answer[]): number {
  let riskScore = 0

  // Items 2, 5, 12 are risk if response is YES
  const riskIfYes = [2, 5, 12]

  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.question_id)
    if (!question) return

    if (riskIfYes.includes(question.id)) {
      // Risk if YES for items 2, 5, 12
      if (answer.answer === 'yes') riskScore += 1
    } else {
      // Risk if NO for all other items
      if (answer.answer === 'no') riskScore += 1
    }
  })

  return riskScore
}

export function getScoringRange(score: number): ScoringRange {
  return SCORING_RANGES.find(
    range => score >= range.min_score && score <= range.max_score
  ) || SCORING_RANGES[SCORING_RANGES.length - 1] // Default to high risk if no range found
}

export function getScorePercentage(score: number): number {
  const maxScore = 20 // Maximum possible score for M-CHAT-R
  return (score / maxScore) * 100
}
