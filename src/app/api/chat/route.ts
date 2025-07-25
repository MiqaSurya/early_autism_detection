import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withRateLimit, checkExternalApiLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// System message for the AI assistant
const SYSTEM_MESSAGE = `You are an autism information specialist providing accurate, research-based information about autism spectrum disorder (ASD). Your role is to:

1. Provide evidence-based information about autism symptoms, diagnosis, and interventions
2. Offer supportive guidance for parents and caregivers
3. Explain developmental milestones and early signs
4. Discuss available therapies and educational approaches
5. Address common concerns and misconceptions
6. Suggest when to seek professional help

Always be empathetic, non-judgmental, and supportive. Avoid making diagnoses or providing medical advice.
Encourage users to consult with healthcare professionals for personalized guidance.

Important: Always remind users that this information is for educational purposes and not a substitute for professional medical advice.`

type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

async function queryDeepSeekModel(messages: any[]) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  // Format messages for DeepSeek API
  const formattedMessages: DeepSeekMessage[] = [
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

  const API_URL = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1/chat/completions';
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // Update with the correct model name
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
}

// Apply rate limiting to the POST handler
const rateLimitedPOST = withRateLimit('chat')(async (req: NextRequest) => {
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

    // Check external API rate limit
    const canCallExternalApi = await checkExternalApiLimit('deepseek', session.user.id)
    if (!canCallExternalApi) {
      return NextResponse.json(
        { error: 'External API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { messages } = await req.json()

    logger.info('Processing chat request', {
      userId: session.user.id,
      component: 'chat-api',
    })
    try {
      // Get response from the DeepSeek model
      const aiResponse = await queryDeepSeekModel(messages);
      logger.info('Received response from DeepSeek', {
        userId: session.user.id,
        component: 'chat-api',
      })

      // Save the chat interaction to Supabase for future reference
      try {
        await supabase.from('chat_history').insert({
          user_id: session.user.id,
          question: messages[messages.length - 1].content,
          answer: aiResponse,
          timestamp: new Date().toISOString()
        })
      } catch (dbError) {
        logger.error('Failed to save chat history', dbError as Error, {
          userId: session.user.id,
          component: 'chat-api',
        })
        // Continue even if saving fails
      }

      return NextResponse.json({
        role: 'assistant',
        content: aiResponse
      })

    } catch (apiError) {
      logger.error('DeepSeek API Error', apiError as Error, {
        userId: session.user.id,
        component: 'chat-api',
      })
      throw apiError;
    }

  } catch (error) {
    logger.error('Chat API Error', error as Error, {
      component: 'chat-api',
    })
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
})

// Export the rate-limited handler
export const POST = rateLimitedPOST
