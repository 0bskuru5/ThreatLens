// Test setup file
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DB_HOST = process.env.DB_HOST || 'localhost'
process.env.DB_PORT = process.env.DB_PORT || '5432'
process.env.DB_NAME = process.env.DB_NAME || 'threatlens_test'
process.env.DB_USER = process.env.DB_USER || 'postgres'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'

// Mock external services
jest.mock('../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: {
    connect: jest.fn(),
    end: jest.fn(),
  },
  testConnection: jest.fn().mockResolvedValue(true)
}))

// Mock axios for external API calls
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}))

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}))

// Global test utilities
global.testUtils = {
  // Helper to create mock request/response objects
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),

  createMockRes: (overrides = {}) => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      ...overrides
    }
    return res
  },

  createMockNext: () => jest.fn()
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
})
