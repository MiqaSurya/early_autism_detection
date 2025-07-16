import { NextRequest, NextResponse } from 'next/server'
import { logoutCenterUser } from '@/lib/center-auth'

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('center_session_token')?.value

    if (sessionToken) {
      // Logout the user (delete session from database)
      await logoutCenterUser(sessionToken)
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the session cookie
    response.cookies.set('center_session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Center logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
