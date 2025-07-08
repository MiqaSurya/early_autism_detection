/**
 * Admin Authentication Utilities
 * Handles admin login detection and session management
 */

import { logger } from './logger'

export interface AdminSession {
  isAdmin: boolean
  email: string
  loginTime: number
}

// Admin credentials from environment variables
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin'
}

/**
 * Check if provided credentials are admin credentials
 */
export function isAdminCredentials(email: string, password: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()

  if (process.env.NODE_ENV === 'development') {
    logger.debug('Admin credentials check', {
      component: 'admin-auth',
      metadata: {
        inputEmail: email,
        normalizedEmail,
        emailMatch: normalizedEmail === ADMIN_CREDENTIALS.email,
        passwordMatch: password === ADMIN_CREDENTIALS.password
      }
    })
  }

  return normalizedEmail === ADMIN_CREDENTIALS.email &&
         password === ADMIN_CREDENTIALS.password
}

/**
 * Create admin session in localStorage
 */
export function createAdminSession(): void {
  if (typeof window !== 'undefined') {
    const adminSession: AdminSession = {
      isAdmin: true,
      email: ADMIN_CREDENTIALS.email,
      loginTime: Date.now()
    }
    localStorage.setItem('admin_session', JSON.stringify(adminSession))
  }
}

/**
 * Get current admin session
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window !== 'undefined') {
    try {
      const sessionData = localStorage.getItem('admin_session')
      if (sessionData) {
        const session: AdminSession = JSON.parse(sessionData)
        
        // Check if session is still valid (24 hours)
        const sessionAge = Date.now() - session.loginTime
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        
        if (sessionAge < maxAge && session.isAdmin) {
          return session
        } else {
          // Session expired, remove it
          clearAdminSession()
        }
      }
    } catch (error) {
      clearAdminSession()
    }
  }
  return null
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(): boolean {
  const session = getAdminSession()
  console.log('Checking if current user is admin:', { session, isAdmin: session?.isAdmin === true })
  return session?.isAdmin === true
}

/**
 * Clear admin session
 */
export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_session')
  }
}

/**
 * Admin logout
 */
export function adminLogout(): void {
  clearAdminSession()
  // Redirect to home page
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}
