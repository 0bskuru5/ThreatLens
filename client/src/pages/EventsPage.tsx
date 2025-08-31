import { useState } from 'react'
import { useSecurityEvents, useRealtimeEvents } from '../hooks/useSecurityEvents'
import Card, { CardHeader, CardContent } from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import { Search, Filter, AlertTriangle, Shield, Globe } from 'lucide-react'

export default function EventsPage() {
  // Enable real-time events
  useRealtimeEvents()

  const [filters, setFilters] = useState({
    event_type: '',
    severity: '',
    source_ip: ''
  })
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, error } = useSecurityEvents(filters, currentPage, 20)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-danger-100 text-danger-800'
      case 'high': return 'bg-warning-100 text-warning-800'
      case 'medium': return 'bg-primary-100 text-primary-800'
      case 'low': return 'bg-success-100 text-success-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <Shield className="h-4 w-4" />
      case 'sql_injection': return <AlertTriangle className="h-4 w-4" />
      case 'xss_attempt': return <AlertTriangle className="h-4 w-4" />
      case 'command_injection': return <AlertTriangle className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Events</h1>
          <p className="text-gray-600">Monitor and analyze security events</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={filters.event_type}
                onChange={(e) => handleFilterChange('event_type', e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="failed_login">Failed Login</option>
                <option value="sql_injection">SQL Injection</option>
                <option value="xss_attempt">XSS Attempt</option>
                <option value="command_injection">Command Injection</option>
                <option value="brute_force">Brute Force</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="input"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source IP</label>
              <input
                type="text"
                placeholder="192.168.1.1"
                value={filters.source_ip}
                onChange={(e) => handleFilterChange('source_ip', e.target.value)}
                className="input"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ event_type: '', severity: '', source_ip: '' })}
                className="btn btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Events</h3>
              <p className="text-sm text-gray-600">
                {data?.total || 0} total events
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-danger-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading events</h3>
              <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
            </div>
          ) : data?.events?.length ? (
            <div className="space-y-4">
              {data.events.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`p-2 rounded-lg ${
                          event.severity === 'critical' ? 'bg-danger-100' :
                          event.severity === 'high' ? 'bg-warning-100' :
                          'bg-primary-100'
                        }`}>
                          {getEventTypeIcon(event.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 capitalize">
                            {event.type.replace('_', ' ')}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{event.source_ip}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{event.location.country}, {event.location.city}</span>
                          </div>
                          <span>{format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, data.total)} of {data.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * 20 >= data.total}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
