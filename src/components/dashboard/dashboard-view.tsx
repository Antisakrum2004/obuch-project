'use client'

import { useJourneyStore } from '@/stores/journey-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Users,
  Route,
  AlertTriangle,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
  ACTIVE: 'Активен',
  DRAFT: 'Черновик',
  PAUSED: 'Приостановлен',
  CANCELLED: 'Отменён',
  FAILED: 'Провален',
  SKIPPED: 'Пропущен',
}

const taskTypeLabels: Record<string, string> = {
  LESSON: '📚 Урок',
  QUIZ: '📝 Тест',
  MEETING: '🤝 Встреча',
  DOCUMENT: '📄 Документ',
  CHECKLIST: '✅ Чеклист',
  CUSTOM: '⚡ Задача',
}

export function DashboardView() {
  const { dashboard, isLoading } = useJourneyStore()
  const { user } = useAuthStore()

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (dashboard.type === 'admin') {
    return <AdminDashboard />
  }

  return <EmployeeDashboard />
}

function EmployeeDashboard() {
  const { dashboard, completeTask } = useJourneyStore()
  const { token } = useAuthStore()

  const stats = dashboard?.stats
  const journey = dashboard?.journey
  const currentStage = dashboard?.currentStage
  const nextTasks = dashboard?.nextTasks || []

  const handleCompleteTask = async (taskId: string) => {
    if (!token) return
    try {
      await completeTask(taskId, token)
    } catch {
      // Error handled in store
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold">
          Привет, {dashboard?.user && (dashboard.user as Record<string, string>).firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Вот ваш прогресс на сегодня</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <Route className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats?.progress || 0}%</p>
                  <p className="text-xs text-muted-foreground">Прогресс</p>
                </div>
              </div>
              <Progress value={stats?.progress || 0} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.completedCount || 0}/{stats?.totalCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Задач выполнено</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentStage?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">Текущий этап</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.daysInJourney || 0}</p>
                  <p className="text-xs text-muted-foreground">Дней в пути</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Current Stage & Next Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stage */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-emerald-600" />
                Текущий этап
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{currentStage.name}</h3>
                    <Badge className={statusColors[currentStage.status] || ''}>
                      {statusLabels[currentStage.status] || currentStage.status}
                    </Badge>
                  </div>
                  {currentStage.description && (
                    <p className="text-sm text-muted-foreground">{currentStage.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {currentStage.tasks.filter((t: Record<string, string>) => t.status === 'COMPLETED').length}/{currentStage.tasks.length} задач
                    </span>
                  </div>
                  <Progress
                    value={
                      currentStage.tasks.length > 0
                        ? (currentStage.tasks.filter((t: Record<string, string>) => t.status === 'COMPLETED').length / currentStage.tasks.length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">Нет активного этапа</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Tasks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Следующие задачи
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextTasks.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {nextTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">{taskTypeLabels[task.type]?.split(' ')[0] || '⚡'}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{taskTypeLabels[task.type] || task.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={statusColors[task.status] || ''}>
                          {statusLabels[task.status] || task.status}
                        </Badge>
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                            title="Завершить"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Нет предстоящих задач</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { dashboard } = useJourneyStore()
  const stats = dashboard?.stats as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold">Панель управления</h1>
        <p className="text-muted-foreground mt-1">Обзор адаптации сотрудников</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Сотрудников', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
          { label: 'Активных путей', value: stats?.activeJourneys || 0, icon: Route, color: 'emerald' },
          { label: 'Завершено', value: stats?.completedJourneys || 0, icon: CheckCircle2, color: 'amber' },
          { label: '% завершения', value: `${stats?.completionRate || 0}%`, icon: TrendingUp, color: 'purple' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900 flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* At Risk */}
      {dashboard?.atRisk && (dashboard.atRisk as unknown[]).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                Под угрозой срыва
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(dashboard.atRisk as Record<string, unknown>[]).map((j, i) => {
                  const jUser = j.user as Record<string, string>
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                      <div>
                        <p className="font-medium">{jUser?.firstName} {jUser?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{jUser?.email}</p>
                      </div>
                      <Badge variant="outline" className="border-amber-300 text-amber-700">Просрочено</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
