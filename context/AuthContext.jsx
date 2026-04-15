"use client"

/**
 * =============================================================================
 * AUTHENTICATION CONTEXT
 * =============================================================================
 * 
 * This context uses localStorage to persist auth state for TESTING purposes.
 * 
 * HOW TO SWITCH TO REAL API AUTHENTICATION:
 * -----------------------------------------
 * 1. Update API_BASE_URL to your backend server URL
 * 2. The localStorage here stores JWT tokens from the backend
 * 3. Token-based auth is already implemented - just connect to real backend
 * 
 * HOW TO REMOVE LOCALSTORAGE:
 * ---------------------------
 * 1. Use cookies/httpOnly cookies for token storage (more secure)
 * 2. Replace localStorage.setItem/getItem with cookie operations
 * 3. For production, consider using next-auth or similar
 */

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Change this to your backend URL when deploying
// For local testing, both frontend and backend should work together
const API_BASE_URL = typeof window !== 'undefined'
  ? (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ? 'http://localhost:5001' : '')
  : ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('jobportal_token')
    const storedUser = localStorage.getItem('jobportal_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Signup function
  const signup = async (name, email, password, role) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('jobportal_token', data.token)
      localStorage.setItem('jobportal_user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Login function
  const login = async (email, password) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('jobportal_token', data.token)
      localStorage.setItem('jobportal_user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('jobportal_token')
    localStorage.removeItem('jobportal_user')
    setToken(null)
    setUser(null)
  }

  // Helper function for authenticated API calls
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    })
    
    // Handle token expiration
    if (response.status === 401 || response.status === 403) {
      logout()
      throw new Error('Session expired. Please login again.')
    }
    
    return response
  }

  const value = {
    user,
    token,
    loading,
    error,
    signup,
    login,
    logout,
    authFetch,
    isAuthenticated: !!token,
    isPoster: user?.role === 'poster',
    isSeeker: user?.role === 'seeker'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
