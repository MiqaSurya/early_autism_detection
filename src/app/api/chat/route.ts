import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// System message for the AI assistant
const SYSTEM_MESSAGE = `You are an autism information specialist providing accurate, research-based information about autism spectrum disorder (ASD). Your role is to:

1. Provide clear, evidence-based information about autism
2. Use supportive and respectful language
3. Focus on strengths and possibilities while acknowledging challenges
4. Emphasize the diversity of autism experiences
5. Always recommend professional evaluation when appropriate
6. Avoid making definitive medical claims or diagnoses
7. Use identity-first ('autistic person') and person-first ('person with autism') language flexibly
8. Provide practical, actionable advice when appropriate
9. Reference reputable organizations (WHO, CDC, autism research centers) when relevant
10. Keep responses concise and easy to understand

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

export async function POST(req: Request) {
  console.log('Received chat request');
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()
    
    console.log('Processing request with DeepSeek API...');
    try {
      // Get response from the DeepSeek model
      const aiResponse = await queryDeepSeekModel(messages);
      console.log('Received response from DeepSeek');

      // Save the chat interaction to Supabase for future reference
      try {
        await supabase.from('chat_history').insert({
          user_id: session.user.id,
          question: messages[messages.length - 1].content,
          answer: aiResponse,
          timestamp: new Date().toISOString()
        })
      } catch (dbError) {
        console.error('Failed to save chat history:', dbError)
        // Continue even if saving fails
      }

      return NextResponse.json({
        role: 'assistant',
        content: aiResponse
      })

    } catch (apiError) {
      console.error('DeepSeek API Error:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    let errorMessage = "I apologize, but I'm having trouble processing your request.";
    let statusCode = 500;

    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.message.includes('API key')) {
        errorMessage = "The chat service is not properly configured. Please contact support.";
        statusCode = 503;
      } else if (error.message.includes('rate limit')) {
        errorMessage = "We're experiencing high demand. Please try again in a few moments.";
        statusCode = 429;
      } else if (error.message.includes('model not found')) {
        errorMessage = "The AI model is temporarily unavailable. Please try again later.";
        statusCode = 503;
      }
    }

    return NextResponse.json({
      role: "assistant",
      content: errorMessage + " For immediate assistance regarding autism, please consult with healthcare professionals."
    }, { status: statusCode })
  }
}
