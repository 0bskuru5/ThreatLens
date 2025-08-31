module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: [
    '<rootDir>/server/**/__tests__/**/*.test.js',
    '<rootDir>/server/**/*.test.js'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/config/database.js',
    '!server/scripts/**/*.js',
    '!server/**/*.test.js',
    '!server/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.js'],
  testTimeout: 30000, // Increased timeout for CI
  verbose: true,
}
