-- Create IP geolocation cache table
CREATE TABLE IF NOT EXISTS ip_geolocation (
  ip_address INET PRIMARY KEY,
  country VARCHAR(100),
  country_code VARCHAR(5),
  region VARCHAR(100),
  region_name VARCHAR(100),
  city VARCHAR(100),
  zip_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  isp VARCHAR(255),
  org VARCHAR(255),
  asn VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_country ON ip_geolocation(country);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_city ON ip_geolocation(city);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_isp ON ip_geolocation(isp);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_updated_at ON ip_geolocation(updated_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_ip_geolocation_updated_at
    BEFORE UPDATE ON ip_geolocation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
