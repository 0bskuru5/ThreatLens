import { useChartData, useGeolocationData } from '../hooks/useDashboard'
import Card, { CardHeader, CardContent } from '../components/Card'
import AdvancedChart from '../components/charts/AdvancedChart'
import ThreatMap from '../components/charts/ThreatMap'
import ExportTools from '../components/export/ExportTools'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import { TrendingUp, Globe, Shield, Download, MapPin, Activity } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: chartData24h, isLoading: chart24hLoading } = useChartData('24h')
  const { data: chartData7d, isLoading: chart7dLoading } = useChartData('7d')
  const { data: geoData, isLoading: geoLoading } = useGeolocationData()

  // Process geolocation data for visualization
  const geoChartData = geoData?.slice(0, 10).map(item => ({
    country: item.country,
    events: item.count
  })) || []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280']

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Advanced security analytics and insights</p>
        </div>

        {/* Export tools */}
        <ExportTools
          data={chartData24h || []}
          filename={`threatlens-analytics-${format(new Date(), 'yyyy-MM-dd')}`}
          title="ThreatLens Security Analytics Report"
          formats={['pdf', 'csv', 'xlsx', 'json']}
          columns={[
            { key: 'time_period', label: 'Time Period' },
            { key: 'total_events', label: 'Total Events' },
            { key: 'failed_login', label: 'Failed Logins' },
            { key: 'sql_injection', label: 'SQL Injections' },
            { key: 'xss_attempt', label: 'XSS Attempts' },
            { key: 'command_injection', label: 'Command Injections' }
          ]}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-hour timeline with drill-down */}
        <AdvancedChart
          title="Events Timeline (24h)"
          data={chartData24h || []}
          type="line"
          dataKeys={['total_events', 'failed_login', 'sql_injection', 'xss_attempt']}
          colors={['#3b82f6', '#ef4444', '#f59e0b', '#10b981']}
          height={300}
          showTrend={true}
          drillDown={true}
          onDrillDown={(data) => console.log('Drill-down:', data)}
        />

        {/* 7-day overview */}
        <AdvancedChart
          title="Weekly Trends"
          data={chartData7d || []}
          type="bar"
          dataKeys={['total_events']}
          colors={['#3b82f6']}
          height={300}
          showTrend={true}
        />
      </div>

      {/* Geolocation and insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Threat Map */}
        <ThreatMap
          threatData={geoChartData.map(item => ({
            country: item.country,
            countryCode: item.country,
            latitude: 0, // Default coordinates, would be enhanced with actual geo data
            longitude: 0,
            threatLevel: 'medium' as const,
            eventCount: item.events,
            recentEvents: Math.floor(item.events * 0.3) // Estimate recent events
          }))}
          onCountryClick={(countryData) => console.log('Country clicked:', countryData)}
          height={400}
          className="lg:col-span-2"
        />

        {/* Insights panel */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Security Insights</h3>
            <p className="text-sm text-gray-600">Key findings and trends</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-success-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-success-800">Threat Level: Low</p>
                    <p className="text-xs text-success-600">Normal activity patterns</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-warning-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-warning-800">Top Threat: Failed Login</p>
                    <p className="text-xs text-warning-600">45% of total events</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-primary-800">Primary Source</p>
                    <p className="text-xs text-primary-600">United States (32%)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed metrics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Event Type Breakdown</h3>
          <p className="text-sm text-gray-600">Detailed analysis of security event types</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-danger-600">127</div>
              <div className="text-sm text-gray-600">Failed Logins</div>
              <div className="text-xs text-danger-500">+12% from last week</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-warning-600">34</div>
              <div className="text-sm text-gray-600">SQL Injections</div>
              <div className="text-xs text-success-500">-8% from last week</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">28</div>
              <div className="text-sm text-gray-600">XSS Attempts</div>
              <div className="text-xs text-success-500">-15% from last week</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-danger-600">8</div>
              <div className="text-sm text-gray-600">Critical Events</div>
              <div className="text-xs text-warning-500">+5% from last week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
