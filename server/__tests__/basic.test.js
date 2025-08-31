const request = require('supertest')
const app = require('../index')

describe('Basic API Tests', () => {
  test('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body).toHaveProperty('status', 'OK')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('uptime')
  })

  test('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404)

    expect(response.body).toHaveProperty('error', 'Route not found')
  })

  test('should handle CORS', async () => {
    const response = await request(app)
      .options('/health')
      .expect(200)

    expect(response.headers).toHaveProperty('access-control-allow-origin')
  })
})
