import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/use-toast'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockSession = {
  user: mockUser,
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  expires_in: 3600,
  token_type: 'bearer',
}

export const mockChild = {
  id: 'test-child-id',
  user_id: 'test-user-id',
  name: 'Test Child',
  date_of_birth: '2020-01-01',
  gender: 'other',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockAssessment = {
  id: 'test-assessment-id',
  child_id: 'test-child-id',
  user_id: 'test-user-id',
  score: 5,
  risk_level: 'medium',
  completed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAutismCenter = {
  id: 'test-center-id',
  name: 'Test Autism Center',
  type: 'diagnostic',
  address: '123 Test St, Test City, TC 12345',
  latitude: 40.7128,
  longitude: -74.0060,
  phone: '+1-555-0123',
  website: 'https://testcenter.com',
  email: 'info@testcenter.com',
  description: 'A test autism center',
  services: ['diagnosis', 'therapy'],
  age_groups: ['toddler', 'child'],
  insurance_accepted: ['medicaid', 'private'],
  rating: 4.5,
  verified: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Test helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

export const mockApiResponse = (data: any, status = 200) => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

// Custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
})

// Export common test patterns
export const testIds = {
  loading: 'loading-spinner',
  error: 'error-message',
  success: 'success-message',
  form: 'form',
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',
} as const
