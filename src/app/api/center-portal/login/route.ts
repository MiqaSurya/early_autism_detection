import { NextRequest, NextResponse } from 'next/server'
import { loginCenterUser } from '@/lib/center-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Attempt login
    const result = await loginCenterUser({ email, password })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Create response with session token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        center_name: result.user?.center_name,
        contact_person: result.user?.contact_person,
        center_type: result.user?.center_type,
        is_verified: result.user?.is_verified
      }
    })

    // Set session token as HTTP-only cookie
    response.cookies.set('center_session_token', result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Center login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
