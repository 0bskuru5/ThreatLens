const express = require('express');
const jwt = require('jsonwebtoken');
const SecurityEvent = require('../models/SecurityEvent');
const { broadcastSecurityEvent } = require('../services/websocket');
const { analyzeEventCorrelations, calculateThreatScore } = require('../services/eventCorrelation');
const { processAlerts } = require('../services/alerting');
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

// Get all security events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      event_type,
      severity,
      source_ip,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Build options for the database query
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      event_type,
      severity,
      source_ip,
      start_date,
      end_date,
      sort_by,
      sort_order
    };

    // Get events from database
    const events = await SecurityEvent.findAll(options);

    // Get total count for pagination (we'd need to implement this in the model)
    // For now, we'll just return the events and indicate we need to add count functionality
    const total = events.length; // This should be replaced with a proper count query

    // Format events for API response
    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.event_type,
      severity: event.severity,
      source_ip: event.source_ip,
      user_agent: event.user_agent,
      timestamp: event.created_at,
      description: event.description,
      location: {
        country: event.location_country,
        city: event.location_city
      },
      request_path: event.request_path,
      request_method: event.request_method
    }));

    res.json({
      events: formattedEvents,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await SecurityEvent.findById(parseInt(req.params.id));

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Format event for API response
    const formattedEvent = {
      id: event.id,
      type: event.event_type,
      severity: event.severity,
      source_ip: event.source_ip,
      user_agent: event.user_agent,
      timestamp: event.created_at,
      description: event.description,
      location: {
        country: event.location_country,
        city: event.location_city
      },
      request_path: event.request_path,
      request_method: event.request_method,
      user_id: event.user_id,
      session_id: event.session_id,
      raw_data: event.raw_data
    };

    res.json(formattedEvent);
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new security event (for logging purposes)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      event_type,
      severity,
      source_ip,
      user_agent,
      description,
      location_country,
      location_city,
      request_path,
      request_method,
      user_id,
      session_id,
      raw_data
    } = req.body;

    if (!event_type || !severity || !source_ip) {
      return res.status(400).json({ error: 'event_type, severity, and source_ip are required' });
    }

    // Create the event in the database
    const newEvent = await SecurityEvent.create({
      event_type,
      severity,
      source_ip,
      user_agent: user_agent || 'Unknown',
      description: description || `${event_type} event detected`,
      location_country: location_country || 'Unknown',
      location_city: location_city || 'Unknown',
      request_path,
      request_method,
      user_id,
      session_id,
      raw_data
    });

    // Analyze event for correlations
    let correlations = [];
    let threatScore = 0;

    try {
      correlations = await analyzeEventCorrelations(newEvent);
      threatScore = calculateThreatScore(newEvent, correlations);

      // Update event with threat score if correlations found
      if (correlations.length > 0) {
        await newEvent.update({ threat_score: threatScore });
      }
    } catch (correlationError) {
      console.error('Error analyzing event correlations:', correlationError);
      // Continue processing even if correlation analysis fails
    }

    // Process alerts based on correlations and threat score
    try {
      if (correlations.length > 0 || threatScore >= 50) {
        await processAlerts(newEvent, correlations, threatScore);
      }
    } catch (alertError) {
      console.error('Error processing alerts:', alertError);
      // Continue processing even if alert processing fails
    }

    // Format the response
    const formattedEvent = {
      id: newEvent.id,
      type: newEvent.event_type,
      severity: newEvent.severity,
      source_ip: newEvent.source_ip,
      user_agent: newEvent.user_agent,
      timestamp: newEvent.created_at,
      description: newEvent.description,
      location: {
        country: newEvent.location_country,
        city: newEvent.location_city
      },
      request_path: newEvent.request_path,
      request_method: newEvent.request_method,
      threat_score: threatScore,
      correlations_found: correlations.length
    };

    // Broadcast the new event to all connected WebSocket clients
    try {
      broadcastSecurityEvent(newEvent);
    } catch (wsError) {
      console.error('Error broadcasting security event via WebSocket:', wsError);
      // Don't fail the request if WebSocket broadcasting fails
    }

    res.status(201).json(formattedEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build options for the statistics query
    const options = {
      start_date,
      end_date
    };

    const stats = await SecurityEvent.getStatistics(options);

    // Calculate events in last 24 hours if no date range specified
    let eventsLast24h = stats.total_events;
    if (!start_date && !end_date) {
      const last24hStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentStats = await SecurityEvent.getStatistics({
        start_date: last24hStart.toISOString()
      });
      eventsLast24h = recentStats.total_events;
    }

    res.json({
      total_events: stats.total_events,
      events_last_24h: eventsLast24h,
      events_by_type: stats.events_by_type,
      events_by_severity: stats.events_by_severity,
      top_source_ips: stats.top_source_ips,
      events_by_country: stats.events_by_country
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
