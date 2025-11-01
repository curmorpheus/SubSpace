// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-security'
process.env.ADMIN_PASSWORD_HASH = '$2a$10$test.hash.for.testing.purposes.only.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
process.env.NODE_ENV = 'test'
process.env.POSTGRES_URL = 'postgresql://test:test@localhost:5432/test'
process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token'
process.env.RESEND_API_KEY = 'test-resend-api-key'
process.env.EMAIL_FROM = 'test@example.com'
process.env.EMAIL_ALLOWLIST = 'example.com,test.com'

// Polyfill Request and Response for Node.js environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      const url = typeof input === 'string' ? input : input?.url || 'http://localhost:3000'

      // Define read-only properties
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
      })

      Object.defineProperty(this, 'method', {
        value: init.method || 'GET',
        writable: false,
        enumerable: true,
      })

      this.headers = new Headers(init.headers || {})
      this.body = init.body || null
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      })
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      Object.defineProperty(this, 'status', {
        value: init.status || 200,
        writable: false,
        enumerable: true,
      })
      Object.defineProperty(this, 'statusText', {
        value: init.statusText || 'OK',
        writable: false,
        enumerable: true,
      })
      this.headers = new Headers(init.headers || {})
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      })
    }

    json() {
      return Promise.resolve(JSON.parse(this.body))
    }

    text() {
      return Promise.resolve(String(this.body))
    }
  }
}

// Polyfill Headers
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value)
        })
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase()) || null
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), String(value))
    }

    has(name) {
      return this._headers.has(name.toLowerCase())
    }

    delete(name) {
      this._headers.delete(name.toLowerCase())
    }

    forEach(callback) {
      this._headers.forEach((value, key) => callback(value, key, this))
    }

    entries() {
      return this._headers.entries()
    }

    keys() {
      return this._headers.keys()
    }

    values() {
      return this._headers.values()
    }
  }
}

// Mock jose module to avoid ES module issues
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(function(payload) {
    this.payload = payload
    this.setProtectedHeader = jest.fn().mockReturnThis()
    this.setIssuedAt = jest.fn().mockReturnThis()
    this.setExpirationTime = jest.fn().mockReturnThis()
    this.sign = jest.fn().mockResolvedValue('mocked.jwt.token')
    return this
  }),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
  }),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        id: 'test-email-id',
        from: 'test@example.com',
        to: 'recipient@example.com',
      }),
    },
  })),
}))

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({
    url: 'https://test-blob-url.com/test-file',
    pathname: '/test-file',
    contentType: 'application/pdf',
    contentDisposition: 'attachment; filename="test.pdf"',
  }),
  del: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({
    blobs: [],
    cursor: null,
  }),
}))

// Mock canvas for SignaturePad tests
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}))

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test')
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob(['test'], { type: 'image/png' }))
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock FileReader for image upload tests
global.FileReader = jest.fn().mockImplementation(function() {
  this.readAsDataURL = jest.fn(function(blob) {
    this.onload({ target: { result: 'data:image/jpeg;base64,test' } })
  })
  this.result = 'data:image/jpeg;base64,test'
})

// Mock Image for image compression tests
global.Image = jest.fn().mockImplementation(function() {
  this.src = ''
  this.width = 100
  this.height = 100
  this.onload = null
  this.onerror = null

  Object.defineProperty(this, 'src', {
    set: function(value) {
      this._src = value
      if (this.onload) {
        setTimeout(() => this.onload(), 0)
      }
    },
    get: function() {
      return this._src
    }
  })
})

// Suppress console errors in tests (optional - comment out if you want to see them)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
