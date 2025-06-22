import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { action, email, password, phone } = await req.json();
    
    switch (action) {
      case 'signIn': {
        // Handle login with either email or phone
        const credentials = email ? { email, password } : { phone, password };
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        
        if (error) throw error;
        return NextResponse.json(data);
      }
      
      case 'signUp': {
        // Handle registration with either email or phone
        const credentials = email ? { email, password } : { phone, password };
        const { data, error } = await supabase.auth.signUp(credentials);
        
        if (error) throw error;
        return NextResponse.json(data);
      }
      
      case 'signOut': {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Auth proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
} 