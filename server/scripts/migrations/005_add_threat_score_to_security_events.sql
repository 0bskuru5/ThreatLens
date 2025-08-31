-- Add threat_score column to security_events table
ALTER TABLE security_events
ADD COLUMN IF NOT EXISTS threat_score INTEGER CHECK (threat_score >= 0 AND threat_score <= 100);

-- Create index on threat_score for better performance
CREATE INDEX IF NOT EXISTS idx_security_events_threat_score ON security_events(threat_score);

-- Create composite index for threat score and severity
CREATE INDEX IF NOT EXISTS idx_security_events_score_severity ON security_events(threat_score, severity);
