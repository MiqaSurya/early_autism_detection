import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    console.error('Chat API Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
