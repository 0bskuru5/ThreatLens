const { query } = require('../config/database');
const { getGeolocation, getThreatLevel } = require('./geolocation');

// Correlation rules and thresholds
const CORRELATION_RULES = {
  BRUTE_FORCE: {
    window_minutes: 15,
    max_attempts: 5,
    event_types: ['failed_login']
  },
  SUSPICIOUS_IP: {
    window_hours: 24,
    max_events: 10,
    different_types: 3
  },
  RAPID_SCANNING: {
    window_minutes: 5,
    max_unique_paths: 20,
    event_types: ['unauthorized_access', 'suspicious_activity']
  }
};

/**
 * Analyze security events for correlations and patterns
 * @param {Object} event - The security event to analyze
 * @returns {Promise<Array>} Array of correlations found
 */
async function analyzeEventCorrelations(event) {
  const correlations = [];

  try {
    // Check for brute force attacks
    const bruteForceCorrelation = await detectBruteForce(event);
    if (bruteForceCorrelation) {
      correlations.push(bruteForceCorrelation);
    }

    // Check for suspicious IP activity
    const suspiciousIPCorrelation = await detectSuspiciousIP(event);
    if (suspiciousIPCorrelation) {
      correlations.push(suspiciousIPCorrelation);
    }

    // Check for rapid scanning
    const scanningCorrelation = await detectRapidScanning(event);
    if (scanningCorrelation) {
      correlations.push(scanningCorrelation);
    }

    // Check for geographic anomalies
    const geographicCorrelation = await detectGeographicAnomalies(event);
    if (geographicCorrelation) {
      correlations.push(geographicCorrelation);
    }

    return correlations;
  } catch (error) {
    console.error('Error analyzing event correlations:', error);
    return correlations;
  }
}

/**
 * Detect brute force attacks
 * @param {Object} event - Security event to check
 * @returns {Promise<Object|null>} Brute force correlation or null
 */
