export type AgeGroup = '0-3' | '4-7' | '8-12' | '13-18'

export type Question = {
  id: number
  text: string
  age_group: AgeGroup
  is_reverse_scored: boolean
}

export type ScoringRange = {
  min_score: number
  max_score: number
  percentage_range: string
  risk_category: 'Low Risk' | 'Medium Risk' | 'High Risk'
  interpretation: string
}

export const SCORING_RANGES: ScoringRange[] = [
  {
    min_score: 0,
    max_score: 2,
    percentage_range: '0-10%',
    risk_category: 'Low Risk',
    interpretation: 'No action needed (rescreen after 24 months if <24 months old)'
  },
  {
    min_score: 3,
    max_score: 7,
    percentage_range: '15-35%',
    risk_category: 'Medium Risk',
    interpretation: 'Administer M-CHAT-R Follow-Up interview'
  },
  {
    min_score: 8,
    max_score: 20,
    percentage_range: '40-100%',
    risk_category: 'High Risk',
    interpretation: 'Immediate referral for autism evaluation and early intervention'
  }
]

// M-CHAT-R Risk Questions
// Items 2, 5, 12 are risk if response is YES
// All other items are risk if response is NO
export const MCHAT_RISK_IF_YES = new Set([2, 5, 12])

export const QUESTIONS: Question[] = [
  // Ages 0-3
  { id: 1, text: 'Does your child respond to their name?', age_group: '0-3', is_reverse_scored: false },
  { id: 2, text: 'Does your child make eye contact?', age_group: '0-3', is_reverse_scored: false },
  { id: 3, text: 'Does your child point to objects to show interest?', age_group: '0-3', is_reverse_scored: false },
  { id: 4, text: 'Does your child wave goodbye or use other gestures?', age_group: '0-3', is_reverse_scored: false },
  { id: 5, text: 'Does your child smile back when smiled at?', age_group: '0-3', is_reverse_scored: false },
  { id: 6, text: 'Does your child enjoy playing social games (peek-a-boo, etc.)?', age_group: '0-3', is_reverse_scored: false },
  { id: 7, text: 'Does your child avoid looking at people\'s faces?', age_group: '0-3', is_reverse_scored: true },
  { id: 8, text: 'Does your child show interest in other children?', age_group: '0-3', is_reverse_scored: false },
  { id: 9, text: 'Does your child imitate others (e.g., sounds, actions)?', age_group: '0-3', is_reverse_scored: false },
  { id: 10, text: 'Does your child bring objects to share with you?', age_group: '0-3', is_reverse_scored: false },

  // Ages 4-7
  { id: 11, text: 'Does your child struggle with making friends?', age_group: '4-7', is_reverse_scored: true },
  { id: 12, text: 'Does your child repeat the same phrases or questions over and over?', age_group: '4-7', is_reverse_scored: true },
  { id: 13, text: 'Does your child engage in pretend play (e.g., pretending to cook)?', age_group: '4-7', is_reverse_scored: false },
  { id: 14, text: 'Does your child become very upset when routines change?', age_group: '4-7', is_reverse_scored: true },
  { id: 15, text: 'Does your child focus intensely on a specific topic or object?', age_group: '4-7', is_reverse_scored: true },
  { id: 16, text: 'Does your child avoid eye contact during conversation?', age_group: '4-7', is_reverse_scored: true },
  { id: 17, text: 'Does your child speak in a flat or unusual tone?', age_group: '4-7', is_reverse_scored: true },
  { id: 18, text: 'Does your child flap hands, rock, or spin frequently?', age_group: '4-7', is_reverse_scored: true },
  { id: 19, text: 'Does your child have sensory issues (e.g., dislikes certain textures)?', age_group: '4-7', is_reverse_scored: true },
  { id: 20, text: 'Does your child ask questions to gain information (not just repeating)?', age_group: '4-7', is_reverse_scored: false },

  // Ages 8-12
  { id: 21, text: 'Does your child struggle to understand jokes or sarcasm?', age_group: '8-12', is_reverse_scored: true },
  { id: 22, text: 'Does your child have difficulty understanding others\' feelings?', age_group: '8-12', is_reverse_scored: true },
  { id: 23, text: 'Does your child prefer to play alone rather than with peers?', age_group: '8-12', is_reverse_scored: true },
  { id: 24, text: 'Does your child take things literally (e.g., not understand figurative language)?', age_group: '8-12', is_reverse_scored: true },
  { id: 25, text: 'Does your child fixate on specific interests and talk about them excessively?', age_group: '8-12', is_reverse_scored: true },
  { id: 26, text: 'Does your child have trouble with back-and-forth conversations?', age_group: '8-12', is_reverse_scored: true },
  { id: 27, text: 'Does your child follow a strict routine and get upset if it changes?', age_group: '8-12', is_reverse_scored: true },
  { id: 28, text: 'Does your child show intense interest in certain objects or topics?', age_group: '8-12', is_reverse_scored: true },
  { id: 29, text: 'Does your child avoid group activities or team sports?', age_group: '8-12', is_reverse_scored: true },
  { id: 30, text: 'Does your child become overwhelmed by loud sounds or bright lights?', age_group: '8-12', is_reverse_scored: true },

  // Ages 13-18
  { id: 31, text: 'Does your teen avoid social interactions or group settings?', age_group: '13-18', is_reverse_scored: true },
  { id: 32, text: 'Does your teen find it hard to understand social cues or body language?', age_group: '13-18', is_reverse_scored: true },
  { id: 33, text: 'Does your teen express difficulty in forming or keeping friendships?', age_group: '13-18', is_reverse_scored: true },
  { id: 34, text: 'Does your teen talk at length about their interests without noticing others\' reactions?', age_group: '13-18', is_reverse_scored: true },
  { id: 35, text: 'Does your teen appear anxious or upset in unfamiliar environments?', age_group: '13-18', is_reverse_scored: true },
  { id: 36, text: 'Does your teen struggle with organization or transitions?', age_group: '13-18', is_reverse_scored: true },
  { id: 37, text: 'Does your teen seem unaware of how their behavior affects others?', age_group: '13-18', is_reverse_scored: true },
  { id: 38, text: 'Does your teen get stuck on specific topics or routines?', age_group: '13-18', is_reverse_scored: true },
  { id: 39, text: 'Does your teen prefer communicating through writing or online rather than in person?', age_group: '13-18', is_reverse_scored: true },
  { id: 40, text: 'Does your teen report feeling "different" or "out of place" socially?', age_group: '13-18', is_reverse_scored: true }
]
