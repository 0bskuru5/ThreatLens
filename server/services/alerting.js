const { query } = require('../config/database');
const nodemailer = require('nodemailer');

// Alert configuration
const ALERT_CONFIG = {
  EMAIL: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'threatlens@soc.local',
    recipients: (process.env.ALERT_RECIPIENTS || 'admin@threatlens.local').split(',')
  },
  THRESHOLDS: {
    critical: 90,
    high: 70,
    medium: 50,
    low: 30
  }
};

// Email transporter
let emailTransporter = null;

/**
 * Initialize alerting service
 */
function initializeAlerting() {
  if (ALERT_CONFIG.EMAIL.enabled) {
    try {
      emailTransporter = nodemailer.createTransporter(ALERT_CONFIG.EMAIL.smtp);
      console.log('Email alerting initialized');
    } catch (error) {
      console.error('Failed to initialize email alerting:', error);
    }
  }
}

/**
 * Generate and process alerts for security events
 * @param {Object} event - Security event
 * @param {Array} correlations - Event correlations
 * @param {number} threatScore - Calculated threat score
 * @returns {Promise<Array>} Array of generated alerts
 */
async function processAlerts(event, correlations, threatScore) {
  const alerts = [];

  try {
    // Generate alerts based on correlations
    const correlationAlerts = correlations.map(correlation => ({
      type: 'correlation_alert',
      priority: correlation.severity,
      title: `${correlation.type.replace('_', ' ').toUpperCase()} Detected`,
      description: correlation.description,
      event_id: event.id,
      correlation_data: correlation,
      threat_score: threatScore,
      timestamp: new Date().toISOString()
    }));

    // Generate threat score alerts
    const threatAlerts = generateThreatScoreAlerts(event, threatScore);

    // Combine all alerts
    alerts.push(...correlationAlerts, ...threatAlerts);

    // Process each alert
    for (const alert of alerts) {
      await storeAlert(alert);
      await sendAlertNotifications(alert);
    }

    return alerts;
  } catch (error) {
    console.error('Error processing alerts:', error);
    return alerts;
  }
}

/**
 * Generate alerts based on threat score
 * @param {Object} event - Security event
 * @param {number} threatScore - Threat score
 * @returns {Array} Array of threat score alerts
 */
