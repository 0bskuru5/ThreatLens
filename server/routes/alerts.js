const express = require('express');
const jwt = require('jsonwebtoken');
const { getAlerts, updateAlertStatus, getAlertStatistics } = require('../services/alerting');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Get alerts with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      priority,
      status = 'active',
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      priority,
      status,
      start_date,
      end_date
    };

    const alerts = await getAlerts(filters, parseInt(page), parseInt(limit));

    res.json(alerts);
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const alerts = await getAlerts({}, 1, 1);
    const alert = alerts.alerts.find(a => a.id === parseInt(req.params.id));

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error getting alert by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update alert status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['active', 'acknowledged', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await updateAlertStatus(parseInt(req.params.id), status, notes);

    res.json({ message: 'Alert status updated successfully' });
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await getAlertStatistics();

    // Process statistics for easier consumption
    const processedStats = {
      total_alerts: stats.by_priority_status.reduce((sum, item) => sum + parseInt(item.count), 0),
      recent_alerts_24h: stats.recent_24h,
      by_priority: {
        critical: stats.by_priority_status
          .filter(item => item.priority === 'critical' && item.status === 'active')
          .reduce((sum, item) => sum + parseInt(item.count), 0),
        high: stats.by_priority_status
          .filter(item => item.priority === 'high' && item.status === 'active')
          .reduce((sum, item) => sum + parseInt(item.count), 0),
        medium: stats.by_priority_status
          .filter(item => item.priority === 'medium' && item.status === 'active')
          .reduce((sum, item) => sum + parseInt(item.count), 0),
        low: stats.by_priority_status
          .filter(item => item.priority === 'low' && item.status === 'active')
          .reduce((sum, item) => sum + parseInt(item.count), 0)
      },
      by_status: {
        active: stats.by_priority_status
          .filter(item => item.status === 'active')
          .reduce((sum, item) => sum + parseInt(item.count), 0),
        acknowledged: stats.by_priority_status
          .filter(item => item.status === 'acknowledged')
          .reduce((sum, item) => sum + parseInt(item.count), 0),
        resolved: stats.by_priority_status
          .filter(item => item.status === 'resolved')
          .reduce((sum, item) => sum + parseInt(item.count), 0),
        dismissed: stats.by_priority_status
          .filter(item => item.status === 'dismissed')
          .reduce((sum, item) => sum + parseInt(item.count), 0)
      }
    };

    res.json(processedStats);
  } catch (error) {
    console.error('Error getting alert statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update alert statuses
router.patch('/bulk/status', authenticateToken, async (req, res) => {
  try {
    const { alertIds, status, notes } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ error: 'Alert IDs array is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['active', 'acknowledged', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update each alert status
    for (const alertId of alertIds) {
      await updateAlertStatus(parseInt(alertId), status, notes);
    }

    res.json({
      message: `${alertIds.length} alerts updated successfully`,
      updated_count: alertIds.length
    });
  } catch (error) {
    console.error('Error bulk updating alert statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
