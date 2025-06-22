import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Simulate successful registration
    return NextResponse.json({ 
      success: true,
      message: 'Registration successful'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: error.message || 'Registration failed'
    }, { 
      status: 500 
    });
  }
} 