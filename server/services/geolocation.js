const axios = require('axios');
const { query } = require('../config/database');

// Cache for IP geolocation results to reduce API calls
const geoCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get geolocation data for an IP address
 * @param {string} ipAddress - The IP address to geolocate
 * @returns {Promise<Object>} Geolocation data
 */
async function getGeolocation(ipAddress) {
  try {
    // Check cache first
    const cached = geoCache.get(ipAddress);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }

    // Validate IP address format
    if (!isValidIP(ipAddress)) {
      throw new Error('Invalid IP address format');
    }

    // Skip private IPs and localhost
    if (isPrivateIP(ipAddress) || ipAddress === '127.0.0.1' || ipAddress === '::1') {
      const localData = {
        ip: ipAddress,
        country: 'Local Network',
        countryCode: 'LOCAL',
        region: 'Local',
        regionName: 'Local Network',
        city: 'Local',
        zip: '',
        lat: 0,
        lon: 0,
        timezone: 'UTC',
        isp: 'Local Network',
        org: 'Local Network',
        as: '',
        query: ipAddress
      };
      geoCache.set(ipAddress, { data: localData, timestamp: Date.now() });
      return localData;
    }

    // Make API request to ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'ThreatLens-SOC/1.0'
      }
    });

    const data = response.data;

    // Check if the API returned an error
    if (data.status === 'fail') {
      throw new Error(`Geolocation failed: ${data.message}`);
    }

    // Cache the result
    geoCache.set(ipAddress, { data, timestamp: Date.now() });

    // Store in database for analytics
    await storeGeolocationData(data);

    return data;

  } catch (error) {
    console.error(`Geolocation error for IP ${ipAddress}:`, error.message);

    // Return default data on error
    const errorData = {
      ip: ipAddress,
      country: 'Unknown',
      countryCode: 'UNK',
      region: 'Unknown',
      regionName: 'Unknown',
      city: 'Unknown',
      zip: '',
      lat: 0,
      lon: 0,
      timezone: 'UTC',
      isp: 'Unknown',
      org: 'Unknown',
      as: '',
      query: ipAddress,
      error: true
    };

    // Cache error result for shorter duration
    geoCache.set(ipAddress, { data: errorData, timestamp: Date.now() });

    return errorData;
  }
}

/**
 * Store geolocation data in database for analytics
 * @param {Object} geoData - Geolocation data to store
 */
async function storeGeolocationData(geoData) {
  try {
    const sql = `
      INSERT INTO ip_geolocation (
        ip_address, country, country_code, region, region_name,
        city, zip_code, latitude, longitude, timezone, isp, org, asn
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (ip_address)
      DO UPDATE SET
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        region = EXCLUDED.region,
        region_name = EXCLUDED.region_name,
        city = EXCLUDED.city,
        zip_code = EXCLUDED.zip_code,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        timezone = EXCLUDED.timezone,
        isp = EXCLUDED.isp,
        org = EXCLUDED.org,
        asn = EXCLUDED.asn,
        updated_at = CURRENT_TIMESTAMP
    `;

    await query(sql, [
      geoData.query,
      geoData.country,
      geoData.countryCode,
      geoData.region,
      geoData.regionName,
      geoData.city,
      geoData.zip,
      geoData.lat,
      geoData.lon,
      geoData.timezone,
      geoData.isp,
      geoData.org,
      geoData.as
    ]);
  } catch (error) {
    console.error('Error storing geolocation data:', error);
  }
}

/**
 * Get geolocation data from database cache
 * @param {string} ipAddress - The IP address to lookup
 * @returns {Promise<Object|null>} Cached geolocation data or null
 */
async function getCachedGeolocation(ipAddress) {
  try {
    const sql = 'SELECT * FROM ip_geolocation WHERE ip_address = $1';
    const result = await query(sql, [ipAddress]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting cached geolocation:', error);
    return null;
  }
}

/**
 * Validate IP address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP
 */
function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Regex.test(ip)) {
    // Validate IPv4 ranges
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Regex.test(ip);
}

/**
 * Check if IP is private/reserved
 * @param {string} ip - IP address to check
 * @returns {boolean} True if private IP
 */
function isPrivateIP(ip) {
  // IPv4 private ranges
  if (ip.startsWith('10.') ||
      ip.startsWith('172.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('127.')) {
    return true;
  }

  // IPv4 link-local
  if (ip.startsWith('169.254.')) {
    return true;
  }

  return false;
}

/**
 * Get threat level based on geolocation data
 * @param {Object} geoData - Geolocation data
 * @returns {string} Threat level (low, medium, high, critical)
 */
function getThreatLevel(geoData) {
  // High-risk countries (example list)
  const highRiskCountries = [
    'North Korea', 'Iran', 'Syria', 'Iraq', 'Afghanistan',
    'Somalia', 'Pakistan', 'Russia', 'China'
  ];

  // Medium-risk countries
  const mediumRiskCountries = [
    'Ukraine', 'Belarus', 'Venezuela', 'Cuba', 'Myanmar'
  ];

  if (highRiskCountries.includes(geoData.country)) {
    return 'high';
  }

  if (mediumRiskCountries.includes(geoData.country)) {
    return 'medium';
  }

  // Check for suspicious ISP patterns
  const suspiciousISPs = ['tor', 'proxy', 'vpn', 'anonymous'];
  const isp = geoData.isp?.toLowerCase() || '';
  const org = geoData.org?.toLowerCase() || '';

  if (suspiciousISPs.some(pattern => isp.includes(pattern) || org.includes(pattern))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Clear geolocation cache
 */
function clearCache() {
  geoCache.clear();
  console.log('Geolocation cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    size: geoCache.size,
    entries: Array.from(geoCache.entries()).map(([ip, data]) => ({
      ip,
      age: Date.now() - data.timestamp,
      country: data.data.country
    }))
  };
}

module.exports = {
  getGeolocation,
  getCachedGeolocation,
  getThreatLevel,
  clearCache,
  getCacheStats,
  storeGeolocationData
};
