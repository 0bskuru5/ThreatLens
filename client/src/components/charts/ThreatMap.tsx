import React, { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import Card from '../Card'
import { MapPin, AlertTriangle, Shield, Globe } from 'lucide-react'

// World map topology
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface ThreatMapProps {
  threatData: Array<{
    country: string
    countryCode: string
    latitude: number
    longitude: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    eventCount: number
    recentEvents: number
  }>
  onCountryClick?: (countryData: any) => void
  height?: number
  className?: string
}

const threatColors = {
  low: '#10b981',      // green
  medium: '#f59e0b',   // yellow
  high: '#ef4444',     // red
  critical: '#7c2d12'  // dark red
}

const getThreatColor = (threatLevel: string) => {
  return threatColors[threatLevel as keyof typeof threatColors] || threatColors.low
}

const getMarkerSize = (eventCount: number) => {
  // Scale marker size based on event count (min 4, max 12)
  return Math.min(Math.max(Math.sqrt(eventCount) * 2, 4), 12)
}

export default function ThreatMap({
  threatData,
  onCountryClick,
  height = 400,
  className = ''
}: ThreatMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 })

  // Create a color scale for countries based on threat data
  const colorScale = scaleLinear()
    .domain([0, Math.max(...threatData.map(d => d.eventCount))])
    .range(['#f3f4f6', '#ef4444'])

  const getCountryData = (countryName: string) => {
    return threatData.find(d => d.country === countryName)
  }

  const getCountryColor = (geo: any) => {
    const countryData = getCountryData(geo.properties.NAME)
    if (countryData) {
      return colorScale(countryData.eventCount)
    }
    return '#f3f4f6' // default gray
  }

  const handleCountryClick = (geo: any) => {
    const countryData = getCountryData(geo.properties.NAME)
    if (countryData && onCountryClick) {
      onCountryClick(countryData)
    }
    setSelectedCountry(geo.properties.NAME)
  }

  const handleMoveEnd = (position: any) => {
    setPosition(position)
  }

  // Get statistics for the legend
  const totalThreats = threatData.reduce((sum, d) => sum + d.eventCount, 0)
  const criticalCountries = threatData.filter(d => d.threatLevel === 'critical').length
  const highThreatCountries = threatData.filter(d => d.threatLevel === 'high').length

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Global Threat Map</h3>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High Threat</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Low Threat</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ width: '100%', height }} className="border border-gray-200 rounded-lg overflow-hidden">
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{
              scale: 140,
            }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates as [number, number]}
              onMoveEnd={handleMoveEnd}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryData = getCountryData(geo.properties.NAME)
                    const isSelected = selectedCountry === geo.properties.NAME
                    const isHovered = hoveredCountry === geo.properties.NAME

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(geo)}
                        stroke={isSelected ? '#000' : isHovered ? '#666' : '#fff'}
                        strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                        style={{
                          default: {
                            outline: 'none',
                          },
                          hover: {
                            outline: 'none',
                            cursor: countryData ? 'pointer' : 'default'
                          },
                          pressed: {
                            outline: 'none',
                          },
                        }}
                        onClick={() => handleCountryClick(geo)}
                        onMouseEnter={() => setHoveredCountry(geo.properties.NAME)}
                        onMouseLeave={() => setHoveredCountry(null)}
                      />
                    )
                  })
                }
              </Geographies>

              {/* Threat markers */}
              {threatData.map((threat, index) => (
                <Marker
                  key={`${threat.country}-${index}`}
                  coordinates={[threat.longitude, threat.latitude]}
                >
                  <circle
                    r={getMarkerSize(threat.eventCount)}
                    fill={getThreatColor(threat.threatLevel)}
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCountryClick && onCountryClick(threat)}
                  />
                  {/* Pulse effect for high/critical threats */}
                  {(threat.threatLevel === 'high' || threat.threatLevel === 'critical') && (
                    <circle
                      r={getMarkerSize(threat.eventCount) + 4}
                      fill="none"
                      stroke={getThreatColor(threat.threatLevel)}
                      strokeWidth={1}
                      opacity={0.6}
                      className="animate-ping"
                    />
                  )}
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{threatData.length}</div>
            <div className="text-sm text-gray-600">Countries</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{criticalCountries}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{highThreatCountries}</div>
            <div className="text-sm text-gray-600">High Threat</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalThreats}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
        </div>

        {/* Selected country details */}
        {selectedCountry && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">{selectedCountry}</h4>
            </div>
            {(() => {
              const countryData = getCountryData(selectedCountry)
              if (countryData) {
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Events: <span className="font-medium">{countryData.eventCount}</span></div>
                    <div>Recent: <span className="font-medium">{countryData.recentEvents}</span></div>
                    <div>Threat: <span className={`font-medium ${
                      countryData.threatLevel === 'critical' ? 'text-red-600' :
                      countryData.threatLevel === 'high' ? 'text-orange-600' :
                      countryData.threatLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>{countryData.threatLevel}</span></div>
                    <div>Code: <span className="font-medium">{countryData.countryCode}</span></div>
                  </div>
                )
              }
              return <p className="text-sm text-gray-600">No threat data available for this country.</p>
            })()}
          </div>
        )}
      </div>
    </Card>
  )
}
