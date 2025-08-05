import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// System message for the AI assistant
const SYSTEM_MESSAGE = `You are an autism information specialist providing accurate, research-based information about autism spectrum disorder (ASD). Your role is to:

1. Provide evidence-based information about autism
2. Offer supportive guidance for families and individuals
3. Explain autism-related concepts in accessible language
4. Suggest appropriate resources and next steps
5. Be empathetic and understanding

Always maintain a professional, supportive tone and acknowledge when questions require consultation with healthcare professionals.`

async function queryOpenAIModel(messages: any[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Format messages for OpenAI API
  const formattedMessages: any[] = [
    {
      role: 'system',
      content: SYSTEM_MESSAGE
    }
  ];

  // Add conversation history
  messages.forEach((msg: any) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      formattedMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await req.json()

    console.log('Processing test chat request for user:', session.user.id)
    
    try {
      // Temporary: Use mock responses while API issues are resolved
      const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

      let aiResponse = '';

      // Check for early signs and symptoms
      if (userMessage.includes('early') || userMessage.includes('signs') || userMessage.includes('symptoms') ||
          userMessage.includes('warning') || userMessage.includes('red flags') || userMessage.includes('indicators') ||
          userMessage.includes('what are') || userMessage.includes('how to tell') || userMessage.includes('recognize')) {
        aiResponse = `Early signs of autism in toddlers and young children may include:

**Communication & Social Interaction:**
• Limited eye contact or avoiding eye contact
• Delayed speech development or not responding to their name
• Difficulty with back-and-forth conversation
• Not pointing to show interest in objects
• Lack of social smiling or sharing enjoyment

**Repetitive Behaviors & Interests:**
• Repetitive movements like hand flapping, rocking, or spinning
• Intense focus on specific objects or topics
• Insistence on sameness and difficulty with changes in routine
• Unusual reactions to sensory input (sounds, lights, textures)

**Other Signs:**
• Delayed developmental milestones
• Difficulty with pretend play
• Challenges with peer relationships

Remember, every child develops differently and at their own pace. If you notice several of these signs, consider discussing them with your pediatrician for proper evaluation.`;

      // Check for diagnosis-related questions
      } else if (userMessage.includes('diagnosis') || userMessage.includes('diagnosed') || userMessage.includes('evaluate') ||
                 userMessage.includes('assessment') || userMessage.includes('test') || userMessage.includes('screening') ||
                 userMessage.includes('m-chat') || userMessage.includes('mchat')) {
        aiResponse = `Autism diagnosis typically involves a comprehensive evaluation process:

**Professional Assessment:**
• Developmental pediatrician, child psychologist, or psychiatrist
• Comprehensive developmental and medical history
• Direct observation of behavior and communication
• Standardized diagnostic tools (ADOS-2, ADI-R)

**Screening Tools:**
• M-CHAT-R (Modified Checklist for Autism in Toddlers) - available in this app
• Ages & Stages Questionnaires (ASQ)
• Childhood Autism Rating Scale (CARS)

**What to Expect:**
• Multiple appointments may be needed
• Input from parents, caregivers, and teachers
• Assessment of communication, social skills, and behaviors
• Medical evaluation to rule out other conditions

Early diagnosis is crucial as it leads to earlier intervention, which can significantly improve developmental outcomes. The M-CHAT-R screening in this app can help identify if further professional evaluation is recommended.`;

      // Check for therapy and treatment questions
      } else if (userMessage.includes('therapy') || userMessage.includes('treatment') || userMessage.includes('intervention') ||
                 userMessage.includes('help') || userMessage.includes('support') || userMessage.includes('aba') ||
                 userMessage.includes('speech') || userMessage.includes('occupational')) {
        aiResponse = `Evidence-based therapies and interventions for autism include:

**Behavioral Interventions:**
• Applied Behavior Analysis (ABA) - most researched intervention
• Pivotal Response Treatment (PRT)
• Early Start Denver Model (ESDM)

**Communication Therapies:**
• Speech and Language Therapy - improves verbal and non-verbal communication
• Picture Exchange Communication System (PECS)
• Augmentative and Alternative Communication (AAC)

**Developmental Therapies:**
• Occupational Therapy - daily living skills, sensory processing
• Physical Therapy - motor skills and coordination
• Social Skills Training - peer interactions and relationships

**Educational Support:**
• Individualized Education Programs (IEPs)
• Special education services
• Inclusion programs with typical peers

**Key Points:**
• Early intervention (before age 3) is most effective
• Individualized approach based on child's specific needs
• Family involvement is crucial for success
• Combination of therapies often works best

The best treatment plan is tailored to each child's unique strengths and challenges.`;

      // Check for general questions about autism
      } else if (userMessage.includes('what is autism') || userMessage.includes('autism spectrum') ||
                 userMessage.includes('asd') || userMessage.includes('define') || userMessage.includes('explain')) {
        aiResponse = `Autism Spectrum Disorder (ASD) is a neurodevelopmental condition that affects communication, social interaction, and behavior.

**Key Characteristics:**
• Challenges with social communication and interaction
• Restricted and repetitive patterns of behavior or interests
• Symptoms present in early development
• Symptoms impact daily functioning

**Why "Spectrum"?**
Autism is called a "spectrum" because it affects individuals very differently:
• Some may need significant daily support
• Others live independently and have successful careers
• Abilities and challenges vary widely between individuals

**Prevalence:**
• Affects about 1 in 36 children (CDC, 2023)
• More commonly diagnosed in boys than girls
• Found in all racial, ethnic, and socioeconomic groups

**Important Points:**
• Autism is not caused by vaccines, parenting styles, or nutrition
• It's a lifelong condition, but early intervention can make a significant difference
• Many autistic individuals have unique strengths and talents
• With proper support, people with autism can lead fulfilling lives

Understanding and acceptance are key to supporting individuals with autism and their families.`;

      // Default response for other questions
      } else {
        aiResponse = `I'd be happy to help you learn more about autism! Here are some specific topics I can provide detailed information about:

**Ask me about:**
• "What are the early signs of autism?" - Learn about early indicators and red flags
• "How is autism diagnosed?" - Understand the diagnostic process and screening tools
• "What therapies help with autism?" - Explore evidence-based treatments and interventions
• "What is autism spectrum disorder?" - Get a comprehensive overview of ASD

**Other topics I can help with:**
• Supporting children with autism at home and school
• Understanding sensory sensitivities
• Communication strategies
• Educational resources and rights
• Transitioning to adulthood with autism

Feel free to ask specific questions, and I'll provide detailed, evidence-based information. For personalized medical advice, always consult with healthcare professionals.`;
      }

      console.log('Generated mock response for testing')

      return NextResponse.json({
        role: 'assistant',
        content: aiResponse
      })

    } catch (apiError) {
      console.error('Test Chat API Error:', apiError)
      throw apiError;
    }

  } catch (error) {
    console.error('Test Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
