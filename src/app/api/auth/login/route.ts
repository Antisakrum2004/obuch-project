import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { apiSuccess, Errors } from '@/lib/errors'
import { compare } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Errors.VALIDATION_ERROR('Email and password are required')
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return Errors.INVALID_CREDENTIALS()
    if (!user.isActive) return Errors.INVALID_CREDENTIALS()

    const valid = await compare(password, user.password)
    if (!valid) return Errors.INVALID_CREDENTIALS()

    const accessToken = signAccessToken({ userId: user.id, role: user.role })
    const refreshToken = signRefreshToken({ userId: user.id })

    const { password: _, ...userDto } = user
    return apiSuccess({ accessToken, refreshToken, user: userDto })
  } catch (error) {
    console.error('[Auth Login Error]', error)
    return Errors.INVALID_CREDENTIALS()
  }
}
