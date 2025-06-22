// DeepSeek API client for the Autism Information Chat feature

export type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type DeepSeekCompletionRequest = {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

export type DeepSeekCompletionResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const defaultModel = 'deepseek-chat'; // Update with the correct model name

/**
 * Creates a completion using the DeepSeek API
 */
export async function createCompletion(
  messages: DeepSeekMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<DeepSeekCompletionResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not defined in environment variables');
  }

  const model = options.model || defaultModel;
  
  const requestBody: DeepSeekCompletionRequest = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1000,
  };

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ''
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

/**
 * Generates a response for the autism information chat
 */
export async function generateAutismChatResponse(
  userMessage: string,
  chatHistory: DeepSeekMessage[] = []
): Promise<string> {
  // System message to guide the AI response
  const systemMessage: DeepSeekMessage = {
    role: 'system',
    content: `You are an AI assistant specialized in providing information about autism spectrum disorder (ASD).
    Provide accurate, evidence-based information from reputable sources like CDC, Autism Speaks, etc.
    Be supportive, empathetic, and avoid medical diagnosis. When uncertain, acknowledge limitations and suggest consulting healthcare professionals.
    Keep responses clear, concise, and focused on autism-related topics.`
  };

  // Combine system message, chat history, and new user message
  const messages: DeepSeekMessage[] = [
    systemMessage,
    ...chatHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const completion = await createCompletion(messages, {
      temperature: 0.7, // Balanced between creativity and accuracy
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Error generating autism chat response:', error);
    return 'I apologize, but there was an error processing your request. Please try again later.';
  }
}
