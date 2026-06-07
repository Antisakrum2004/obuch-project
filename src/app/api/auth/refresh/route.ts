import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signAccessToken, signRefreshToken, verifyToken } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) return Errors.UNAUTHORIZED()

    const decoded = verifyToken(refreshToken)
    if (!decoded?.userId) return Errors.UNAUTHORIZED()

    const user = await db.user.findUnique({ where: { id: decoded.userId } })
    if (!user || !user.isActive) return Errors.UNAUTHORIZED()

    const newAccessToken = signAccessToken({ userId: user.id, role: user.role })
    const newRefreshToken = signRefreshToken({ userId: user.id })

    const { password: _, ...userDto } = user
    return apiSuccess({ accessToken: newAccessToken, refreshToken: newRefreshToken, user: userDto })
  } catch {
    return Errors.UNAUTHORIZED()
  }
}
