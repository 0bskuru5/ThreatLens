import { useDashboardOverview, useChartData } from '../hooks/useDashboard'
import { useRealtimeEvents } from '../hooks/useSecurityEvents'
import Card, { CardHeader, CardContent } from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  Activity,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'

const severityColors = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a'
}

export default function DashboardPage() {
  // Enable real-time events
  useRealtimeEvents()

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview()
  const { data: chartData, isLoading: chartLoading } = useChartData('24h')

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const metrics = overview?.metrics || {
    total_events: 0,
    events_24h: 0,
    events_7d: 0,
    events_30d: 0,
    critical_events: 0,
    high_severity: 0,
    unique_ips: 0
  }

  // Prepare chart data
  const timelineData = chartData?.map(item => ({
    ...item,
    time: format(new Date(item.time_period), 'HH:mm')
  })) || []

  // Prepare severity distribution
  const severityData = [
    { name: 'Low', value: metrics.total_events - metrics.critical_events - metrics.high_severity - (metrics.total_events * 0.2), color: severityColors.low },
    { name: 'Medium', value: Math.max(0, metrics.total_events - metrics.critical_events - metrics.high_severity - (metrics.total_events * 0.1)), color: severityColors.medium },
    { name: 'High', value: metrics.high_severity, color: severityColors.high },
    { name: 'Critical', value: metrics.critical_events, color: severityColors.critical }
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Security operations overview</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Last updated: {format(new Date(), 'HH:mm:ss')}</span>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total_events.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events (24h)</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.events_24h.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.critical_events.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique IPs</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.unique_ips.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Events Timeline (24h)</h3>
            <p className="text-sm text-gray-600">Security events over the last 24 hours</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total_events"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Severity distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Severity Distribution</h3>
            <p className="text-sm text-gray-600">Breakdown of events by severity level</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent events */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          <p className="text-sm text-gray-600">Latest security events</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview?.recent_events?.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    event.severity === 'critical' ? 'bg-danger-500' :
                    event.severity === 'high' ? 'bg-warning-500' :
                    event.severity === 'medium' ? 'bg-primary-500' : 'bg-success-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-600">
                      {event.source_ip} • {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.severity === 'critical' ? 'bg-danger-100 text-danger-800' :
                    event.severity === 'high' ? 'bg-warning-100 text-warning-800' :
                    event.severity === 'medium' ? 'bg-primary-100 text-primary-800' :
                    'bg-success-100 text-success-800'
                  }`}>
                    {event.severity}
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                <p className="mt-1 text-sm text-gray-500">No security events have been recorded yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
