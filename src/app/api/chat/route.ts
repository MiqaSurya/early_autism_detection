import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withRateLimit, checkExternalApiLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// System message for the AI assistant
const SYSTEM_MESSAGE = `You are a helpful AI assistant. You can answer questions on a wide variety of topics including but not limited to:

- General knowledge and information
- Health and medical topics (while noting when professional consultation is needed)
- Technology and science
- Education and learning
- Autism and developmental topics
- Parenting and child development
- And many other subjects

Provide accurate, helpful, and well-structured responses. When discussing medical or health topics, always remind users to consult with healthcare professionals for personalized advice. Be empathetic, supportive, and maintain a professional tone.`

type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

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

  const API_URL = 'https://api.deepseek.com/v1/chat/completions';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
}

// Temporarily disable rate limiting for development
const rateLimitedPOST = async (req: NextRequest) => {
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

    // Temporarily disable external API rate limiting for development
    // const canCallExternalApi = await checkExternalApiLimit('openai', session.user.id)
    // if (!canCallExternalApi) {
    //   return NextResponse.json(
    //     { error: 'External API rate limit exceeded. Please try again later.' },
    //     { status: 429 }
    //   )
    // }

    const { messages } = await req.json()

    logger.info('Processing chat request', {
      userId: session.user.id,
      component: 'chat-api',
    })
    try {
      // Use DeepSeek as primary API (OpenAI quota exceeded)
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
      logger.error('Chat API Error', apiError as Error, {
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
}

// Export the handler
export const POST = rateLimitedPOST
