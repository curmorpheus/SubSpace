import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUpload from '@/components/ImageUpload'
import { createMockFile, generateTestImage } from '@/test-utils'
import * as imageCompression from '@/lib/image-compression'

// Mock image compression
jest.mock('@/lib/image-compression', () => ({
  compressImage: jest.fn(),
  formatFileSize: jest.fn((size) => `${(size / 1024).toFixed(1)}KB`),
}))

describe('ImageUpload Component', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(imageCompression.compressImage as jest.Mock).mockResolvedValue(generateTestImage())
  })

  describe('Rendering', () => {
    it('should render upload button', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      expect(screen.getByText('Upload Photos')).toBeInTheDocument()
    })

    it('should show count badge', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      expect(screen.getByText('0/5')).toBeInTheDocument()
    })

    it('should show custom max images in badge', () => {
      render(
        <ImageUpload
          label="Upload Photos"
          images={[]}
          onChange={mockOnChange}
          maxImages={3}
        />
      )

      expect(screen.getByText('0/3')).toBeInTheDocument()
    })

    it('should show camera icon', () => {
      const { container } = render(
        <ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render hidden file input', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('hidden')
    })
  })

  describe('Image Selection', () => {
    it('should accept image file selection', async () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(imageCompression.compressImage).toHaveBeenCalled()
      })
    })

    it('should call onChange with compressed images', async () => {
      const compressedImage = generateTestImage()
      ;(imageCompression.compressImage as jest.Mock).mockResolvedValue(compressedImage)

      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([compressedImage])
      })
    })

    it('should handle multiple file selection', async () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [
        createMockFile('test1.jpg'),
        createMockFile('test2.jpg'),
        createMockFile('test3.jpg'),
      ]

      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(imageCompression.compressImage).toHaveBeenCalledTimes(3)
      })
    })

    it('should append to existing images', async () => {
      const existingImages = [generateTestImage()]
      const newImage = generateTestImage({ size: 600 })
      ;(imageCompression.compressImage as jest.Mock).mockResolvedValue(newImage)

      render(
        <ImageUpload label="Upload Photos" images={existingImages} onChange={mockOnChange} />
      )

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('new.jpg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([...existingImages, newImage])
      })
    })

    it('should show uploading state', async () => {
      ;(imageCompression.compressImage as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(generateTestImage()), 100))
      )

      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument()
      })
    })
  })

  describe('Image Display', () => {
    it('should display uploaded images', () => {
      const images = [
        generateTestImage({ size: 1000 }),
        generateTestImage({ size: 2000 }),
      ]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const displayedImages = screen.getAllByRole('img')
      expect(displayedImages.length).toBeGreaterThanOrEqual(2)
    })

    it('should show file size for each image', () => {
      const images = [generateTestImage({ size: 1024 })]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      expect(screen.getByText('1.0KB')).toBeInTheDocument()
    })

    it('should show remove button on hover', () => {
      const images = [generateTestImage()]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const removeButtons = screen.getAllByTitle('Remove photo')
      expect(removeButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should update count badge with current images', () => {
      const images = [generateTestImage(), generateTestImage()]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      expect(screen.getByText('2/5')).toBeInTheDocument()
    })
  })

  describe('Image Removal', () => {
    it('should remove image when remove button clicked', () => {
      const images = [generateTestImage(), generateTestImage()]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const removeButtons = screen.getAllByTitle('Remove photo')
      fireEvent.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith([images[1]])
    })

    it('should remove all images individually', () => {
      const images = [generateTestImage(), generateTestImage()]

      const { rerender } = render(
        <ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />
      )

      // Remove first image
      let removeButtons = screen.getAllByTitle('Remove photo')
      fireEvent.click(removeButtons[0])
      expect(mockOnChange).toHaveBeenCalledWith([images[1]])

      // Update component with new images
      rerender(
        <ImageUpload label="Upload Photos" images={[images[1]]} onChange={mockOnChange} />
      )

      // Remove second image
      removeButtons = screen.getAllByTitle('Remove photo')
      fireEvent.click(removeButtons[0])
      expect(mockOnChange).toHaveBeenCalledWith([])
    })

    it('should clear error when removing image', () => {
      const images = [generateTestImage()]

      render(
        <ImageUpload
          label="Upload Photos"
          images={images}
          onChange={mockOnChange}
          maxImages={1}
        />
      )

      const removeButton = screen.getByTitle('Remove photo')
      fireEvent.click(removeButton)

      // Error should be cleared
      expect(screen.queryByText(/Maximum/)).not.toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should reject non-image files', async () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('document.pdf', 1024, 'application/pdf')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Only image files are allowed')).toBeInTheDocument()
      })

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should enforce max images limit', async () => {
      const images = [generateTestImage(), generateTestImage()]

      render(
        <ImageUpload
          label="Upload Photos"
          images={images}
          onChange={mockOnChange}
          maxImages={3}
        />
      )

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [createMockFile('test1.jpg'), createMockFile('test2.jpg')]

      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(screen.getByText('Maximum 3 photos allowed')).toBeInTheDocument()
      })
    })

    it('should enforce total size limit', async () => {
      const largeImage = generateTestImage({ size: 10 * 1024 * 1024 }) // 10MB
      ;(imageCompression.compressImage as jest.Mock).mockResolvedValue(largeImage)

      render(
        <ImageUpload
          label="Upload Photos"
          images={[]}
          onChange={mockOnChange}
          maxSizeMB={15}
        />
      )

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [createMockFile('test1.jpg'), createMockFile('test2.jpg')]

      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(screen.getByText(/Total image size would exceed 15MB limit/)).toBeInTheDocument()
      })
    })

    it('should disable upload when max images reached', () => {
      const images = Array.from({ length: 5 }, () => generateTestImage())

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const label = screen.getByText('Upload Photos').closest('label')
      expect(label).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('Error Handling', () => {
    it('should show error message', async () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.txt', 1024, 'text/plain')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        const errorMessage = screen.getByText('Only image files are allowed')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-600')
      })
    })

    it('should handle compression errors', async () => {
      ;(imageCompression.compressImage as jest.Mock).mockRejectedValue(
        new Error('Compression failed')
      )

      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(
          screen.getByText('Failed to process images. Please try again.')
        ).toBeInTheDocument()
      })
    })

    it('should clear error on successful upload', async () => {
      const { rerender } = render(
        <ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />
      )

      // Trigger error
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const badFile = createMockFile('test.txt', 1024, 'text/plain')
      fireEvent.change(input, { target: { files: [badFile] } })

      await waitFor(() => {
        expect(screen.getByText('Only image files are allowed')).toBeInTheDocument()
      })

      // Upload valid file
      const goodFile = createMockFile('test.jpg')
      fireEvent.change(input, { target: { files: [goodFile] } })

      await waitFor(() => {
        expect(screen.queryByText('Only image files are allowed')).not.toBeInTheDocument()
      })
    })

    it('should handle empty file list', async () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [] } })

      // Should not call onChange
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('UI States', () => {
    it('should show correct badge color when empty', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const badge = screen.getByText('0/5')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-600')
    })

    it('should show correct badge color when has images', () => {
      const images = [generateTestImage()]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const badge = screen.getByText('1/5')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should show correct badge color when at max', () => {
      const images = Array.from({ length: 5 }, () => generateTestImage())

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const badge = screen.getByText('5/5')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-700')
    })

    it('should have proper hover styles', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const label = screen.getByText('Upload Photos').closest('label')
      expect(label).toHaveClass('hover:bg-gray-50', 'hover:border-blue-400')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input).toHaveAttribute('accept', 'image/*')
      expect(input).toHaveAttribute('multiple')
    })

    it('should have accessible label', () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const label = screen.getByText('Upload Photos').closest('label')
      expect(label).toHaveAttribute('for')
    })

    it('should have accessible remove buttons', () => {
      const images = [generateTestImage()]

      render(<ImageUpload label="Upload Photos" images={images} onChange={mockOnChange} />)

      const removeButton = screen.getByTitle('Remove photo')
      expect(removeButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large number of images', () => {
      const images = Array.from({ length: 100 }, () => generateTestImage())

      render(
        <ImageUpload
          label="Upload Photos"
          images={images}
          onChange={mockOnChange}
          maxImages={100}
        />
      )

      expect(screen.getByText('100/100')).toBeInTheDocument()
    })

    it('should reset file input after upload', async () => {
      render(<ImageUpload label="Upload Photos" images={[]} onChange={mockOnChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })
  })
})
