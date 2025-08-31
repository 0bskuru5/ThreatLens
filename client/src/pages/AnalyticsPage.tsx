import { useChartData, useGeolocationData } from '../hooks/useDashboard'
import Card, { CardHeader, CardContent } from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, Globe, Shield } from 'lucide-react'

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
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-hour timeline */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Events Timeline (24h)</h3>
            <p className="text-sm text-gray-600">Hourly event distribution</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chart24hLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData24h}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="failed_login"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Failed Login"
                    />
                    <Line
                      type="monotone"
                      dataKey="sql_injection"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="SQL Injection"
                    />
                    <Line
                      type="monotone"
                      dataKey="xss_attempt"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="XSS Attempt"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 7-day overview */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Trends</h3>
            <p className="text-sm text-gray-600">Daily event patterns over 7 days</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chart7dLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData7d}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_events" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geolocation and insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geolocation chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
            <p className="text-sm text-gray-600">Security events by country</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {geoLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : geoChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geoChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="events" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <Globe className="h-12 w-12 text-gray-400 mb-4" />
                  <p>No geographic data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
