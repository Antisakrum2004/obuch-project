import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { calculateJourneyProgress } from '@/lib/journey-engine'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { id } = await params

  const journey = await db.journey.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true } },
      stages: {
        include: { tasks: { include: { feedback: true } } },
        orderBy: { order: 'asc' },
      },
      events: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!journey) return Errors.NOT_FOUND('Journey')

  // Employees can only see their own journey
  if (auth.role === 'EMPLOYEE' && journey.userId !== auth.userId) {
    return Errors.FORBIDDEN()
  }

  const progress = await calculateJourneyProgress(id)
  const currentStage = journey.stages.find((s) => s.status === 'ACTIVE') || journey.stages.find((s) => s.status === 'PENDING')

  return apiSuccess({ ...journey, progress, currentStage: currentStage || null })
}