async function detectBruteForce(event) {
  if (!CORRELATION_RULES.BRUTE_FORCE.event_types.includes(event.event_type)) {
    return null;
  }

  try {
    const sql = `
      SELECT COUNT(*) as attempt_count
      FROM security_events
      WHERE source_ip = $1
        AND event_type = $2
        AND created_at >= NOW() - INTERVAL '${CORRELATION_RULES.BRUTE_FORCE.window_minutes} minutes'
    `;

    const result = await query(sql, [event.source_ip, event.event_type]);
    const attemptCount = parseInt(result.rows[0].attempt_count);

    if (attemptCount >= CORRELATION_RULES.BRUTE_FORCE.max_attempts) {
      return {
        type: 'brute_force_attack',
        severity: 'high',
        confidence: Math.min(attemptCount / CORRELATION_RULES.BRUTE_FORCE.max_attempts, 1),
        description: `Brute force attack detected: ${attemptCount} failed attempts from ${event.source_ip}`,
        evidence: {
          ip_address: event.source_ip,
          attempts: attemptCount,
          time_window: `${CORRELATION_RULES.BRUTE_FORCE.window_minutes} minutes`,
          event_type: event.event_type
        },
        recommendations: [
          'Block IP address temporarily',
          'Implement rate limiting',
          'Alert security team',
          'Review authentication logs'
        ]
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting brute force:', error);
    return null;
  }
}

/**
 * Detect suspicious IP activity
 * @param {Object} event - Security event to check
 * @returns {Promise<Object|null>} Suspicious IP correlation or null
 */
async function detectSuspiciousIP(event) {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT event_type) as unique_event_types,
        array_agg(DISTINCT event_type) as event_types
      FROM security_events
      WHERE source_ip = $1
        AND created_at >= NOW() - INTERVAL '${CORRELATION_RULES.SUSPICIOUS_IP.window_hours} hours'
    `;

    const result = await query(sql, [event.source_ip]);
    const { total_events, unique_event_types, event_types } = result.rows[0];

    if (total_events >= CORRELATION_RULES.SUSPICIOUS_IP.max_events &&
        unique_event_types >= CORRELATION_RULES.SUSPICIOUS_IP.different_types) {

      return {
        type: 'suspicious_ip_activity',
        severity: 'medium',
        confidence: Math.min(total_events / CORRELATION_RULES.SUSPICIOUS_IP.max_events, 1),
        description: `Suspicious activity detected from ${event.source_ip}: ${total_events} events of ${unique_event_types} different types`,
        evidence: {
          ip_address: event.source_ip,
          total_events: total_events,
          unique_event_types: unique_event_types,
          event_types: event_types,
          time_window: `${CORRELATION_RULES.SUSPICIOUS_IP.window_hours} hours`
        },
        recommendations: [
          'Monitor IP closely',
          'Check IP reputation',
          'Implement additional authentication',
          'Review access patterns'
        ]
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting suspicious IP:', error);
    return null;
  }
}

/**
 * Detect rapid scanning activity
 * @param {Object} event - Security event to check
 * @returns {Promise<Object|null>} Scanning correlation or null
 */
async function detectRapidScanning(event) {
  if (!CORRELATION_RULES.RAPID_SCANNING.event_types.includes(event.event_type)) {
    return null;
  }

  try {
    const sql = `
      SELECT COUNT(DISTINCT request_path) as unique_paths
      FROM security_events
      WHERE source_ip = $1
        AND event_type = ANY($2)
        AND created_at >= NOW() - INTERVAL '${CORRELATION_RULES.RAPID_SCANNING.window_minutes} minutes'
    `;

    const result = await query(sql, [event.source_ip, CORRELATION_RULES.RAPID_SCANNING.event_types]);
    const uniquePaths = parseInt(result.rows[0].unique_paths);

    if (uniquePaths >= CORRELATION_RULES.RAPID_SCANNING.max_unique_paths) {
      return {
        type: 'rapid_scanning',
        severity: 'high',
        confidence: Math.min(uniquePaths / CORRELATION_RULES.RAPID_SCANNING.max_unique_paths, 1),
        description: `Rapid scanning detected from ${event.source_ip}: accessed ${uniquePaths} unique paths`,
        evidence: {
          ip_address: event.source_ip,
          unique_paths: uniquePaths,
          time_window: `${CORRELATION_RULES.RAPID_SCANNING.window_minutes} minutes`,
          event_types: CORRELATION_RULES.RAPID_SCANNING.event_types
        },
        recommendations: [
          'Block IP address',
          'Alert security team immediately',
          'Check for vulnerability scanning',
          'Review firewall logs'
        ]
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting rapid scanning:', error);
    return null;
  }
}

/**
 * Detect geographic anomalies
 * @param {Object} event - Security event to check
 * @returns {Promise<Object|null>} Geographic correlation or null
 */
async function detectGeographicAnomalies(event) {
  try {
    // Get geolocation data for the IP
    const geoData = await getGeolocation(event.source_ip);

    if (!geoData || geoData.error) {
      return null;
    }

    const threatLevel = getThreatLevel(geoData);

    // Check for high-risk geographic locations
    if (threatLevel === 'high') {
      return {
        type: 'high_risk_geographic_location',
        severity: 'high',
        confidence: 0.8,
        description: `Security event from high-risk geographic location: ${geoData.country} (${geoData.city})`,
        evidence: {
          ip_address: event.source_ip,
          country: geoData.country,
          city: geoData.city,
          threat_level: threatLevel,
          isp: geoData.isp,
          org: geoData.org
        },
        recommendations: [
          'Escalate to security team',
          'Implement additional verification',
          'Monitor closely',
          'Check threat intelligence feeds'
        ]
      };
    }

    // Check for unusual ISP patterns
    const suspiciousPatterns = ['tor', 'proxy', 'vpn', 'anonymous'];
    const isp = geoData.isp?.toLowerCase() || '';
    const org = geoData.org?.toLowerCase() || '';

    if (suspiciousPatterns.some(pattern => isp.includes(pattern) || org.includes(pattern))) {
      return {
        type: 'suspicious_network_infrastructure',
        severity: 'medium',
        confidence: 0.7,
        description: `Event from suspicious network infrastructure: ${geoData.isp} (${geoData.org})`,
        evidence: {
          ip_address: event.source_ip,
          isp: geoData.isp,
          org: geoData.org,
          country: geoData.country,
          suspicious_patterns: suspiciousPatterns.filter(pattern =>
            isp.includes(pattern) || org.includes(pattern)
          )
        },
        recommendations: [
          'Verify user identity',
          'Implement additional authentication',
          'Monitor network traffic',
          'Review VPN/Proxy policies'
        ]
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting geographic anomalies:', error);
    return null;
  }
}

/**
 * Calculate threat score for an event
 * @param {Object} event - Security event
 * @param {Array} correlations - Array of correlations
 * @returns {number} Threat score (0-100)
 */
function calculateThreatScore(event, correlations) {
  let score = 0;

  // Base score from event severity
  const severityScores = {
    'low': 10,
    'medium': 30,
    'high': 70,
    'critical': 100
  };
  score += severityScores[event.severity] || 0;

  // Add points for correlations
  correlations.forEach(correlation => {
    switch (correlation.severity) {
      case 'low': score += 5; break;
      case 'medium': score += 15; break;
      case 'high': score += 30; break;
      case 'critical': score += 50; break;
    }
  });

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Generate automated alerts based on correlations
 * @param {Object} event - Security event
 * @param {Array} correlations - Array of correlations
 * @returns {Array} Array of alerts to generate
 */
function generateAlerts(event, correlations) {
  const alerts = [];

  correlations.forEach(correlation => {
    if (correlation.severity === 'high' || correlation.severity === 'critical') {
      alerts.push({
        type: 'security_alert',
        priority: correlation.severity,
        title: `${correlation.type.replace('_', ' ').toUpperCase()} Detected`,
        description: correlation.description,
        event_id: event.id,
        correlation_type: correlation.type,
        confidence: correlation.confidence,
        recommendations: correlation.recommendations,
        timestamp: new Date().toISOString()
      });
    }
  });

  return alerts;
}

module.exports = {
  analyzeEventCorrelations,
  calculateThreatScore,
  generateAlerts,
  CORRELATION_RULES
};
