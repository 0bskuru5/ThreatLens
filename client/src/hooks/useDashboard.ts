import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface DashboardMetrics {
  total_events: number
  events_24h: number
  events_7d: number
  events_30d: number
  critical_events: number
  high_severity: number
  unique_ips: number
}

export interface DashboardStats {
  metrics: DashboardMetrics
  top_event_types: Array<{ type: string; count: number }>
  top_source_ips: Array<{ ip: string; count: number }>
  recent_events: Array<{
    id: number
    type: string
    severity: string
    source_ip: string
    timestamp: string
    description: string
    location: { country: string; city: string }
  }>
}

export interface ChartData {
  time_period: string
  total_events: number
  failed_login: number
  sql_injection: number
  xss_attempt: number
  command_injection: number
}

// Fetch dashboard overview
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const response = await axios.get<DashboardStats>('/api/dashboard/overview')
      return response.data
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  })
}

// Fetch chart data for timeline
export function useChartData(period: string = '24h') {
  return useQuery({
    queryKey: ['chart-data', period],
    queryFn: async () => {
      const response = await axios.get<ChartData[]>(`/api/dashboard/charts/timeline?period=${period}`)
      return response.data
    },
    staleTime: 300000, // 5 minutes
  })
}

// Fetch geolocation data
export function useGeolocationData() {
  return useQuery({
    queryKey: ['geolocation-data'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/geolocation')
      return response.data
    },
    staleTime: 300000, // 5 minutes
  })
}
