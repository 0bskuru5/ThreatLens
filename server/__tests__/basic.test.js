const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

describe('Basic Server Tests', () => {
  let app

  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express()

    // Basic middleware
    app.use(helmet())
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }))
    app.use(express.json())

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      })
    })

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' })
    })

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      })
    })
  })

  test('should respond to health check', async () => {
    const request = require('supertest')
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body).toHaveProperty('status', 'OK')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('uptime')
  })

  test('should return 404 for unknown routes', async () => {
    const request = require('supertest')
    const response = await request(app)
      .get('/unknown-route')
      .expect(404)

    expect(response.body).toHaveProperty('error', 'Route not found')
  })

  test('should handle CORS', async () => {
    const request = require('supertest')
    const response = await request(app)
      .options('/health')
      .expect(200)

    expect(response.headers).toHaveProperty('access-control-allow-origin')
  })

  test('should have proper security headers', async () => {
    const request = require('supertest')
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.headers).toHaveProperty('x-frame-options')
    expect(response.headers).toHaveProperty('x-content-type-options')
    expect(response.headers).toHaveProperty('x-xss-protection')
  })
})
