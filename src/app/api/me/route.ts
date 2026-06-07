import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { calculateJourneyProgress } from '@/lib/journey-engine'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true,
      departmentId: true, avatarUrl: true, isActive: true,
      department: { select: { id: true, name: true } },
    },
  })

  if (!user) return Errors.NOT_FOUND('User')

  // Get user's journey
  const journey = await db.journey.findUnique({
    where: { userId: auth.userId },
    include: {
      stages: {
        include: { tasks: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  let journeyData = null
  if (journey) {
    const progress = await calculateJourneyProgress(journey.id)
    const currentStage = journey.stages.find((s) => s.status === 'ACTIVE') || journey.stages.find((s) => s.status === 'PENDING')
    journeyData = { ...journey, progress, currentStage: currentStage || null }
  }

  return apiSuccess({ user, journey: journeyData })
}
