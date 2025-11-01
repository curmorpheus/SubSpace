import { generateImpalementProtectionPDF } from '@/lib/pdf-generator'
import { generateTestFormData, generateTestImage } from '@/test-utils'

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: jest.fn(() => 210),
        getHeight: jest.fn(() => 297),
      },
    },
    setFillColor: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    rect: jest.fn(),
    line: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    addPage: jest.fn(),
    splitTextToSize: jest.fn((text) => [text]),
    output: jest.fn(() => new ArrayBuffer(100)),
  }))
})

describe('PDF Generator', () => {
  describe('generateImpalementProtectionPDF', () => {
    it('should generate a PDF buffer', () => {
      const formData = generateTestFormData()
      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
        submittedAt: new Date().toISOString(),
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })

    it('should handle form with no signature', () => {
      const formData = generateTestFormData({ signature: undefined })
      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle form with signature', () => {
      const formData = generateTestFormData()
      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, {
        ...formData.data,
        signature: 'data:image/png;base64,test',
      })

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle multiple inspections', () => {
      const formData = generateTestFormData()

      // Add multiple inspections
      formData.data.inspections.push({
        startTime: '14:00',
        endTime: '15:00',
        location: 'Building B, Floor 2',
        hazardDescription: 'Second hazard found',
        correctiveMeasures: 'Corrected second hazard',
        creatingEmployer: 'XYZ Construction',
        supervisor: 'Bob Johnson',
      })

      formData.data.inspections.push({
        startTime: '16:00',
        endTime: '17:00',
        location: 'Building C, Floor 1',
        hazardDescription: 'Third hazard identified',
        correctiveMeasures: 'Fixed third hazard',
        creatingEmployer: 'DEF Builders',
        supervisor: 'Alice Williams',
      })

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle inspections with photos', () => {
      const formData = generateTestFormData()

      // Add photos to inspection
      formData.data.inspections[0].locationPhotos = [
        generateTestImage(),
        generateTestImage(),
      ]
      formData.data.inspections[0].hazardPhotos = [
        generateTestImage(),
      ]
      formData.data.inspections[0].measuresPhotos = [
        generateTestImage(),
        generateTestImage(),
        generateTestImage(),
      ]

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle long text descriptions', () => {
      const formData = generateTestFormData()

      formData.data.inspections[0].hazardDescription = 'A'.repeat(1500)
      formData.data.inspections[0].correctiveMeasures = 'B'.repeat(1500)

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle special characters in text', () => {
      const formData = generateTestFormData()

      formData.data.inspections[0].location = 'Building & Safety Area #1 (Level 2)'
      formData.data.inspections[0].hazardDescription = 'Hazard with "quotes" and \'apostrophes\''
      formData.data.inspections[0].supervisor = 'O\'Brien & Sons'

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: 'Company & Co.',
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle unicode characters', () => {
      const formData = generateTestFormData()

      formData.data.inspections[0].location = 'Building 建物 - Floor 階'
      formData.data.inspections[0].supervisor = '李明 (Manager)'

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: 'José García',
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: 'شركة البناء',
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle empty photo arrays', () => {
      const formData = generateTestFormData()

      formData.data.inspections[0].locationPhotos = []
      formData.data.inspections[0].hazardPhotos = []
      formData.data.inspections[0].measuresPhotos = []

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle submission without timestamp', () => {
      const formData = generateTestFormData()

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
        // No submittedAt
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle submission with timestamp', () => {
      const formData = generateTestFormData()

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
        submittedAt: '2024-01-15 14:30:00 PST',
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle maximum number of photos', () => {
      const formData = generateTestFormData()

      // Add many photos
      formData.data.inspections[0].locationPhotos = Array.from({ length: 5 }, () =>
        generateTestImage()
      )
      formData.data.inspections[0].hazardPhotos = Array.from({ length: 5 }, () =>
        generateTestImage()
      )
      formData.data.inspections[0].measuresPhotos = Array.from({ length: 5 }, () =>
        generateTestImage()
      )

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should create consistent output for same input', () => {
      const formData = generateTestFormData()

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer1 = generateImpalementProtectionPDF(submissionInfo, formData.data)
      const pdfBuffer2 = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer1.length).toBe(pdfBuffer2.length)
    })

    it('should handle single inspection', () => {
      const formData = generateTestFormData()
      // Only one inspection (already default)

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle minimal required data', () => {
      const minimalFormData = {
        date: '2024-01-15',
        inspections: [
          {
            startTime: '09:00',
            endTime: '10:00',
            location: 'Site A',
            hazardDescription: 'Hazard',
            correctiveMeasures: 'Fixed',
            creatingEmployer: 'Company',
            supervisor: 'John',
          },
        ],
      }

      const submissionInfo = {
        jobNumber: 'JOB-001',
        submittedBy: 'Test',
        submittedByEmail: 'test@example.com',
        submittedByCompany: 'Test Co',
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, minimalFormData)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle different date formats', () => {
      const formData = generateTestFormData()
      formData.data.date = '2024-12-31'

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })

    it('should handle different time formats', () => {
      const formData = generateTestFormData()
      formData.data.inspections[0].startTime = '00:00'
      formData.data.inspections[0].endTime = '23:59'

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, formData.data)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid image data gracefully', () => {
      const formData = generateTestFormData()

      // Add invalid image
      formData.data.inspections[0].locationPhotos = [
        {
          dataUrl: 'invalid-data',
          size: 100,
          width: 10,
          height: 10,
        },
      ]

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      // Should not throw
      expect(() => {
        generateImpalementProtectionPDF(submissionInfo, formData.data)
      }).not.toThrow()
    })

    it('should handle invalid signature gracefully', () => {
      const formData = generateTestFormData()

      const submissionInfo = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
      }

      const dataWithBadSignature = {
        ...formData.data,
        signature: 'invalid-signature-data',
      }

      // Should not throw
      expect(() => {
        generateImpalementProtectionPDF(submissionInfo, dataWithBadSignature)
      }).not.toThrow()
    })
  })
})
