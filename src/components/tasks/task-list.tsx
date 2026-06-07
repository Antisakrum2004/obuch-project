'use client'

import { useJourneyStore } from '@/stores/journey-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { CheckCircle2, ListChecks } from 'lucide-react'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  SKIPPED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершена',
  FAILED: 'Провалена',
  SKIPPED: 'Пропущена',
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
  status: string
  tasks: TaskData[]
}

interface TaskData {
  id: string
  title: string
  description?: string | null
  type: string
  status: string
  dueDate?: string | null
  completedAt?: string | null
  stageId: string
}

export function TaskList() {
  const { journey, isLoading } = useJourneyStore()

  if (isLoading || !journey) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  const stages = (journey.stages || []) as unknown as StageData[]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold">Задачи</h1>
        <p className="text-muted-foreground mt-1">Все задачи вашего пути</p>
      </motion.div>

      {stages.map((stage, stageIndex) => (
        <TaskStageGroup key={stage.id} stage={stage} stageIndex={stageIndex} />
      ))}
    </div>
  )
}

function TaskStageGroup({ stage, stageIndex }: { stage: StageData; stageIndex: number }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const { completeTask } = useJourneyStore()
  const { token } = useAuthStore()

  const pendingTasks = stage.tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'SKIPPED')
  const completedTasks = stage.tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED')

  const handleComplete = async (taskId: string) => {
    if (!token) return
    try {
      await completeTask(taskId, token)
    } catch {
      // handled in store
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stageIndex * 0.05 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-emerald-600" />
            {stage.name}
            <Badge className={statusColors[stage.status] || ''} variant="outline">
              {statusLabels[stage.status] || stage.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} onComplete={handleComplete} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Нет активных задач</p>
          )}

          {completedTasks.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full text-muted-foreground text-xs"
              >
                {showCompleted ? 'Скрыть' : 'Показать'} завершённые ({completedTasks.length})
              </Button>
              {showCompleted && completedTasks.map((task) => (
                <TaskRow key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TaskRow({ task, onComplete }: { task: TaskData; onComplete: (id: string) => Promise<void> }) {
  const isCompleted = task.status === 'COMPLETED' || task.status === 'SKIPPED'

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
      isCompleted ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/50'
    }`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-lg">{taskTypeLabels[task.type]?.split(' ')[0] || '⚡'}</span>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? 'line-through' : ''}`}>{task.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{taskTypeLabels[task.type] || task.type}</span>
            {task.dueDate && (
              <span>· до {new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={`text-xs ${statusColors[task.status] || ''}`}>
          {statusLabels[task.status] || task.status}
        </Badge>
        {!isCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComplete(task.id)}
            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Готово
          </Button>
        )}
      </div>
    </div>
  )
}
