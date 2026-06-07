import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canCreateUsers } from '@/lib/rbac'
import { hash } from 'bcryptjs'
import { emitEvent, EventType } from '@/lib/events'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (!canCreateUsers(auth.role)) return Errors.FORBIDDEN()

  const { searchParams } = new URL(request.url)
  const take = parseInt(searchParams.get('take') || '20')
  const skip = parseInt(searchParams.get('skip') || '0')

  const [users, total] = await Promise.all([
    db.user.findMany({
      take,
      skip,
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        departmentId: true, avatarUrl: true, isActive: true, createdAt: true, updatedAt: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count(),
  ])

  return apiSuccess({ users, meta: { total, take, skip } })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (!canCreateUsers(auth.role)) return Errors.FORBIDDEN()

  try {
    const body = await request.json()
    const { email, firstName, lastName, role, departmentId, password } = body

    if (!email || !firstName || !lastName || !role || !password) {
      return Errors.VALIDATION_ERROR('email, firstName, lastName, role, password are required')
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return Errors.EMAIL_EXISTS()

    const hashedPassword = await hash(password, 12)
    const user = await db.user.create({
      data: { email, firstName, lastName, role, departmentId: departmentId || null, password: hashedPassword },
    })

    emitEvent(EventType.USER_CREATED, { userId: user.id, role: user.role, createdBy: auth.userId })

    const { password: _, ...userDto } = user
    return apiSuccess(userDto, 201)
  } catch (error) {
    console.error('[Users Create Error]', error)
    return Errors.VALIDATION_ERROR('Failed to create user')
  }
}
