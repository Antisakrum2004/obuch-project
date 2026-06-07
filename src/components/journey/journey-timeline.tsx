'use client'

import { useJourneyStore } from '@/stores/journey-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, SkipForward, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  SKIPPED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершён',
  ACTIVE: 'Активен',
  SKIPPED: 'Пропущен',
  FAILED: 'Провален',
}

const taskTypeLabels: Record<string, string> = {
  LESSON: '📚 Урок',
  QUIZ: '📝 Тест',
  MEETING: '🤝 Встреча',
  DOCUMENT: '📄 Документ',
  CHECKLIST: '✅ Чеклист',
  CUSTOM: '⚡ Задача',
}

interface StageData {
  id: string
  name: string
  description?: string | null
  order: number
  status: string
  dueDate?: string | null
  tasks: TaskData[]
}

interface TaskData {
  id: string
  title: string
  description?: string | null
  type: string
  status: string
  dueDate?: string | null
}

export function JourneyTimeline() {
  const { journey, isLoading } = useJourneyStore()

  if (isLoading || !journey) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const stages = (journey.stages || []) as unknown as StageData[]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold">Мой путь</h1>
        <p className="text-muted-foreground mt-1">
          Прогресс: {journey.progress}%
        </p>
      </motion.div>

      <Progress value={journey.progress} className="h-3" />

      <div className="relative space-y-4">
        {stages.map((stage, index) => (
          <StageCard key={stage.id} stage={stage} index={index} isLast={index === stages.length - 1} />
        ))}
      </div>
    </div>
  )
}

function StageCard({ stage, index, isLast }: { stage: StageData; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(stage.status === 'ACTIVE')
  const { completeTask } = useJourneyStore()
  const { token } = useAuthStore()

  const completedTasks = stage.tasks.filter((t) => t.status === 'COMPLETED').length
  const totalTasks = stage.tasks.length
  const stageProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const statusIcon = () => {
    switch (stage.status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />
      case 'ACTIVE':
        return <Circle className="w-6 h-6 text-emerald-500 fill-emerald-500" />
      case 'SKIPPED':
        return <SkipForward className="w-6 h-6 text-gray-400" />
      default:
        return <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    if (!token) return
    try {
      await completeTask(taskId, token)
    } catch {
      // handled in store
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card className={`transition-all ${
        stage.status === 'ACTIVE'
          ? 'border-emerald-300 dark:border-emerald-700 shadow-md shadow-emerald-100 dark:shadow-emerald-950'
          : stage.status === 'COMPLETED'
          ? 'border-emerald-200 dark:border-emerald-800 opacity-80'
          : 'border-muted'
      }`}>
        <CardContent className="p-4">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex-shrink-0">{statusIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{stage.name}</h3>
                <Badge className={statusColors[stage.status] || ''} variant="outline">
                  {statusLabels[stage.status] || stage.status}
                </Badge>
              </div>
              {stage.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{completedTasks}/{totalTasks} задач</span>
                {stage.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(stage.dueDate).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={stageProgress} className="w-20 h-2" />
              <span className="text-xs font-medium w-8">{stageProgress}%</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {expanded && stage.tasks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 space-y-2 pl-10"
            >
              {stage.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{taskTypeLabels[task.type]?.split(' ')[0] || '⚡'}</span>
                    <span className={`text-sm ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-xs ${statusColors[task.status] || ''}`}>
                      {statusLabels[task.status] || task.status}
                    </Badge>
                    {task.status !== 'COMPLETED' && task.status !== 'SKIPPED' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id) }}
                        className="p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="Завершить задачу"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
