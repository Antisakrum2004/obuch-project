import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canViewAllJourneys } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  if (canViewAllJourneys(auth.role)) {
    // HR / Admin / Manager dashboard
    const [totalUsers, activeJourneys, totalJourneys, recentEvents] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.journey.count({ where: { status: 'ACTIVE' } }),
      db.journey.count(),
      db.journeyEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { journey: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
    ])

    const completedJourneys = await db.journey.count({ where: { status: 'COMPLETED' } })
    const completionRate = totalJourneys > 0 ? Math.round((completedJourneys / totalJourneys) * 100) : 0

    // Users with active journeys that are behind schedule
    const atRiskJourneys = await db.journey.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        stages: { include: { tasks: true }, orderBy: { order: 'asc' } },
      },
      take: 5,
    })

    const atRisk = atRiskJourneys.filter((j) => {
      const overdueTasks = j.stages.some(
        (s) => s.status === 'ACTIVE' && s.tasks.some((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED')
      )
      return overdueTasks
    })

    return apiSuccess({
      type: 'admin',
      stats: { totalUsers, activeJourneys, totalJourneys, completedJourneys, completionRate },
      recentEvents,
      atRisk,
    })
  } else {
    // Employee / Mentor dashboard
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, firstName: true, lastName: true, role: true, department: { select: { name: true } } },
    })

    const journey = await db.journey.findUnique({
      where: { userId: auth.userId },
      include: {
        stages: { include: { tasks: true }, orderBy: { order: 'asc' } },
      },
    })

    if (!journey) {
      return apiSuccess({ type: 'employee', user, journey: null, nextTasks: [], progress: 0 })
    }

    const allTasks = journey.stages.flatMap((s) => s.tasks)
    const completedCount = allTasks.filter((t) => t.status === 'COMPLETED').length
    const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0
    const currentStage = journey.stages.find((s) => s.status === 'ACTIVE') || journey.stages.find((s) => s.status === 'PENDING')

    const nextTasks = allTasks
      .filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
      .slice(0, 5)

    const daysInJourney = journey.startedAt
      ? Math.floor((Date.now() - new Date(journey.startedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return apiSuccess({
      type: 'employee',
      user,
      journey: { ...journey, progress },
      currentStage,
      nextTasks,
      stats: { completedCount, totalCount: allTasks.length, progress, daysInJourney },
    })
  }
}
