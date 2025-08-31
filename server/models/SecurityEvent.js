const { query } = require('../config/database');

class SecurityEvent {
  constructor(data) {
    this.id = data.id;
    this.event_type = data.event_type;
    this.severity = data.severity;
    this.source_ip = data.source_ip;
    this.user_agent = data.user_agent;
    this.description = data.description;
    this.location_country = data.location_country;
    this.location_city = data.location_city;
    this.request_path = data.request_path;
    this.request_method = data.request_method;
    this.user_id = data.user_id;
    this.session_id = data.session_id;
    this.raw_data = data.raw_data;
    this.threat_score = data.threat_score;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new security event
  static async create(eventData) {
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
      } = eventData;

      const sql = `
        INSERT INTO security_events (
          event_type, severity, source_ip, user_agent, description,
          location_country, location_city, request_path, request_method,
          user_id, session_id, raw_data, threat_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        event_type, severity, source_ip, user_agent, description,
        location_country, location_city, request_path, request_method,
        user_id, session_id, raw_data, eventData.threat_score || null
      ];

      const result = await query(sql, values);
      return new SecurityEvent(result.rows[0]);
    } catch (error) {
      console.error('Error creating security event:', error);
      throw error;
    }
  }

  // Find event by ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM security_events WHERE id = $1';
      const result = await query(sql, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new SecurityEvent(result.rows[0]);
    } catch (error) {
      console.error('Error finding security event by ID:', error);
      throw error;
    }
  }

  // Get events with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        event_type,
        severity,
        source_ip,
        start_date,
        end_date,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = options;

      let whereConditions = [];
      let values = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (event_type) {
        whereConditions.push(`event_type = $${paramCount}`);
        values.push(event_type);
        paramCount++;
      }

      if (severity) {
        whereConditions.push(`severity = $${paramCount}`);
        values.push(severity);
        paramCount++;
      }

      if (source_ip) {
        whereConditions.push(`source_ip = $${paramCount}`);
        values.push(source_ip);
        paramCount++;
      }

      if (start_date) {
        whereConditions.push(`created_at >= $${paramCount}`);
        values.push(start_date);
        paramCount++;
      }

      if (end_date) {
        whereConditions.push(`created_at <= $${paramCount}`);
        values.push(end_date);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['id', 'event_type', 'severity', 'source_ip', 'created_at'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const sql = `
        SELECT * FROM security_events
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);

      const result = await query(sql, values);
      return result.rows.map(row => new SecurityEvent(row));
    } catch (error) {
      console.error('Error finding security events:', error);
      throw error;
    }
  }

  // Get event statistics
  static async getStatistics(options = {}) {
    try {
      const { start_date, end_date } = options;

      let dateCondition = '';
      let values = [];
      let paramCount = 1;

      if (start_date || end_date) {
        const conditions = [];
        if (start_date) {
          conditions.push(`created_at >= $${paramCount}`);
          values.push(start_date);
          paramCount++;
        }
        if (end_date) {
          conditions.push(`created_at <= $${paramCount}`);
          values.push(end_date);
          paramCount++;
        }
        dateCondition = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total events
      const totalSql = `SELECT COUNT(*) as total FROM security_events ${dateCondition}`;
      const totalResult = await query(totalSql, values);

      // Get events by type
      const typeSql = `
        SELECT event_type, COUNT(*) as count
        FROM security_events
        ${dateCondition}
        GROUP BY event_type
        ORDER BY count DESC
      `;
      const typeResult = await query(typeSql, values);

      // Get events by severity
      const severitySql = `
        SELECT severity, COUNT(*) as count
        FROM security_events
        ${dateCondition}
        GROUP BY severity
        ORDER BY count DESC
      `;
      const severityResult = await query(severitySql, values);

      // Get top source IPs
      const ipSql = `
        SELECT source_ip, COUNT(*) as count
        FROM security_events
        ${dateCondition}
        GROUP BY source_ip
        ORDER BY count DESC
        LIMIT 10
      `;
      const ipResult = await query(ipSql, values);

      // Get events by country
      const countrySql = `
        SELECT location_country, COUNT(*) as count
        FROM security_events
        ${dateCondition}
        WHERE location_country IS NOT NULL
        GROUP BY location_country
        ORDER BY count DESC
        LIMIT 10
      `;
      const countryResult = await query(countrySql, values);

      return {
        total_events: parseInt(totalResult.rows[0].total),
        events_by_type: typeResult.rows,
        events_by_severity: severityResult.rows,
        top_source_ips: ipResult.rows,
        events_by_country: countryResult.rows
      };
    } catch (error) {
      console.error('Error getting security event statistics:', error);
      throw error;
    }
  }

  // Get timeline data for charts
  static async getTimelineData(options = {}) {
    try {
      const { period = '24h', interval = '1h' } = options;

      // Calculate time range
      const now = new Date();
      let startTime;
      let groupByFormat;

      switch (period) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          groupByFormat = 'YYYY-MM-DD HH24:MI:00'; // Group by minute
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          groupByFormat = 'YYYY-MM-DD HH24:00:00'; // Group by hour
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupByFormat = 'YYYY-MM-DD'; // Group by day
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupByFormat = 'YYYY-MM-DD'; // Group by day
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          groupByFormat = 'YYYY-MM-DD HH24:00:00';
      }

      const sql = `
        SELECT
          to_char(created_at, $1) as time_period,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'failed_login' THEN 1 END) as failed_login,
          COUNT(CASE WHEN event_type = 'sql_injection' THEN 1 END) as sql_injection,
          COUNT(CASE WHEN event_type = 'xss_attempt' THEN 1 END) as xss_attempt,
          COUNT(CASE WHEN event_type = 'command_injection' THEN 1 END) as command_injection
        FROM security_events
        WHERE created_at >= $2
        GROUP BY time_period
        ORDER BY time_period
      `;

      const result = await query(sql, [groupByFormat, startTime]);
      return result.rows;
    } catch (error) {
      console.error('Error getting timeline data:', error);
      throw error;
    }
  }

  // Update event
  async update(updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return this;
      }

      values.push(this.id);
      const sql = `
        UPDATE security_events
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      console.error('Error updating security event:', error);
      throw error;
    }
  }

  // Delete event
  async delete() {
    try {
      const sql = 'DELETE FROM security_events WHERE id = $1';
      await query(sql, [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting security event:', error);
      throw error;
    }
  }
}

module.exports = SecurityEvent;
