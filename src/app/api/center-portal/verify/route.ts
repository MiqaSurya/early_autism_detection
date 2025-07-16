import { NextRequest, NextResponse } from 'next/server'
import { verifyCenterSession } from '@/lib/center-auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('center_session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, error: 'No session token' },
        { status: 401 }
      )
    }

    // Verify the session
    const result = await verifyCenterSession(sessionToken)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        center_name: result.user?.center_name,
        contact_person: result.user?.contact_person,
        center_type: result.user?.center_type,
        address: result.user?.address,
        latitude: result.user?.latitude,
        longitude: result.user?.longitude,
        phone: result.user?.phone,
        description: result.user?.description,
        business_license: result.user?.business_license,
        is_verified: result.user?.is_verified,
        is_active: result.user?.is_active,
        created_at: result.user?.created_at,
        updated_at: result.user?.updated_at
      }
    })

  } catch (error) {
    console.error('Center session verification API error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
