import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import App from './App'

// Mock the auth context
vi.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock WebSocket context
vi.mock('./contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    socket: null,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn()
  }),
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('App', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  test('renders without crashing', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // The app should render without crashing
    expect(document.body).toBeInTheDocument()
  })

  test('renders in test environment', () => {
    // Simple test to verify the test environment is working
    expect(process.env.NODE_ENV).toBe('test')
    expect(true).toBe(true)
  })
})
