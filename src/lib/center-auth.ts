// Center Portal Authentication System
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CenterUser {
  id: string
  email: string
  contact_person: string
  center_name: string
  center_type: 'diagnostic' | 'therapy' | 'support' | 'education'
  address: string
  latitude: number
  longitude: number
  phone?: string
  description?: string
  business_license?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface CenterSession {
  id: string
  center_user_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export interface CenterRegistrationData {
  email: string
  password: string
  contactPerson: string
  centerName: string
  centerType: 'diagnostic' | 'therapy' | 'support' | 'education'
  address: string
  latitude: number
  longitude: number
  phone?: string
  description?: string
  businessLicense?: string
}

export interface CenterLoginData {
  email: string
  password: string
}

// Hash password (simple implementation for now)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// Verify password
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex') + '-' + Date.now().toString(36)
}

// Register center user
export async function registerCenterUser(data: CenterRegistrationData): Promise<{ success: boolean; user?: CenterUser; error?: string }> {
  try {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('center_users')
      .select('id')
      .eq('email', data.email)
      .single()

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create center user - ALWAYS set is_active = true for immediate visibility in user locator
    // Note: We'll handle any RLS errors from database triggers gracefully
    let newUser
    try {
      const { data: insertedUser, error } = await supabase
        .from('center_users')
        .insert({
          email: data.email,
          password_hash: passwordHash,
          contact_person: data.contactPerson,
          center_name: data.centerName,
          center_type: data.centerType,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          description: data.description,
          business_license: data.businessLicense,
          is_active: true // Explicitly set to ensure immediate visibility in user locator via ID-based fetching
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Center user registration error:', error)
        return { success: false, error: error.message || 'Registration failed' }
      } else {
        newUser = insertedUser
        console.log('✅ Center user created successfully:', newUser.id)
      }
    } catch (insertError) {
      console.error('❌ Center user insertion error:', insertError)
      return { success: false, error: 'Registration failed' }
    }

    // Note: autism_centers sync is now handled in the API route using service role
    // This ensures proper permissions and bypasses any RLS issues

    return { success: true, user: newUser }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

// Login center user
export async function loginCenterUser(data: CenterLoginData): Promise<{ success: boolean; user?: CenterUser; sessionToken?: string; error?: string }> {
  try {
    // Get user by email
    const { data: user, error } = await supabase
      .from('center_users')
      .select('*')
      .eq('email', data.email)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create session
    const { error: sessionError } = await supabase
      .from('center_sessions')
      .insert({
        center_user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return { success: false, error: 'Login failed' }
    }

    // Update last login
    await supabase
      .from('center_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    return { success: true, user, sessionToken }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

// Verify session
export async function verifyCenterSession(sessionToken: string): Promise<{ valid: boolean; user?: CenterUser }> {
  try {
    const { data: session, error } = await supabase
      .from('center_sessions')
      .select(`
        *,
        center_users (*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !session) {
      return { valid: false }
    }

    return { valid: true, user: session.center_users as CenterUser }
  } catch (error) {
    console.error('Session verification error:', error)
    return { valid: false }
  }
}

// Logout center user
export async function logoutCenterUser(sessionToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('center_sessions')
      .delete()
      .eq('session_token', sessionToken)

    return !error
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}

// Get center user by ID
export async function getCenterUser(userId: string): Promise<CenterUser | null> {
  try {
    const { data: user, error } = await supabase
      .from('center_users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Get center user error:', error)
    return null
  }
}
