const express = require('express');
const jwt = require('jsonwebtoken');
const SecurityEvent = require('../models/SecurityEvent');
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

// Get dashboard overview data
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get statistics for different time periods
    const stats24h = await SecurityEvent.getStatistics({ start_date: last24h.toISOString() });
    const stats7d = await SecurityEvent.getStatistics({ start_date: last7d.toISOString() });
    const stats30d = await SecurityEvent.getStatistics({ start_date: last30d.toISOString() });
    const statsAll = await SecurityEvent.getStatistics();

    // Get critical and high severity events
    const criticalStats = await SecurityEvent.getStatistics({
      severity: 'critical'
    });
    const highStats = await SecurityEvent.getStatistics({
      severity: 'high'
    });

    // Calculate metrics
    const metrics = {
      total_events: statsAll.total_events,
      events_24h: stats24h.total_events,
      events_7d: stats7d.total_events,
      events_30d: stats30d.total_events,
      critical_events: criticalStats.total_events,
      high_severity: highStats.total_events,
      unique_ips: statsAll.top_source_ips.length
    };

    // Get top event types (from all time statistics)
    const topEventTypes = statsAll.events_by_type
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ type: item.event_type, count: item.count }));

    // Get top source IPs (already sorted from statistics)
    const topSourceIPs = statsAll.top_source_ips
      .slice(0, 10)
      .map(item => ({ ip: item.source_ip, count: item.count }));

    // Get recent events (last 10)
    const recentEventsData = await SecurityEvent.findAll({
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'DESC'
    });

    const recentEvents = recentEventsData.map(event => ({
      id: event.id,
      type: event.event_type,
      severity: event.severity,
      source_ip: event.source_ip,
      timestamp: event.created_at,
      description: event.description,
      location: {
        country: event.location_country,
        city: event.location_city
      }
    }));

    res.json({
      metrics,
      top_event_types: topEventTypes,
      top_source_ips: topSourceIPs,
      recent_events: recentEvents
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chart data for time-based visualizations
router.get('/charts/timeline', authenticateToken, async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    // Get timeline data from the model
    const timelineData = await SecurityEvent.getTimelineData({ period });

    // Format the response
    const formattedData = timelineData.map(item => ({
      time_period: item.time_period,
      total_events: parseInt(item.total_events),
      failed_login: parseInt(item.failed_login),
      sql_injection: parseInt(item.sql_injection),
      xss_attempt: parseInt(item.xss_attempt),
      command_injection: parseInt(item.command_injection)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Chart timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get geolocation data for IP addresses
router.get('/geolocation', authenticateToken, async (req, res) => {
  try {
    // Get geolocation data from statistics
    const stats = await SecurityEvent.getStatistics();

    // Format the geolocation response
    const countries = stats.events_by_country.map(item => ({
      country: item.location_country,
      count: item.count,
      cities: [] // We could add city-level aggregation if needed
    }));

    res.json(countries);
  } catch (error) {
    console.error('Geolocation data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
