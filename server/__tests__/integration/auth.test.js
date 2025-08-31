const request = require('supertest')
const app = require('../../index')
const { query } = require('../../config/database')

describe('Authentication API', () => {
  beforeAll(async () => {
    // Ensure test database is clean
    await query('DELETE FROM users WHERE username LIKE \'test-%\'')
  })

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM users WHERE username LIKE \'test-%\'')
  })

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.username).toBe('admin')
    })

    test('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.error).toBe('Invalid credentials')
    })

    test('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' })
        .expect(400)

      expect(response.body.error).toBe('Username and password are required')
    })

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401)

      expect(response.body.error).toBe('Invalid credentials')
    })
  })

  describe('GET /api/auth/verify', () => {
    let token

    beforeAll(async () => {
      // Get a valid token for testing
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })

      token = loginResponse.body.token
    })

    test('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.valid).toBe(true)
      expect(response.body.user).toHaveProperty('username', 'admin')
    })

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.error).toBe('Invalid token')
    })

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401)

      expect(response.body.error).toBe('No token provided')
    })
  })
})
