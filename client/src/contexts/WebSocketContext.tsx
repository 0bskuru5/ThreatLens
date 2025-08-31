import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    if (!isAuthenticated || !user) return

    const token = localStorage.getItem('auth_token')
    if (!token) return

    // Create socket connection
    const socket = io('http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)

      // Auto-reconnect on disconnection (except for authentication errors)
      if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          connect()
        }, 5000)
      }
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)

      // If authentication fails, don't retry
      if (error.message === 'Authentication failed') {
        return
      }

      // Retry connection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 5000)
    })

    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    socketRef.current = socket
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }

  // Connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const value: WebSocketContextType = {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
