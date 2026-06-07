import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canCompleteTasks } from '@/lib/rbac'
import { emitEvent, EventType } from '@/lib/events'
import { completeTaskCascade } from '@/lib/journey-engine'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (!canCompleteTasks(auth.role)) return Errors.FORBIDDEN()

  const { id } = await params

  const task = await db.task.findUnique({
    where: { id },
    include: { stage: { include: { journey: true } } },
  })

  if (!task) return Errors.NOT_FOUND('Task')

  // Employees can only complete their own tasks
  if (auth.role === 'EMPLOYEE' && task.stage.journey.userId !== auth.userId) {
    return Errors.FORBIDDEN()
  }

  if (task.status === 'COMPLETED') {
    return Errors.VALIDATION_ERROR('Task is already completed')
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { result, metadata } = body

    const updateData: Record<string, unknown> = {
      status: 'COMPLETED',
      completedAt: new Date(),
    }

    if (metadata) {
      updateData.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    }

    const updated = await db.task.update({
      where: { id },
      data: updateData,
    })

    emitEvent(EventType.TASK_COMPLETED, {
      taskId: id,
      stageId: task.stageId,
      journeyId: task.stage.journeyId,
      completedBy: auth.userId,
      result,
    })

    // Cascade: check stage and journey completion
    await completeTaskCascade(id)

    return apiSuccess(updated)
  } catch (error) {
    console.error('[Task Complete Error]', error)
    return Errors.VALIDATION_ERROR('Failed to complete task')
  }
}
