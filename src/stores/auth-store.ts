import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  departmentId?: string | null
  avatarUrl?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('journey-os-auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        set({
          user: parsed.user,
          token: parsed.token,
          refreshToken: parsed.refreshToken,
          isAuthenticated: true,
        })
      } catch {
        localStorage.removeItem('journey-os-auth')
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await apiClient('POST', '/api/auth/login', { email, password })
      const { accessToken, refreshToken, user } = result.data as { accessToken: string; refreshToken: string; user: User }

      if (typeof window !== 'undefined') {
        localStorage.setItem('journey-os-auth', JSON.stringify({ token: accessToken, refreshToken, user }))
      }

      set({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } }
      set({
        isLoading: false,
        error: error?.error?.message || 'Login failed',
      })
      throw err
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('journey-os-auth')
    }
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    })
  },

  refreshAuth: async () => {
    const { refreshToken } = get()
    if (!refreshToken) return

    try {
      const result = await apiClient('POST', '/api/auth/refresh', { refreshToken })
      const { accessToken, refreshToken: newRefresh, user } = result.data as {
        accessToken: string
        refreshToken: string
        user: User
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('journey-os-auth', JSON.stringify({ token: accessToken, refreshToken: newRefresh, user }))
      }

      set({ token: accessToken, refreshToken: newRefresh, user, isAuthenticated: true })
    } catch {
      get().logout()
    }
  },
}))
