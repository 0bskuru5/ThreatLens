const {
  analyzeEventCorrelations,
  calculateThreatScore,
  CORRELATION_RULES
} = require('../../services/eventCorrelation')

describe('Event Correlation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateThreatScore', () => {
    test('should calculate correct threat score for low severity event', () => {
      const event = {
        id: 1,
        event_type: 'failed_login',
        severity: 'low',
        source_ip: '192.168.1.100'
      }
      const correlations = []

      const score = calculateThreatScore(event, correlations)

      expect(score).toBe(10) // Base score for low severity
    })

    test('should calculate correct threat score for high severity event', () => {
      const event = {
        id: 1,
        event_type: 'sql_injection',
        severity: 'high',
        source_ip: '192.168.1.100'
      }
      const correlations = []

      const score = calculateThreatScore(event, correlations)

      expect(score).toBe(70) // Base score for high severity
    })

    test('should add correlation bonuses to threat score', () => {
      const event = {
        id: 1,
        event_type: 'failed_login',
        severity: 'medium',
        source_ip: '192.168.1.100'
      }
      const correlations = [
        { type: 'brute_force', severity: 'high', confidence: 0.8 },
        { type: 'suspicious_ip', severity: 'medium', confidence: 0.6 }
      ]

      const score = calculateThreatScore(event, correlations)

      // Base score (30) + high correlation (30) + medium correlation (15) = 75
      expect(score).toBe(75)
    })

    test('should cap threat score at 100', () => {
      const event = {
        id: 1,
        event_type: 'sql_injection',
        severity: 'critical',
        source_ip: '192.168.1.100'
      }
      const correlations = [
        { type: 'brute_force', severity: 'critical', confidence: 1.0 },
        { type: 'suspicious_ip', severity: 'critical', confidence: 1.0 },
        { type: 'rapid_scanning', severity: 'critical', confidence: 1.0 }
      ]

      const score = calculateThreatScore(event, correlations)

      expect(score).toBe(100) // Should be capped at 100
    })
  })

  describe('analyzeEventCorrelations', () => {
    test('should detect brute force attacks', async () => {
      // Mock database query for brute force detection
      const mockQuery = jest.fn()
      require('../../config/database').query = mockQuery

      // Mock query result showing multiple failed logins
      mockQuery.mockResolvedValue({
        rows: [{ attempt_count: 6 }] // Above threshold of 5
      })

      const event = {
        id: 1,
        event_type: 'failed_login',
        severity: 'medium',
        source_ip: '192.168.1.100'
      }

      const correlations = await analyzeEventCorrelations(event)

      expect(correlations).toHaveLength(1)
      expect(correlations[0].type).toBe('brute_force_attack')
      expect(correlations[0].severity).toBe('high')
      expect(correlations[0].evidence.attempts).toBe(6)
    })

    test('should detect suspicious IP activity', async () => {
      const mockQuery = jest.fn()
      require('../../config/database').query = mockQuery

      // Mock query result showing high activity from single IP
      mockQuery.mockResolvedValue({
        rows: [{
          total_events: 15, // Above threshold of 10
          unique_event_types: 4, // Above threshold of 3
          event_types: ['failed_login', 'sql_injection', 'xss_attempt', 'unauthorized_access']
        }]
      })

      const event = {
        id: 1,
        event_type: 'unauthorized_access',
        severity: 'high',
        source_ip: '192.168.1.100'
      }

      const correlations = await analyzeEventCorrelations(event)

      expect(correlations).toHaveLength(1)
      expect(correlations[0].type).toBe('suspicious_ip_activity')
      expect(correlations[0].evidence.total_events).toBe(15)
    })

    test('should detect rapid scanning', async () => {
      const mockQuery = jest.fn()
      require('../../config/database').query = mockQuery

      // Mock query result showing rapid scanning pattern
      mockQuery.mockResolvedValue({
        rows: [{ unique_paths: 25 }] // Above threshold of 20
      })

      const event = {
        id: 1,
        event_type: 'unauthorized_access',
        severity: 'medium',
        source_ip: '192.168.1.100'
      }

      const correlations = await analyzeEventCorrelations(event)

      expect(correlations).toHaveLength(1)
      expect(correlations[0].type).toBe('rapid_scanning')
      expect(correlations[0].severity).toBe('high')
    })

    test('should return empty array when no correlations found', async () => {
      const mockQuery = jest.fn()
      require('../../config/database').query = mockQuery

      // Mock query results below thresholds
      mockQuery.mockResolvedValue({
        rows: [{ attempt_count: 2 }] // Below brute force threshold
      })

      const event = {
        id: 1,
        event_type: 'failed_login',
        severity: 'low',
        source_ip: '192.168.1.100'
      }

      const correlations = await analyzeEventCorrelations(event)

      expect(correlations).toHaveLength(0)
    })
  })

  describe('CORRELATION_RULES', () => {
    test('should have correct brute force configuration', () => {
      expect(CORRELATION_RULES.BRUTE_FORCE).toEqual({
        window_minutes: 15,
        max_attempts: 5,
        event_types: ['failed_login']
      })
    })

    test('should have correct suspicious IP configuration', () => {
      expect(CORRELATION_RULES.SUSPICIOUS_IP).toEqual({
        window_hours: 24,
        max_events: 10,
        different_types: 3
      })
    })

    test('should have correct rapid scanning configuration', () => {
      expect(CORRELATION_RULES.RAPID_SCANNING).toEqual({
        window_minutes: 5,
        max_unique_paths: 20,
        event_types: ['unauthorized_access', 'suspicious_activity']
      })
    })
  })
})
