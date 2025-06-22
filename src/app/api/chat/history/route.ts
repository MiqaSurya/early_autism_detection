import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

type ChatMessage = {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type Conversation = {
  date: string;
  messages: ChatMessage[];
}

export async function GET(req: Request) {
  try {
    // Create a Supabase client with cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('No session found, returning unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching chat history for user:', session.user.id)
    
    // Get chat history for the current user
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('timestamp', { ascending: false })
      .limit(100)  // Increased limit to get more history
      
    // Group conversations by date (using the date part of timestamp)
    const groupedHistory: Conversation[] = []
    
    try {
      if (data && data.length > 0) {
        // Group by conversation (using timestamp to determine which messages belong together)
        const conversations: Record<string, Conversation> = {}
        
        // First pass: identify unique conversations by their timestamps
        data.forEach(item => {
          // Use the timestamp's date part as the key (ignoring time for grouping by day)
          const date = new Date(item.timestamp).toLocaleDateString()
          
          if (!conversations[date]) {
            conversations[date] = {
              date,
              messages: []
            }
          }
          
          conversations[date].messages.push({
            id: item.id,
            role: 'user',
            content: item.question,
            timestamp: item.timestamp
          })
          
          conversations[date].messages.push({
            id: `${item.id}-response`,
            role: 'assistant',
            content: item.answer,
            timestamp: item.timestamp
          })
        })
        
        // Convert to array and sort by most recent first
        Object.values(conversations).forEach((convo: Conversation) => {
          // Sort messages by timestamp (ascending so they appear in the correct order)
          convo.messages.sort((a: ChatMessage, b: ChatMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          groupedHistory.push(convo)
        })
        
        // Sort conversations by date (most recent first)
        groupedHistory.sort((a: Conversation, b: Conversation) => 
          new Date(b.date).getTime() - new Date(a.date).getTime())
      }
    } catch (groupingError) {
      console.error('Error processing chat history:', groupingError)
      // Continue with empty groupedHistory
    }

    if (error) {
      console.error('Error fetching chat history:', error)
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} chat history items, grouped into ${groupedHistory.length} conversations`)
    return NextResponse.json({ history: groupedHistory || [] })
  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
