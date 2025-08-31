const User = require('../models/User');
const SecurityEvent = require('../models/SecurityEvent');
const { query } = require('../config/database');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Create default admin user
    console.log('Creating default admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@threatlens.local',
      password: 'admin123',
      role: 'admin'
    });
    console.log(`Created admin user: ${adminUser.username} (ID: ${adminUser.id})`);

    // Create sample security events
    console.log('Creating sample security events...');
    const sampleEvents = [
      {
        event_type: 'failed_login',
        severity: 'medium',
        source_ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        description: 'Failed login attempt for user admin',
        location_country: 'United States',
        location_city: 'New York',
        request_path: '/api/auth/login',
        request_method: 'POST'
      },
      {
        event_type: 'sql_injection',
        severity: 'high',
        source_ip: '10.0.0.50',
        user_agent: 'sqlmap/1.6.5',
        description: 'SQL injection attempt detected in login form',
        location_country: 'China',
        location_city: 'Beijing',
        request_path: '/api/auth/login',
        request_method: 'POST',
        raw_data: { payload: "admin' OR '1'='1", detected_pattern: 'SQL injection' }
      },
      {
        event_type: 'xss_attempt',
        severity: 'medium',
        source_ip: '172.16.0.25',
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        description: 'Cross-site scripting attempt blocked',
        location_country: 'Germany',
        location_city: 'Berlin',
        request_path: '/api/contact',
        request_method: 'POST',
        raw_data: { payload: '<script>alert("XSS")</script>', detected_pattern: 'script tag' }
      },
      {
        event_type: 'command_injection',
        severity: 'high',
        source_ip: '203.0.113.45',
        user_agent: 'curl/7.68.0',
        description: 'Command injection attempt detected',
        location_country: 'Russian Federation',
        location_city: 'Moscow',
        request_path: '/api/system/ping',
        request_method: 'GET',
        raw_data: { payload: '; rm -rf /', detected_pattern: 'command injection' }
      },
      {
        event_type: 'brute_force',
        severity: 'high',
        source_ip: '198.51.100.23',
        user_agent: 'Python-urllib/3.8',
        description: 'Brute force attack detected - multiple failed login attempts',
        location_country: 'Brazil',
        location_city: 'São Paulo',
        request_path: '/api/auth/login',
        request_method: 'POST',
        raw_data: { attempt_count: 25, time_window: '5 minutes' }
      },
      {
        event_type: 'failed_login',
        severity: 'low',
        source_ip: '192.168.1.150',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        description: 'Failed login attempt for user analyst',
        location_country: 'Canada',
        location_city: 'Toronto',
        request_path: '/api/auth/login',
        request_method: 'POST'
      },
      {
        event_type: 'unauthorized_access',
        severity: 'high',
        source_ip: '185.220.101.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        description: 'Unauthorized access attempt to admin panel',
        location_country: 'Netherlands',
        location_city: 'Amsterdam',
        request_path: '/admin/users',
        request_method: 'GET'
      },
      {
        event_type: 'suspicious_activity',
        severity: 'medium',
        source_ip: '104.244.42.193',
        user_agent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        description: 'Suspicious activity detected - unusual request pattern',
        location_country: 'United Kingdom',
        location_city: 'London',
        request_path: '/api/data/export',
        request_method: 'GET',
        raw_data: { requests_per_minute: 120, unusual_pattern: 'rapid data export' }
      }
    ];

    // Create events with some time variation
    for (let i = 0; i < sampleEvents.length; i++) {
      const event = sampleEvents[i];
      // Create events at different times (some recent, some older)
      const eventTime = new Date(Date.now() - (i * 15 * 60 * 1000)); // 15 minutes apart

      const createdEvent = await SecurityEvent.create({
        ...event,
        created_at: eventTime
      });

      console.log(`Created security event: ${createdEvent.event_type} (ID: ${createdEvent.id})`);
    }

    // Update the created_at timestamps to be in the past
    console.log('Updating event timestamps for realistic data...');
    const updateTimestampsSql = `
      UPDATE security_events
      SET created_at = created_at - INTERVAL '2 hours'
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '2 hours';
    `;
    await query(updateTimestampsSql);

    console.log('Database seeding completed successfully!');
    console.log('Default admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Email: admin@threatlens.local');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Clean up existing data (optional - for reseeding)
const clearExistingData = async () => {
  try {
    console.log('Clearing existing data...');
    await query('DELETE FROM security_events');
    await query('DELETE FROM users WHERE username != \'admin\''); // Keep admin user if exists
    console.log('Existing data cleared');
  } catch (error) {
    console.error('Error clearing existing data:', error);
    throw error;
  }
};

// Main execution
if (require.main === module) {
  const shouldClear = process.argv.includes('--clear');

  (async () => {
    try {
      if (shouldClear) {
        await clearExistingData();
      }
      await seedData();
      console.log('Seeding process completed');
      process.exit(0);
    } catch (error) {
      console.error('Seeding process failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedData,
  clearExistingData
};
