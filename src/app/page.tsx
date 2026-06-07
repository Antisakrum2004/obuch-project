'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useJourneyStore } from '@/stores/journey-store'
import { LoginForm } from '@/components/auth/login-form'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { JourneyTimeline } from '@/components/journey/journey-timeline'
import { TaskList } from '@/components/tasks/task-list'
import { UsersTable } from '@/components/users/users-table'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { motion, AnimatePresence } from 'framer-motion'

type ViewType = 'dashboard' | 'journey' | 'tasks' | 'users'

const emptySubscribe = () => () => {}

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

export default function Home() {
  const { isAuthenticated, token, initialize } = useAuthStore()
  const { fetchDashboard, fetchJourney } = useJourneyStore()
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const hydrated = useHydrated()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboard(token)
    }
  }, [isAuthenticated, token, fetchDashboard])

  // Load journey data when viewing journey or tasks
  useEffect(() => {
    if (isAuthenticated && token && (currentView === 'journey' || currentView === 'tasks')) {
      const dashboard = useJourneyStore.getState().dashboard
      const journeyId = dashboard?.journey?.id
      if (journeyId) {
        fetchJourney(journeyId, token)
      }
    }
  }, [currentView, isAuthenticated, token, fetchJourney])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-emerald-600 text-lg font-medium">Loading Journey OS...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />
      case 'journey':
        return <JourneyTimeline />
      case 'tasks':
        return <TaskList />
      case 'users':
        return <UsersTable />
      default:
        return <DashboardView />
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 lg:p-8"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
          <footer className="mt-auto border-t py-4 px-6 text-center text-sm text-muted-foreground">
            Journey OS — Employee Journey Platform
          </footer>
        </main>
      </div>
    </SidebarProvider>
  )
}
