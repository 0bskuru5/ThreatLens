import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  verifyToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Set up axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Set up axios interceptor for authentication
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    // Response interceptor to handle token expiration
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  // Verify token on app start
  useEffect(() => {
    verifyToken()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      })

      const { token, user: userData } = response.data

      // Store token
      localStorage.setItem('auth_token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Set user
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear token
    localStorage.removeItem('auth_token')
    delete axios.defaults.headers.common['Authorization']

    // Clear user
    setUser(null)
  }

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await axios.get('/api/auth/verify')
      const { user: userData } = response.data

      setUser(userData)
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    verifyToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
