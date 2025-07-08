import { NextRequest } from 'next/server'
import {
  isOriginAllowed,
  isSuspiciousRequest,
  getClientIP,
  sanitizeInput,
  validateEmail,
  validatePassword,
  securityMiddleware,
} from '@/lib/security'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Security Utils', () => {
  describe('isOriginAllowed', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
    })

    it('should allow all origins in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      expect(isOriginAllowed('https://malicious.com')).toBe(true)
    })

    it('should allow null origin (same-origin requests)', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      expect(isOriginAllowed(null)).toBe(true)
    })

    it('should allow configured origins in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      expect(isOriginAllowed('http://localhost:3000')).toBe(true)
    })

    it('should reject unknown origins in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      expect(isOriginAllowed('https://malicious.com')).toBe(false)
    })
  })

  describe('isSuspiciousRequest', () => {
    const createMockRequest = (pathname: string, userAgent: string = 'normal-browser') => {
      return {
        headers: {
          get: (name: string) => {
            if (name === 'user-agent') return userAgent
            return null
          },
        },
        nextUrl: { pathname },
      } as NextRequest
    }

    it('should detect bot user agents', () => {
      const request = createMockRequest('/api/test', 'GoogleBot/1.0')
      expect(isSuspiciousRequest(request)).toBe(true)
    })

    it('should detect suspicious URL patterns', () => {
      const request = createMockRequest('/wp-admin/admin.php')
      expect(isSuspiciousRequest(request)).toBe(true)
    })

    it('should allow normal requests', () => {
      const request = createMockRequest('/api/chat', 'Mozilla/5.0')
      expect(isSuspiciousRequest(request)).toBe(false)
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
            return null
          },
        },
        ip: '127.0.0.1',
      } as NextRequest

      expect(getClientIP(request)).toBe('192.168.1.1')
    })

    it('should fallback to x-real-ip header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '192.168.1.1'
            return null
          },
        },
        ip: '127.0.0.1',
      } as NextRequest

      expect(getClientIP(request)).toBe('192.168.1.1')
    })

    it('should fallback to request.ip', () => {
      const request = {
        headers: {
          get: () => null,
        },
        ip: '127.0.0.1',
        nextUrl: { pathname: '/test' },
        method: 'GET',
      } as unknown as NextRequest

      expect(getClientIP(request)).toBe('127.0.0.1')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")')
    })

    it('should remove javascript: URLs', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  normal text  ')).toBe('normal text')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })

    it('should reject overly long email addresses', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject short passwords', () => {
      const result = validatePassword('Short1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should require uppercase letters', () => {
      const result = validatePassword('lowercase123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should require lowercase letters', () => {
      const result = validatePassword('UPPERCASE123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should require numbers', () => {
      const result = validatePassword('NoNumbers')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })
  })

  describe('securityMiddleware', () => {
    const createMockRequest = (
      pathname: string,
      method: string = 'GET',
      origin: string | null = null,
      userAgent: string = 'normal-browser'
    ) => {
      return {
        method,
        headers: {
          get: (name: string) => {
            if (name === 'origin') return origin
            if (name === 'user-agent') return userAgent
            return null
          },
        },
        nextUrl: { pathname },
      } as NextRequest
    }

    it('should handle OPTIONS requests for CORS', () => {
      const request = createMockRequest('/api/test', 'OPTIONS', 'http://localhost:3000')
      const response = securityMiddleware(request)

      expect(response).toBeTruthy()
      expect(response?.status).toBe(200)
    })

    it('should block malicious requests', () => {
      const request = createMockRequest('/api/../../../etc/passwd')
      const response = securityMiddleware(request)

      expect(response).toBeTruthy()
      expect(response?.status).toBe(403)
    })

    it('should allow normal requests', () => {
      const request = createMockRequest('/api/chat')
      const response = securityMiddleware(request)

      expect(response).toBeNull()
    })
  })
})
