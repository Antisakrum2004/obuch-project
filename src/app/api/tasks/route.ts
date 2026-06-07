import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canManageJourneys } from '@/lib/rbac'
import { emitEvent, EventType } from '@/lib/events'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { searchParams } = new URL(request.url)
  const stageId = searchParams.get('stageId') || undefined
  const status = searchParams.get('status') || undefined

  const where: Record<string, unknown> = {}
  if (stageId) where.stageId = stageId
  if (status) where.status = status

  // Employees see only their tasks
  if (auth.role === 'EMPLOYEE') {
    where.stage = { journey: { userId: auth.userId } }
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      stage: { include: { journey: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } } },
      feedback: { include: { author: { select: { id: true, firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return apiSuccess(tasks)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (!canManageJourneys(auth.role)) return Errors.FORBIDDEN()

  try {
    const body = await request.json()
    const { stageId, title, description, type, dueDate } = body

    if (!stageId || !title || !type) {
      return Errors.VALIDATION_ERROR('stageId, title, and type are required')
    }

    const task = await db.task.create({
      data: {
        stageId,
        title,
        description: description || null,
        type,
        dueDate: dueDate ? new Date(dueDate) : null,
        metadata: null,
      },
    })

    emitEvent(EventType.TASK_ASSIGNED, { taskId: task.id, stageId, createdBy: auth.userId })

    return apiSuccess(task, 201)
  } catch (error) {
    console.error('[Tasks Create Error]', error)
    return Errors.VALIDATION_ERROR('Failed to create task')
  }
}
