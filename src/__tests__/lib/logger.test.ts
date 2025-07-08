import { logger, withLogging, withAsyncLogging } from '@/lib/logger'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}))

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console mocks
    ;(console.debug as jest.Mock).mockClear()
    ;(console.info as jest.Mock).mockClear()
    ;(console.warn as jest.Mock).mockClear()
    ;(console.error as jest.Mock).mockClear()
  })

  describe('debug', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })

      logger.debug('Test debug message', { component: 'test' })

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Test debug message')
      )

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
    })

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })

      logger.debug('Test debug message')

      expect(console.debug).not.toHaveBeenCalled()

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
    })
  })

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { component: 'test' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message')
      )
    })
  })

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message', { component: 'test' })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message')
      )
    })
  })

  describe('error', () => {
    it('should log error messages', () => {
      const error = new Error('Test error')
      logger.error('Test error message', error, { component: 'test' })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        error
      )
    })
  })

  describe('specialized logging methods', () => {
    it('should log API errors with correct context', () => {
      const error = new Error('API failed')
      logger.apiError('/api/test', error, { userId: 'test-user' })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: API Error: /api/test'),
        error
      )
    })

    it('should log auth errors with correct context', () => {
      const error = new Error('Auth failed')
      logger.authError('login', error, { userId: 'test-user' })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Auth Error: login'),
        error
      )
    })

    it('should log user actions', () => {
      logger.userAction('button_click', { userId: 'test-user' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: User Action: button_click')
      )
    })

    it('should log performance metrics', () => {
      logger.performance('api_call', 150, { component: 'test' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Performance: api_call took 150ms')
      )
    })
  })
})

describe('withLogging', () => {
  it('should wrap function with performance logging', () => {
    const testFunction = jest.fn().mockReturnValue('result')
    const wrappedFunction = withLogging(testFunction, 'test_operation')

    const result = wrappedFunction('arg1', 'arg2')

    expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2')
    expect(result).toBe('result')
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Performance: test_operation took')
    )
  })

  it('should handle errors and re-throw them', () => {
    const error = new Error('Test error')
    const testFunction = jest.fn().mockImplementation(() => {
      throw error
    })
    const wrappedFunction = withLogging(testFunction, 'test_operation')

    expect(() => wrappedFunction()).toThrow(error)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in test_operation'),
      error
    )
  })
})

describe('withAsyncLogging', () => {
  it('should wrap async function with performance logging', async () => {
    const testFunction = jest.fn().mockResolvedValue('result')
    const wrappedFunction = withAsyncLogging(testFunction, 'test_async_operation')

    const result = await wrappedFunction('arg1', 'arg2')

    expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2')
    expect(result).toBe('result')
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Performance: test_async_operation took')
    )
  })

  it('should handle async errors and re-throw them', async () => {
    const error = new Error('Test async error')
    const testFunction = jest.fn().mockRejectedValue(error)
    const wrappedFunction = withAsyncLogging(testFunction, 'test_async_operation')

    await expect(wrappedFunction()).rejects.toThrow(error)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in test_async_operation'),
      error
    )
  })
})
