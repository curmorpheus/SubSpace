import { rateLimit, getClientIP, RateLimits, type RateLimitConfig } from '@/lib/rate-limit'
import { createMockRequest } from '@/test-utils'

describe('Rate Limit Library', () => {
  describe('rateLimit', () => {
    it('should allow requests within limit', () => {
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
        ip: '192.168.1.1',
      })

      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
      }

      const result = rateLimit(request, '192.168.1.1', config)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })

    it('should block requests exceeding limit', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 3,
      }

      const identifier = 'test-user-1'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
        ip: '192.168.1.2',
      })

      // Make requests up to limit
      for (let i = 0; i < 3; i++) {
        const result = rateLimit(request, identifier, config)
        expect(result.success).toBe(true)
      }

      // Next request should be blocked
      const blockedResult = rateLimit(request, identifier, config)
      expect(blockedResult.success).toBe(false)
      expect(blockedResult.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const config: RateLimitConfig = {
        windowMs: 100, // Very short window for testing
        maxRequests: 2,
      }

      const identifier = 'test-user-2'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
        ip: '192.168.1.3',
      })

      // Use up the limit
      rateLimit(request, identifier, config)
      rateLimit(request, identifier, config)

      // Should be blocked
      const blocked = rateLimit(request, identifier, config)
      expect(blocked.success).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const allowed = rateLimit(request, identifier, config)
      expect(allowed.success).toBe(true)
    })

    it('should track different identifiers separately', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 2,
      }

      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      // User 1 uses up limit
      rateLimit(request, 'user-1', config)
      rateLimit(request, 'user-1', config)
      const user1Blocked = rateLimit(request, 'user-1', config)
      expect(user1Blocked.success).toBe(false)

      // User 2 should still be allowed
      const user2Allowed = rateLimit(request, 'user-2', config)
      expect(user2Allowed.success).toBe(true)
    })

    it('should track different paths separately', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 2,
      }

      const identifier = 'same-user'

      const request1 = createMockRequest('https://example.com/api/path1', {
        method: 'POST',
      })
      const request2 = createMockRequest('https://example.com/api/path2', {
        method: 'POST',
      })

      // Use up limit on path1
      rateLimit(request1, identifier, config)
      rateLimit(request1, identifier, config)
      const path1Blocked = rateLimit(request1, identifier, config)
      expect(path1Blocked.success).toBe(false)

      // path2 should still be allowed
      const path2Allowed = rateLimit(request2, identifier, config)
      expect(path2Allowed.success).toBe(true)
    })

    it('should return correct remaining count', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
      }

      const identifier = 'test-user-3'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      const result1 = rateLimit(request, identifier, config)
      expect(result1.remaining).toBe(4)

      const result2 = rateLimit(request, identifier, config)
      expect(result2.remaining).toBe(3)

      const result3 = rateLimit(request, identifier, config)
      expect(result3.remaining).toBe(2)
    })

    it('should set reset time correctly', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
      }

      const identifier = 'test-user-4'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      const before = Date.now()
      const result = rateLimit(request, identifier, config)
      const after = Date.now()

      expect(result.reset).toBeGreaterThanOrEqual(before + config.windowMs)
      expect(result.reset).toBeLessThanOrEqual(after + config.windowMs + 100)
    })

    it('should never return negative remaining', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
      }

      const identifier = 'test-user-5'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      // Use up limit and exceed
      rateLimit(request, identifier, config)
      const result = rateLimit(request, identifier, config)

      expect(result.remaining).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getClientIP', () => {
    it('should get IP from x-forwarded-for header', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.1' },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.1')
    })

    it('should get first IP from x-forwarded-for with multiple IPs', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1' },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.1')
    })

    it('should get IP from x-real-ip header when x-forwarded-for not present', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: { 'x-real-ip': '203.0.113.2' },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.2')
    })

    it('should get IP from cf-connecting-ip header for Cloudflare', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: { 'cf-connecting-ip': '203.0.113.3' },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.3')
    })

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
          'cf-connecting-ip': '203.0.113.3',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.1')
    })

    it('should return "unknown" when no IP headers present', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: {},
      })

      const ip = getClientIP(request)
      expect(ip).toBe('unknown')
    })

    it('should handle IPv6 addresses', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    })

    it('should trim whitespace from IP addresses', () => {
      const request = createMockRequest('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '  203.0.113.1  ' },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.1')
    })
  })

  describe('RateLimits Presets', () => {
    it('should have AUTH rate limit config', () => {
      expect(RateLimits.AUTH).toBeDefined()
      expect(RateLimits.AUTH.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(RateLimits.AUTH.maxRequests).toBe(5)
    })

    it('should have FORM_SUBMIT rate limit config', () => {
      expect(RateLimits.FORM_SUBMIT).toBeDefined()
      expect(RateLimits.FORM_SUBMIT.windowMs).toBe(60 * 1000) // 1 minute
      expect(RateLimits.FORM_SUBMIT.maxRequests).toBe(5)
    })

    it('should have API rate limit config', () => {
      expect(RateLimits.API).toBeDefined()
      expect(RateLimits.API.windowMs).toBe(60 * 1000) // 1 minute
      expect(RateLimits.API.maxRequests).toBe(30)
    })

    it('should enforce strict AUTH rate limit', () => {
      const identifier = 'auth-test-user'
      const request = createMockRequest('https://example.com/api/auth/login', {
        method: 'POST',
      })

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(request, identifier, RateLimits.AUTH)
        expect(result.success).toBe(true)
      }

      // 6th request should fail
      const result = rateLimit(request, identifier, RateLimits.AUTH)
      expect(result.success).toBe(false)
    })

    it('should enforce FORM_SUBMIT rate limit', () => {
      const identifier = 'form-test-user'
      const request = createMockRequest('https://example.com/api/forms/submit', {
        method: 'POST',
      })

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(request, identifier, RateLimits.FORM_SUBMIT)
        expect(result.success).toBe(true)
      }

      // 6th request should fail
      const result = rateLimit(request, identifier, RateLimits.FORM_SUBMIT)
      expect(result.success).toBe(false)
    })

    it('should allow more API requests than AUTH requests', () => {
      expect(RateLimits.API.maxRequests).toBeGreaterThan(RateLimits.AUTH.maxRequests)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid concurrent requests', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 10,
      }

      const identifier = 'concurrent-user'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      // Simulate 15 rapid requests
      const results = Array.from({ length: 15 }, () =>
        rateLimit(request, identifier, config)
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      expect(successCount).toBe(10)
      expect(failCount).toBe(5)
    })

    it('should handle zero maxRequests config', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 0,
      }

      const identifier = 'zero-limit-user'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      const result = rateLimit(request, identifier, config)
      expect(result.success).toBe(false)
    })

    it('should handle very short window', async () => {
      const config: RateLimitConfig = {
        windowMs: 1,
        maxRequests: 1,
      }

      const identifier = 'short-window-user'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      const result1 = rateLimit(request, identifier, config)
      expect(result1.success).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 5))

      const result2 = rateLimit(request, identifier, config)
      expect(result2.success).toBe(true)
    })

    it('should handle special characters in identifier', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
      }

      const specialIdentifier = 'user@#$%^&*()_+-=[]{}|;:,.<>?'
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      const result = rateLimit(request, specialIdentifier, config)
      expect(result.success).toBe(true)
    })

    it('should handle very long identifier', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
      }

      const longIdentifier = 'user' + 'a'.repeat(1000)
      const request = createMockRequest('https://example.com/api/test', {
        method: 'POST',
      })

      const result = rateLimit(request, longIdentifier, config)
      expect(result.success).toBe(true)
    })
  })
})
