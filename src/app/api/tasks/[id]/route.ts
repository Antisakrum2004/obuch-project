import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canManageJourneys, canCompleteTasks } from '@/lib/rbac'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { id } = await params
  const task = await db.task.findUnique({
    where: { id },
    include: {
      stage: { include: { journey: true } },
      feedback: { include: { author: { select: { id: true, firstName: true, lastName: true } } } },
    },
  })

  if (!task) return Errors.NOT_FOUND('Task')

  // Employees can only see their own tasks
  if (auth.role === 'EMPLOYEE' && task.stage.journey.userId !== auth.userId) {
    return Errors.FORBIDDEN()
  }

  return apiSuccess(task)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { id } = await params

  const task = await db.task.findUnique({
    where: { id },
    include: { stage: { include: { journey: true } } },
  })
  if (!task) return Errors.NOT_FOUND('Task')

  // Only ADMIN/HR or task owner can update
  if (!canManageJourneys(auth.role) && auth.userId !== task.stage.journey.userId) {
    return Errors.FORBIDDEN()
  }

  try {
    const body = await request.json()
    const { title, description, type, status, dueDate, metadata } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (metadata !== undefined) updateData.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)

    const updated = await db.task.update({ where: { id }, data: updateData })
    return apiSuccess(updated)
  } catch {
    return Errors.NOT_FOUND('Task')
  }
}
