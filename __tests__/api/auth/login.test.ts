import { POST } from '@/app/api/auth/login/route'
import { createMockRequest } from '@/test-utils'
import * as auth from '@/lib/auth'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyAdminPassword: jest.fn(),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful Login', () => {
    it('should return success and set cookie for valid credentials', async () => {
      // Mock valid password
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
        ip: '192.168.1.1',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Authenticated successfully')

      // Check that cookie was set
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('auth-token')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).toContain('SameSite=Strict')
    })

    it('should create a valid JWT token', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toBeTruthy()

      // Cookie should contain a JWT (3 parts separated by dots)
      const tokenMatch = cookies?.match(/auth-token=([^;]+)/)
      expect(tokenMatch).toBeTruthy()

      if (tokenMatch) {
        const token = tokenMatch[1]
        expect(token.split('.')).toHaveLength(3)
      }
    })

    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('Secure')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Failed Login', () => {
    it('should return 401 for invalid password', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid credentials')
    })

    it('should return 400 for missing password', async () => {
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: {},
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should return 400 for empty password', async () => {
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: '' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should return 400 for malformed request body', async () => {
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { wrongField: 'value' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limiting after 5 attempts', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const ip = '192.168.1.100'

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('https://example.com/api/auth/login', {
          method: 'POST',
          body: { password: 'wrongPassword' },
          ip,
        })

        await POST(request)
      }

      // 6th attempt should be rate limited
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
        ip,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many login attempts')
      expect(data.retryAfter).toBeDefined()
      expect(data.retryAfter).toBeGreaterThan(0)
    })

    it('should include rate limit headers when rate limited', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const ip = '192.168.1.101'

      // Make requests to trigger rate limit
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('https://example.com/api/auth/login', {
          method: 'POST',
          body: { password: 'wrongPassword' },
          ip,
        })
        await POST(request)
      }

      // Next request should be rate limited
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
        ip,
      })

      const response = await POST(request)

      expect(response.headers.get('x-ratelimit-limit')).toBe('5')
      expect(response.headers.get('x-ratelimit-remaining')).toBe('0')
      expect(response.headers.get('x-ratelimit-reset')).toBeTruthy()
      expect(response.headers.get('retry-after')).toBeTruthy()
    })

    it('should track rate limits per IP address', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const ip1 = '192.168.1.102'
      const ip2 = '192.168.1.103'

      // Make 5 requests from IP1
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('https://example.com/api/auth/login', {
          method: 'POST',
          body: { password: 'wrongPassword' },
          ip: ip1,
        })
        await POST(request)
      }

      // IP1 should be rate limited
      const ip1Request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
        ip: ip1,
      })
      const ip1Response = await POST(ip1Request)
      expect(ip1Response.status).toBe(429)

      // IP2 should still be allowed
      const ip2Request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
        ip: ip2,
      })
      const ip2Response = await POST(ip2Request)
      expect(ip2Response.status).toBe(401) // Not rate limited, just invalid password
    })
  })

  describe('Security', () => {
    it('should not reveal whether password is correct in error messages', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('Invalid credentials')
      expect(data.error).not.toContain('password')
      expect(data.error).not.toContain('wrong')
    })

    it('should not set cookie for failed login', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'wrongPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toBeNull()
    })

    it('should handle special characters in password', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'P@ssw0rd!#$%^&*()' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle very long password', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(false)

      const longPassword = 'a'.repeat(10000)
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: longPassword },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle unicode characters in password', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'пароль密码كلمة السر' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      // Create a request with invalid JSON
      const request = new Request('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
        body: 'invalid json{',
      })

      const response = await POST(request as any)

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should return 500 on unexpected errors', async () => {
      // Mock auth function to throw error
      jest.spyOn(auth, 'verifyAdminPassword').mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'testPassword' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Authentication failed')
    })
  })

  describe('Cookie Configuration', () => {
    it('should set httpOnly flag', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('HttpOnly')
    })

    it('should set sameSite=strict', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('SameSite=Strict')
    })

    it('should set 8 hour expiration', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('Max-Age=28800') // 8 hours in seconds
    })

    it('should set path to /', async () => {
      jest.spyOn(auth, 'verifyAdminPassword').mockReturnValue(true)

      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
        body: { password: 'correctPassword' },
      })

      const response = await POST(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('Path=/')
    })
  })
})
