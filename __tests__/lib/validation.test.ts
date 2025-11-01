import {
  formSubmissionSchema,
  compressedImageSchema,
  signatureSchema,
  adminLoginSchema,
  createEmailAllowlistSchema,
  getAllowedEmailDomains,
  validateEmailAllowlist,
} from '@/lib/validation'
import { generateTestFormData, generateTestImage } from '@/test-utils'

describe('Validation Library', () => {
  describe('compressedImageSchema', () => {
    it('should validate a valid compressed image', () => {
      const validImage = generateTestImage()
      const result = compressedImageSchema.safeParse(validImage)

      expect(result.success).toBe(true)
    })

    it('should reject image without dataUrl', () => {
      const invalidImage = { size: 1000, width: 800, height: 600 }
      const result = compressedImageSchema.safeParse(invalidImage)

      expect(result.success).toBe(false)
    })

    it('should reject invalid dataUrl format', () => {
      const invalidImage = generateTestImage({ dataUrl: 'not-a-data-url' })
      const result = compressedImageSchema.safeParse(invalidImage)

      expect(result.success).toBe(false)
    })

    it('should reject negative size', () => {
      const invalidImage = generateTestImage({ size: -100 })
      const result = compressedImageSchema.safeParse(invalidImage)

      expect(result.success).toBe(false)
    })

    it('should reject zero dimensions', () => {
      const invalidImage = generateTestImage({ width: 0, height: 0 })
      const result = compressedImageSchema.safeParse(invalidImage)

      expect(result.success).toBe(false)
    })

    it('should accept various image formats in dataUrl', () => {
      const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      formats.forEach(format => {
        const image = generateTestImage({ dataUrl: `data:${format};base64,test` })
        const result = compressedImageSchema.safeParse(image)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('formSubmissionSchema', () => {
    it('should validate a complete valid form submission', () => {
      const validForm = generateTestFormData()
      const result = formSubmissionSchema.safeParse(validForm)

      if (!result.success) {
        console.log('Validation errors:', result.error.flatten())
      }

      expect(result.success).toBe(true)
    })

    it('should require formType', () => {
      const invalidForm = generateTestFormData({ formType: '' })
      const result = formSubmissionSchema.safeParse(invalidForm)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('formType')
    })

    it('should require jobNumber', () => {
      const invalidForm = generateTestFormData({ jobNumber: '' })
      const result = formSubmissionSchema.safeParse(invalidForm)

      expect(result.success).toBe(false)
    })

    it('should validate submittedByEmail as email', () => {
      const invalidForm = generateTestFormData({ submittedByEmail: 'not-an-email' })
      const result = formSubmissionSchema.safeParse(invalidForm)

      expect(result.success).toBe(false)
    })

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ]

      validEmails.forEach(email => {
        const form = generateTestFormData({ submittedByEmail: email })
        const result = formSubmissionSchema.safeParse(form)
        expect(result.success).toBe(true)
      })
    })

    it('should validate date format', () => {
      const validForm = generateTestFormData()
      validForm.data.date = '2024-01-15'
      const result = formSubmissionSchema.safeParse(validForm)

      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const invalidForm = generateTestFormData()
      invalidForm.data.date = '01/15/2024' // Wrong format
      const result = formSubmissionSchema.safeParse(invalidForm)

      expect(result.success).toBe(false)
    })

    it('should validate time format', () => {
      const validForm = generateTestFormData()
      validForm.data.inspections[0].startTime = '09:30'
      validForm.data.inspections[0].endTime = '17:45'
      const result = formSubmissionSchema.safeParse(validForm)

      expect(result.success).toBe(true)
    })

    it('should reject invalid time format', () => {
      const invalidForm = generateTestFormData()
      invalidForm.data.inspections[0].startTime = '9:30 AM' // Wrong format
      const result = formSubmissionSchema.safeParse(invalidForm)

      expect(result.success).toBe(false)
    })

    it('should accept optional fields as undefined', () => {
      const form = generateTestFormData({
        signature: undefined,
        submittedAtLocal: undefined,
        emailOptions: undefined,
      })
      const result = formSubmissionSchema.safeParse(form)

      expect(result.success).toBe(true)
    })

    it('should validate inspection array', () => {
      const form = generateTestFormData()
      form.data.inspections.push({
        startTime: '14:00',
        endTime: '15:00',
        location: 'Building B',
        hazardDescription: 'Another hazard',
        correctiveMeasures: 'Fixed it',
        creatingEmployer: 'XYZ Corp',
        supervisor: 'John Smith',
      })

      const result = formSubmissionSchema.safeParse(form)
      expect(result.success).toBe(true)
    })

    it('should enforce max lengths', () => {
      const form = generateTestFormData({
        jobNumber: 'J'.repeat(100), // Max is 50
      })
      const result = formSubmissionSchema.safeParse(form)

      expect(result.success).toBe(false)
    })

    it('should validate nested email options', () => {
      const form = generateTestFormData({
        emailOptions: {
          recipientEmail: 'invalid-email',
          ccEmails: 'also-invalid',
        },
      })
      const result = formSubmissionSchema.safeParse(form)

      expect(result.success).toBe(false)
    })

    it('should handle missing required fields in inspection', () => {
      const form = generateTestFormData()
      form.data.inspections[0].location = ''
      const result = formSubmissionSchema.safeParse(form)

      expect(result.success).toBe(false)
    })
  })

  describe('signatureSchema', () => {
    it('should accept valid PNG signature', () => {
      const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const result = signatureSchema.safeParse(validSignature)

      expect(result.success).toBe(true)
    })

    it('should accept empty string (optional)', () => {
      const result = signatureSchema.safeParse('')

      expect(result.success).toBe(true)
    })

    it('should reject non-PNG signature', () => {
      const invalidSignature = 'data:image/jpeg;base64,test'
      const result = signatureSchema.safeParse(invalidSignature)

      expect(result.success).toBe(false)
    })

    it('should reject signature exceeding size limit', () => {
      const hugeSignature = 'data:image/png;base64,' + 'A'.repeat(2000000)
      const result = signatureSchema.safeParse(hugeSignature)

      expect(result.success).toBe(false)
    })

    it('should reject invalid data URL format', () => {
      const invalidSignature = 'not-a-data-url'
      const result = signatureSchema.safeParse(invalidSignature)

      expect(result.success).toBe(false)
    })
  })

  describe('adminLoginSchema', () => {
    it('should validate valid login', () => {
      const validLogin = { password: 'testPassword123' }
      const result = adminLoginSchema.safeParse(validLogin)

      expect(result.success).toBe(true)
    })

    it('should require password', () => {
      const invalidLogin = { password: '' }
      const result = adminLoginSchema.safeParse(invalidLogin)

      expect(result.success).toBe(false)
    })

    it('should reject missing password field', () => {
      const invalidLogin = {}
      const result = adminLoginSchema.safeParse(invalidLogin)

      expect(result.success).toBe(false)
    })

    it('should accept any non-empty password', () => {
      const passwords = ['short', 'VeryLongPassword123!@#', 'pass', '123', 'p']

      passwords.forEach(password => {
        const result = adminLoginSchema.safeParse({ password })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Email Allowlist', () => {
    describe('createEmailAllowlistSchema', () => {
      it('should validate allowed domain', () => {
        const schema = createEmailAllowlistSchema(['example.com', 'test.com'])
        const result = schema.safeParse('user@example.com')

        expect(result.success).toBe(true)
      })

      it('should reject disallowed domain', () => {
        const schema = createEmailAllowlistSchema(['example.com'])
        const result = schema.safeParse('user@other.com')

        expect(result.success).toBe(false)
      })

      it('should allow all emails when allowlist is empty', () => {
        const schema = createEmailAllowlistSchema([])
        const result = schema.safeParse('user@anything.com')

        expect(result.success).toBe(true)
      })

      it('should be case-insensitive', () => {
        const schema = createEmailAllowlistSchema(['Example.COM'])
        const result1 = schema.safeParse('user@example.com')
        const result2 = schema.safeParse('user@EXAMPLE.com')

        expect(result1.success).toBe(true)
        expect(result2.success).toBe(true)
      })

      it('should handle multiple allowed domains', () => {
        const schema = createEmailAllowlistSchema(['example.com', 'test.com', 'demo.org'])

        expect(schema.safeParse('user@example.com').success).toBe(true)
        expect(schema.safeParse('user@test.com').success).toBe(true)
        expect(schema.safeParse('user@demo.org').success).toBe(true)
        expect(schema.safeParse('user@other.com').success).toBe(false)
      })
    })

    describe('getAllowedEmailDomains', () => {
      it('should parse comma-separated domains', () => {
        const originalAllowlist = process.env.EMAIL_ALLOWLIST
        process.env.EMAIL_ALLOWLIST = 'example.com,test.com,demo.org'

        const domains = getAllowedEmailDomains()

        expect(domains).toEqual(['example.com', 'test.com', 'demo.org'])

        process.env.EMAIL_ALLOWLIST = originalAllowlist
      })

      it('should return empty array when not set', () => {
        const originalAllowlist = process.env.EMAIL_ALLOWLIST
        delete process.env.EMAIL_ALLOWLIST

        const domains = getAllowedEmailDomains()

        expect(domains).toEqual([])

        process.env.EMAIL_ALLOWLIST = originalAllowlist
      })

      it('should handle empty string', () => {
        const originalAllowlist = process.env.EMAIL_ALLOWLIST
        process.env.EMAIL_ALLOWLIST = ''

        const domains = getAllowedEmailDomains()

        expect(domains).toEqual([])

        process.env.EMAIL_ALLOWLIST = originalAllowlist
      })

      it('should trim whitespace', () => {
        const originalAllowlist = process.env.EMAIL_ALLOWLIST
        process.env.EMAIL_ALLOWLIST = '  example.com  ,  test.com  '

        const domains = getAllowedEmailDomains()

        expect(domains).toEqual(['example.com', 'test.com'])

        process.env.EMAIL_ALLOWLIST = originalAllowlist
      })
    })

    describe('validateEmailAllowlist', () => {
      it('should validate allowed email', () => {
        const result = validateEmailAllowlist('user@example.com')

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should allow all emails when allowlist is empty', () => {
        const originalAllowlist = process.env.EMAIL_ALLOWLIST
        process.env.EMAIL_ALLOWLIST = ''

        const result = validateEmailAllowlist('user@anything.com')

        expect(result.valid).toBe(true)

        process.env.EMAIL_ALLOWLIST = originalAllowlist
      })

      it('should provide error message for disallowed domain', () => {
        const originalAllowlist = process.env.EMAIL_ALLOWLIST
        process.env.EMAIL_ALLOWLIST = 'example.com,test.com'

        const result = validateEmailAllowlist('user@other.com')

        expect(result.valid).toBe(false)
        expect(result.error).toContain('not allowed')
        expect(result.error).toContain('example.com')

        process.env.EMAIL_ALLOWLIST = originalAllowlist
      })

      it('should be case-insensitive', () => {
        const result1 = validateEmailAllowlist('user@EXAMPLE.COM')
        const result2 = validateEmailAllowlist('USER@example.com')

        expect(result1.valid).toBe(true)
        expect(result2.valid).toBe(true)
      })
    })
  })

  describe('Edge Cases and Security', () => {
    it('should handle XSS attempts in form fields', () => {
      const xssForm = generateTestFormData({
        submittedBy: '<script>alert("xss")</script>',
        jobNumber: '"><img src=x onerror=alert(1)>',
      })

      const result = formSubmissionSchema.safeParse(xssForm)

      // Should still validate (sanitization happens separately)
      expect(result.success).toBe(true)
    })

    it('should handle SQL injection attempts', () => {
      const sqlForm = generateTestFormData({
        jobNumber: "'; DROP TABLE users; --",
        submittedBy: "' OR '1'='1",
      })

      const result = formSubmissionSchema.safeParse(sqlForm)

      expect(result.success).toBe(true) // Validation passes, but DB layer should handle this
    })

    it('should handle unicode characters', () => {
      const unicodeForm = generateTestFormData({
        submittedBy: '李明 (李さん)',
        submittedByCompany: 'شركة الاختبار',
        jobNumber: 'JOB-2024-日本',
      })

      const result = formSubmissionSchema.safeParse(unicodeForm)

      expect(result.success).toBe(true)
    })

    it('should handle very long text fields within limits', () => {
      const form = generateTestFormData()
      form.data.inspections[0].hazardDescription = 'A'.repeat(1999) // Just under 2000 limit

      const result = formSubmissionSchema.safeParse(form)

      expect(result.success).toBe(true)
    })

    it('should reject text exceeding limits', () => {
      const form = generateTestFormData()
      form.data.inspections[0].hazardDescription = 'A'.repeat(2001) // Over 2000 limit

      const result = formSubmissionSchema.safeParse(form)

      expect(result.success).toBe(false)
    })
  })
})