function generateThreatScoreAlerts(event, threatScore) {
  const alerts = [];

  if (threatScore >= ALERT_CONFIG.THRESHOLDS.critical) {
    alerts.push({
      type: 'threat_score_alert',
      priority: 'critical',
      title: 'CRITICAL THREAT DETECTED',
      description: `Critical threat detected with score ${threatScore}/100 from ${event.source_ip}`,
      event_id: event.id,
      threat_score: threatScore,
      threshold: ALERT_CONFIG.THRESHOLDS.critical,
      timestamp: new Date().toISOString()
    });
  } else if (threatScore >= ALERT_CONFIG.THRESHOLDS.high) {
    alerts.push({
      type: 'threat_score_alert',
      priority: 'high',
      title: 'High Threat Detected',
      description: `High threat detected with score ${threatScore}/100 from ${event.source_ip}`,
      event_id: event.id,
      threat_score: threatScore,
      threshold: ALERT_CONFIG.THRESHOLDS.high,
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

/**
 * Store alert in database
 * @param {Object} alert - Alert data to store
 * @returns {Promise<void>}
 */
async function storeAlert(alert) {
  try {
    const sql = `
      INSERT INTO alerts (
        alert_type, priority, title, description, event_id,
        correlation_data, threat_score, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      alert.type,
      alert.priority,
      alert.title,
      alert.description,
      alert.event_id,
      JSON.stringify(alert.correlation_data || {}),
      alert.threat_score || null,
      'active',
      alert.timestamp
    ];

    const result = await query(sql, values);
    console.log(`Alert stored with ID: ${result.rows[0].id}`);
  } catch (error) {
    console.error('Error storing alert:', error);
  }
}

/**
 * Send alert notifications
 * @param {Object} alert - Alert data
 * @returns {Promise<void>}
 */
async function sendAlertNotifications(alert) {
  try {
    // Send email notification
    if (ALERT_CONFIG.EMAIL.enabled && emailTransporter) {
      await sendEmailAlert(alert);
    }

    // Log to console for development
    console.log(`🚨 ALERT [${alert.priority.toUpperCase()}]: ${alert.title}`);
    console.log(`   ${alert.description}`);

    if (alert.correlation_data?.recommendations) {
      console.log('   Recommendations:');
      alert.correlation_data.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
  } catch (error) {
    console.error('Error sending alert notifications:', error);
  }
}

/**
 * Send email alert
 * @param {Object} alert - Alert data
 * @returns {Promise<void>}
 */
async function sendEmailAlert(alert) {
  try {
    const priorityColors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#16a34a'
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${priorityColors[alert.priority] || '#6b7280'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 24px;">ThreatLens Security Alert</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${alert.title}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <h3 style="margin-top: 0; color: #374151;">Alert Details</h3>
          <p style="color: #6b7280; line-height: 1.6;">${alert.description}</p>

          ${alert.threat_score ? `
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 12px; margin: 16px 0;">
              <strong>Threat Score:</strong> ${alert.threat_score}/100
            </div>
          ` : ''}

          ${alert.correlation_data?.recommendations ? `
            <h4 style="color: #374151; margin-top: 20px;">Recommended Actions:</h4>
            <ul style="color: #6b7280; line-height: 1.6;">
              ${alert.correlation_data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          ` : ''}

          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
            <p>This alert was generated by ThreatLens SOC Dashboard on ${new Date(alert.timestamp).toLocaleString()}</p>
            <p>Event ID: ${alert.event_id}</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: ALERT_CONFIG.EMAIL.from,
      to: ALERT_CONFIG.EMAIL.recipients,
      subject: `[${alert.priority.toUpperCase()}] ThreatLens: ${alert.title}`,
      html: htmlContent
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Email alert sent to ${ALERT_CONFIG.EMAIL.recipients.length} recipients`);
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
}

/**
 * Get alerts with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated alerts
 */
async function getAlerts(filters = {}, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (filters.priority) {
      whereConditions.push(`priority = $${paramCount}`);
      values.push(filters.priority);
      paramCount++;
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    if (filters.start_date) {
      whereConditions.push(`created_at >= $${paramCount}`);
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      whereConditions.push(`created_at <= $${paramCount}`);
      values.push(filters.end_date);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get alerts
    const sql = `
      SELECT * FROM alerts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM alerts ${whereClause}`;
    const countResult = await query(countSql, values.slice(0, -2)); // Remove limit and offset

    return {
      alerts: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
    };
  } catch (error) {
    console.error('Error getting alerts:', error);
    throw error;
  }
}

/**
 * Update alert status
 * @param {number} alertId - Alert ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Promise<void>}
 */
async function updateAlertStatus(alertId, status, notes = null) {
  try {
    const sql = `
      UPDATE alerts
      SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await query(sql, [status, notes, alertId]);
    console.log(`Alert ${alertId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
}

/**
 * Get alert statistics
 * @returns {Promise<Object>} Alert statistics
 */
async function getAlertStatistics() {
  try {
    const sql = `
      SELECT
        priority,
        status,
        COUNT(*) as count
      FROM alerts
      GROUP BY priority, status
      ORDER BY priority, status
    `;

    const result = await query(sql);

    // Get recent alerts (last 24 hours)
    const recentSql = `
      SELECT COUNT(*) as recent_count
      FROM alerts
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    const recentResult = await query(recentSql);

    return {
      by_priority_status: result.rows,
      recent_24h: parseInt(recentResult.rows[0].recent_count)
    };
  } catch (error) {
    console.error('Error getting alert statistics:', error);
    throw error;
  }
}

module.exports = {
  initializeAlerting,
  processAlerts,
  getAlerts,
  updateAlertStatus,
  getAlertStatistics,
  ALERT_CONFIG
};
