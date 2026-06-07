import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { canCreateUsers } from '@/lib/rbac'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { id } = await params
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true,
      departmentId: true, avatarUrl: true, isActive: true, bitrixId: true,
      createdAt: true, updatedAt: true,
      department: { select: { id: true, name: true } },
    },
  })

  if (!user) return Errors.NOT_FOUND('User')
  return apiSuccess(user)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()

  const { id } = await params
  // Only ADMIN/HR or self can update
  if (!canCreateUsers(auth.role) && auth.userId !== id) {
    return Errors.FORBIDDEN()
  }

  try {
    const body = await request.json()
    const { firstName, lastName, role, departmentId, avatarUrl, isActive } = body

    const updateData: Record<string, unknown> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (role !== undefined && canCreateUsers(auth.role)) updateData.role = role
    if (departmentId !== undefined) updateData.departmentId = departmentId
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (isActive !== undefined && canCreateUsers(auth.role)) updateData.isActive = isActive

    const user = await db.user.update({ where: { id }, data: updateData })
    const { password: _, ...userDto } = user
    return apiSuccess(userDto)
  } catch {
    return Errors.NOT_FOUND('User')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request)
  if (!auth) return Errors.UNAUTHORIZED()
  if (auth.role !== 'ADMIN') return Errors.FORBIDDEN()

  const { id } = await params
  try {
    await db.user.update({ where: { id }, data: { isActive: false } })
    return apiSuccess({ id })
  } catch {
    return Errors.NOT_FOUND('User')
  }
}
