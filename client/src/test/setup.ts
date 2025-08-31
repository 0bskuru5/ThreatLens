// Simplified test setup for CI environment
import { expect } from 'vitest'

// Basic setup for CI environment
process.env.NODE_ENV = 'test'

// Minimal global test utilities
global.testUtils = {
  // Helper to create basic mock objects
  createMockElement: (tagName = 'div') => ({
    tagName: tagName.toUpperCase(),
    className: '',
    style: {},
  }),

  // Helper to simulate async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock functions
  createMockFn: (returnValue = undefined) => vi.fn().mockReturnValue(returnValue),
}
