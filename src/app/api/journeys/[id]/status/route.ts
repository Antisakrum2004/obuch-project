import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canManageJourneys } from '@/lib/rbac'
import { transitionJourney } from '@/lib/journey-engine'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (!canManageJourneys(auth.role)) return Errors.FORBIDDEN()

  const { id } = await params

  try {
    const body = await request.json()
    const { status } = body

    if (!status) return Errors.VALIDATION_ERROR('status is required')

    const result = await transitionJourney(id, status, auth.userId)
    if (!result.success) {
      return Errors.INVALID_STATE_TRANSITION(result.error || 'unknown', status)
    }

    // Return updated journey
    const { db } = await import('@/lib/db')
    const journey = await db.journey.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        stages: { include: { tasks: true }, orderBy: { order: 'asc' } },
      },
    })

    return apiSuccess(journey)
  } catch (error) {
    console.error('[Journey Status Error]', error)
    return Errors.VALIDATION_ERROR('Failed to update journey status')
  }
}
