-- Create security_events table for storing security events
CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('failed_login', 'sql_injection', 'xss_attempt', 'command_injection', 'brute_force', 'suspicious_activity', 'unauthorized_access', 'data_exfiltration')),
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip INET NOT NULL,
  user_agent TEXT,
  description TEXT,
  location_country VARCHAR(100),
  location_city VARCHAR(100),
  request_path VARCHAR(500),
  request_method VARCHAR(10),
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_location_country ON security_events(location_country);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON security_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created ON security_events(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_created ON security_events(source_ip, created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_security_events_updated_at
    BEFORE UPDATE ON security_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a partial index for active events (if we add an is_active field later)
-- CREATE INDEX IF NOT EXISTS idx_security_events_active ON security_events(created_at) WHERE is_active = true;
