import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Simulate successful login
    return NextResponse.json({ 
      success: true,
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: error.message || 'Login failed'
    }, { 
      status: 500 
    });
  }
} 