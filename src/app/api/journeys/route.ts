import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canManageJourneys, canViewAllJourneys } from '@/lib/rbac'
import { emitEvent, EventType } from '@/lib/events'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const userId = searchParams.get('userId') || undefined

  // Employees can only see their own journey
  const where: Record<string, unknown> = {}
  if (!canViewAllJourneys(auth.role)) {
    where.userId = auth.userId
  } else if (userId) {
    where.userId = userId
  }
  if (status) where.status = status

  const journeys = await db.journey.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      stages: { include: { tasks: true }, orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const journeysWithProgress = journeys.map((j) => {
    const allTasks = j.stages.flatMap((s) => s.tasks)
    const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length
    const progress = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0
    return { ...j, progress }
  })

  return apiSuccess(journeysWithProgress)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (!canManageJourneys(auth.role)) return Errors.FORBIDDEN()

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) return Errors.VALIDATION_ERROR('userId is required')

    // Check user exists and doesn't already have a journey
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return Errors.NOT_FOUND('User')

    const existing = await db.journey.findUnique({ where: { userId } })
    if (existing) return Errors.VALIDATION_ERROR('User already has a journey')

    // Create journey with default stages
    const journey = await db.journey.create({
      data: {
        userId,
        status: 'DRAFT',
        stages: {
          create: [
            { name: 'Day 1 — Первый день', description: 'Знакомство с компанией, доступы, вводный курс', order: 1, status: 'PENDING' },
            { name: 'Week 1 — Первая неделя', description: 'Обучение, тесты, наставник', order: 2, status: 'PENDING' },
            { name: 'Month 1 — Первый месяц', description: 'Первая задача, контроль', order: 3, status: 'PENDING' },
            { name: 'Month 3 — Аттестация', description: 'Оценка, аттестация', order: 4, status: 'PENDING' },
          ],
        },
      },
      include: { stages: true, user: { select: { id: true, firstName: true, lastName: true } } },
    })

    emitEvent(EventType.JOURNEY_CREATED, { journeyId: journey.id, userId, createdBy: auth.userId })

    await db.journeyEvent.create({
      data: {
        journeyId: journey.id,
        type: EventType.JOURNEY_CREATED,
        payload: JSON.stringify({ userId, createdBy: auth.userId }),
      },
    })

    return apiSuccess({ ...journey, progress: 0 }, 201)
  } catch (error) {
    console.error('[Journeys Create Error]', error)
    return Errors.VALIDATION_ERROR('Failed to create journey')
  }
}
