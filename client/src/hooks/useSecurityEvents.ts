import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useEffect } from 'react'

export interface SecurityEvent {
  id: number
  type: string
  severity: string
  source_ip: string
  user_agent: string
  timestamp: string
  description: string
  location: {
    country: string
    city: string
  }
  request_path?: string
  request_method?: string
}

export interface EventsResponse {
  events: SecurityEvent[]
  total: number
  limit: number
  offset: number
}

export interface EventFilters {
  event_type?: string
  severity?: string
  source_ip?: string
  start_date?: string
  end_date?: string
}

// Fetch security events
export function useSecurityEvents(filters: EventFilters = {}, page = 1, limit = 50) {
  const offset = (page - 1) * limit

  return useQuery({
    queryKey: ['security-events', filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
        ),
      })

      const response = await axios.get<EventsResponse>(`/api/events?${params}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })
}

// Fetch single event
export function useSecurityEvent(id: number) {
  return useQuery({
    queryKey: ['security-event', id],
    queryFn: async () => {
      const response = await axios.get<SecurityEvent>(`/api/events/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Create new security event
export function useCreateSecurityEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventData: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
      const response = await axios.post<SecurityEvent>('/api/events', eventData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['security-events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Real-time events subscription
export function useRealtimeEvents() {
  const { socket } = useWebSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    const handleNewEvent = (event: SecurityEvent) => {
      console.log('New security event received:', event)

      // Update the events cache
      queryClient.setQueryData(['security-events'], (oldData: EventsResponse | undefined) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          events: [event, ...oldData.events.slice(0, 49)], // Keep only first 50
          total: oldData.total + 1,
        }
      })

      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    }

    socket.on('security_event', handleNewEvent)

    return () => {
      socket.off('security_event', handleNewEvent)
    }
  }, [socket, queryClient])
}
