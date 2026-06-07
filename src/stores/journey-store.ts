import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

interface Stage {
  id: string
  name: string
  description?: string | null
  order: number
  status: string
  dueDate?: string | null
  completedAt?: string | null
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  description?: string | null
  type: string
  status: string
  dueDate?: string | null
  completedAt?: string | null
  metadata?: string | null
  stageId: string
}

interface Journey {
  id: string
  status: string
  userId: string
  startedAt?: string | null
  completedAt?: string | null
  progress: number
  currentStage: Stage | null
  stages: Stage[]
}

interface DashboardData {
  type: string
  user?: unknown
  journey?: Journey | null
  currentStage?: Stage | null
  nextTasks?: Task[]
  stats?: {
    completedCount: number
    totalCount: number
    progress: number
    daysInJourney: number
    totalUsers?: number
    activeJourneys?: number
    totalJourneys?: number
    completedJourneys?: number
    completionRate?: number
  }
  recentEvents?: unknown[]
  atRisk?: unknown[]
}

interface JourneyState {
  journey: Journey | null
  dashboard: DashboardData | null
  isLoading: boolean
  error: string | null
  fetchJourney: (id: string, token: string) => Promise<void>
  fetchDashboard: (token: string) => Promise<void>
  completeTask: (taskId: string, token: string) => Promise<void>
}

export const useJourneyStore = create<JourneyState>((set) => ({
  journey: null,
  dashboard: null,
  isLoading: false,
  error: null,

  fetchJourney: async (id: string, token: string) => {
    set({ isLoading: true })
    try {
      const result = await apiClient('GET', `/api/journeys/${id}`, undefined, token)
      set({ journey: result.data as Journey, isLoading: false })
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } }
      set({ error: error?.error?.message || 'Failed to load journey', isLoading: false })
    }
  },

  fetchDashboard: async (token: string) => {
    set({ isLoading: true })
    try {
      const result = await apiClient('GET', '/api/dashboard', undefined, token)
      set({ dashboard: result.data as DashboardData, isLoading: false })
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } }
      set({ error: error?.error?.message || 'Failed to load dashboard', isLoading: false })
    }
  },

  completeTask: async (taskId: string, token: string) => {
    try {
      await apiClient('POST', `/api/tasks/${taskId}/complete`, {}, token)
      // Refresh dashboard after completing
      const result = await apiClient('GET', '/api/dashboard', undefined, token)
      set({ dashboard: result.data as DashboardData })
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } }
      set({ error: error?.error?.message || 'Failed to complete task' })
      throw err
    }
  },
}))
