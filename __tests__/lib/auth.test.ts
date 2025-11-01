import { createJWT, verifyJWT, hashPassword, verifyPassword, verifyAdminPassword, type JWTPayload } from '@/lib/auth'
import { generateTestJWTPayload, expectToBeValidJWT } from '@/test-utils'

describe('Auth Library', () => {
  describe('JWT Token Management', () => {
    describe('createJWT', () => {
      it('should create a valid JWT token', async () => {
        const payload = generateTestJWTPayload()
        const token = await createJWT(payload)

        expectToBeValidJWT(token)
      })

      it('should include all payload fields in token', async () => {
        const payload = generateTestJWTPayload()
        const token = await createJWT(payload)
        const verified = await verifyJWT(token)

        expect(verified).not.toBeNull()
        expect(verified?.userId).toBe(payload.userId)
        expect(verified?.email).toBe(payload.email)
        expect(verified?.role).toBe(payload.role)
      })

      it('should set expiration time', async () => {
        const payload = generateTestJWTPayload()
        const token = await createJWT(payload)
        const verified = await verifyJWT(token)

        expect(verified?.exp).toBeDefined()
        expect(verified?.iat).toBeDefined()
        expect(verified?.exp).toBeGreaterThan(verified!.iat!)
      })

      it('should create different tokens for same payload', async () => {
        const payload = generateTestJWTPayload()
        const token1 = await createJWT(payload)

        // Wait a tiny bit to ensure different iat
        await new Promise(resolve => setTimeout(resolve, 10))

        const token2 = await createJWT(payload)

        expect(token1).not.toBe(token2)
      })
    })

    describe('verifyJWT', () => {
      it('should verify a valid token', async () => {
        const payload = generateTestJWTPayload()
        const token = await createJWT(payload)
        const verified = await verifyJWT(token)

        expect(verified).not.toBeNull()
        expect(verified?.userId).toBe(payload.userId)
      })

      it('should return null for invalid token format', async () => {
        const verified = await verifyJWT('invalid.token.format')
        expect(verified).toBeNull()
      })

      it('should return null for malformed token', async () => {
        const verified = await verifyJWT('not-a-jwt')
        expect(verified).toBeNull()
      })

      it('should return null for empty token', async () => {
        const verified = await verifyJWT('')
        expect(verified).toBeNull()
      })

      it('should verify token with all required fields', async () => {
        const payload: JWTPayload = {
          userId: 'user123',
          email: 'user@example.com',
          role: 'admin',
        }
        const token = await createJWT(payload)
        const verified = await verifyJWT(token)

        expect(verified).toMatchObject({
          userId: 'user123',
          email: 'user@example.com',
          role: 'admin',
        })
      })

      it('should handle token with special characters in payload', async () => {
        const payload: JWTPayload = {
          userId: 'user-123_test',
          email: 'test+user@example.com',
          role: 'admin',
        }
        const token = await createJWT(payload)
        const verified = await verifyJWT(token)

        expect(verified).toMatchObject(payload)
      })
    })
  })

  describe('Password Hashing', () => {
    describe('hashPassword', () => {
      it('should hash a password', async () => {
        const password = 'testPassword123!'
        const hash = await hashPassword(password)

        expect(hash).toBeTruthy()
        expect(hash).not.toBe(password)
        expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are ~60 chars
      })

      it('should create different hashes for same password', async () => {
        const password = 'testPassword123!'
        const hash1 = await hashPassword(password)
        const hash2 = await hashPassword(password)

        expect(hash1).not.toBe(hash2) // Different salts
      })

      it('should hash empty password', async () => {
        const hash = await hashPassword('')
        expect(hash).toBeTruthy()
      })

      it('should hash long password', async () => {
        const longPassword = 'a'.repeat(200)
        const hash = await hashPassword(longPassword)
        expect(hash).toBeTruthy()
      })
    })

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'testPassword123!'
        const hash = await hashPassword(password)
        const isValid = await verifyPassword(password, hash)

        expect(isValid).toBe(true)
      })

      it('should reject incorrect password', async () => {
        const password = 'testPassword123!'
        const hash = await hashPassword(password)
        const isValid = await verifyPassword('wrongPassword', hash)

        expect(isValid).toBe(false)
      })

      it('should reject empty password when hash is not empty', async () => {
        const password = 'testPassword123!'
        const hash = await hashPassword(password)
        const isValid = await verifyPassword('', hash)

        expect(isValid).toBe(false)
      })

      it('should handle case-sensitive passwords', async () => {
        const password = 'TestPassword'
        const hash = await hashPassword(password)

        expect(await verifyPassword('TestPassword', hash)).toBe(true)
        expect(await verifyPassword('testpassword', hash)).toBe(false)
        expect(await verifyPassword('TESTPASSWORD', hash)).toBe(false)
      })

      it('should verify password with special characters', async () => {
        const password = 'P@ssw0rd!#$%^&*()'
        const hash = await hashPassword(password)
        const isValid = await verifyPassword(password, hash)

        expect(isValid).toBe(true)
      })
    })
  })

  describe('Admin Password Verification', () => {
    describe('verifyAdminPassword', () => {
      it('should return false when ADMIN_PASSWORD_HASH is not set', () => {
        const originalHash = process.env.ADMIN_PASSWORD_HASH
        delete process.env.ADMIN_PASSWORD_HASH

        const result = verifyAdminPassword('anyPassword')
        expect(result).toBe(false)

        // Restore
        process.env.ADMIN_PASSWORD_HASH = originalHash
      })

      it('should return false for invalid password format', () => {
        const result = verifyAdminPassword('')
        expect(result).toBe(false)
      })

      it('should handle bcrypt comparison errors gracefully', () => {
        // Set an invalid hash format
        const originalHash = process.env.ADMIN_PASSWORD_HASH
        process.env.ADMIN_PASSWORD_HASH = 'invalid-hash-format'

        const result = verifyAdminPassword('testPassword')
        expect(result).toBe(false)

        // Restore
        process.env.ADMIN_PASSWORD_HASH = originalHash
      })

      it('should return false for incorrect password', () => {
        const result = verifyAdminPassword('wrongPassword123')
        expect(result).toBe(false)
      })

      it('should handle empty password', () => {
        const result = verifyAdminPassword('')
        expect(result).toBe(false)
      })

      it('should handle very long password', () => {
        const longPassword = 'a'.repeat(1000)
        const result = verifyAdminPassword(longPassword)
        expect(result).toBe(false)
      })
    })
  })

  describe('Environment Variable Validation', () => {
    it('should require JWT_SECRET to be set', () => {
      // This is tested at module load time, so we test indirectly
      expect(process.env.JWT_SECRET).toBeDefined()
      expect(process.env.JWT_SECRET?.length).toBeGreaterThanOrEqual(32)
    })

    it('should create valid tokens with test JWT_SECRET', async () => {
      const payload = generateTestJWTPayload()
      const token = await createJWT(payload)
      const verified = await verifyJWT(token)

      expect(verified).not.toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent JWT operations', async () => {
      const payload = generateTestJWTPayload()

      const promises = Array.from({ length: 10 }, () => createJWT(payload))
      const tokens = await Promise.all(promises)

      expect(tokens).toHaveLength(10)
      tokens.forEach(token => expectToBeValidJWT(token))

      // Verify all tokens
      const verifications = await Promise.all(tokens.map(t => verifyJWT(t)))
      verifications.forEach(v => {
        expect(v).not.toBeNull()
        expect(v?.userId).toBe(payload.userId)
      })
    })

    it('should handle concurrent password operations', async () => {
      const password = 'testPassword123'

      const promises = Array.from({ length: 5 }, () => hashPassword(password))
      const hashes = await Promise.all(promises)

      expect(hashes).toHaveLength(5)

      // All hashes should be different
      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(5)

      // But all should verify correctly
      const verifications = await Promise.all(
        hashes.map(hash => verifyPassword(password, hash))
      )
      verifications.forEach(v => expect(v).toBe(true))
    })

    it('should handle unicode characters in JWT payload', async () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin 管理員 مدير',
      }
      const token = await createJWT(payload)
      const verified = await verifyJWT(token)

      expect(verified?.role).toBe(payload.role)
    })
  })
})
