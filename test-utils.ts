import { NextRequest } from 'next/server'
import type { FormSubmissionInput } from '@/lib/validation'

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    ip?: string
  } = {}
): NextRequest {
  const {
    method = 'GET',
    headers = {},
    body,
    ip = '127.0.0.1',
  } = options

  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    'x-forwarded-for': ip,
    ...headers,
  })

  const request = new NextRequest(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  return request
}

/**
 * Generate test form submission data
 */
export function generateTestFormData(
  overrides: Partial<FormSubmissionInput> = {}
): FormSubmissionInput {
  return {
    formType: 'impalement-protection',
    jobNumber: 'JOB-12345',
    submittedBy: 'John Doe',
    submittedByEmail: 'john.doe@example.com',
    submittedByCompany: 'Test Company Inc',
    submittedAtLocal: new Date().toISOString(),
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    data: {
      date: '2024-01-15',
      inspections: [
        {
          startTime: '09:00',
          endTime: '10:00',
          location: 'Building A, Floor 3',
          locationPhotos: [],
          hazardDescription: 'Exposed rebar on deck edge presents impalement hazard',
          hazardPhotos: [],
          correctiveMeasures: 'Installed protective caps on all exposed rebar',
          measuresPhotos: [],
          creatingEmployer: 'ABC Construction',
          supervisor: 'Jane Smith',
        },
      ],
    },
    emailOptions: {
      recipientEmail: 'recipient@example.com',
      ccEmails: 'cc1@example.com,cc2@example.com',
      emailSubject: 'Impalement Protection Form - JOB-12345',
    },
    ...overrides,
  }
}

/**
 * Generate test compressed image data
 */
export function generateTestImage(overrides: any = {}) {
  return {
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
    size: 500,
    width: 800,
    height: 600,
    ...overrides,
  }
}

/**
 * Wait for a specific time (useful for async operations)
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Create a test JWT payload
 */
export function generateTestJWTPayload() {
  return {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'admin',
  }
}

/**
 * Mock database connection for tests
 */
export const mockDb = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 'test-id' }]),
    }),
  }),
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockResolvedValue([]),
    }),
  }),
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  }),
  delete: jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue([]),
  }),
}

/**
 * Create a mock file for testing file uploads
 */
export function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File {
  const blob = new Blob(['test file content'], { type })
  return new File([blob], name, { type, lastModified: Date.now() })
}

/**
 * Assertions helpers
 */
export const expectToBeValidDate = (dateString: string) => {
  expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(new Date(dateString).toString()).not.toBe('Invalid Date')
}

export const expectToBeValidTime = (timeString: string) => {
  expect(timeString).toMatch(/^\d{2}:\d{2}$/)
}

export const expectToBeValidEmail = (email: string) => {
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
}

export const expectToBeValidJWT = (token: string) => {
  expect(token).toBeTruthy()
  expect(token.split('.')).toHaveLength(3)
}

/**
 * Mock fetch responses
 */
export function mockFetchSuccess(data: any) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
    status: 200,
    statusText: 'OK',
  })
}

export function mockFetchError(status: number, message: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: message }),
    status,
    statusText: message,
  })
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  jest.clearAllMocks()
  jest.resetAllMocks()
}
