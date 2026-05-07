"use client"

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE_URL = typeof window !== 'undefined'
  ? (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ? 'http://localhost:5001' : '')
  : ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('jobportal_token')
    const storedUser = localStorage.getItem('jobportal_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

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

  const login = async (email, password, expectedRole) => {
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

      if (expectedRole && data.user?.role !== expectedRole) {
        return {
          success: false,
          error: `Please login with a ${expectedRole} account. This email is registered as a ${data.user.role} account.`
        }
      }

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

  const logout = () => {
    localStorage.removeItem('jobportal_token')
    localStorage.removeItem('jobportal_user')
    setToken(null)
    setUser(null)
  }

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
