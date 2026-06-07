import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'journey-os-jwt-secret-dev'
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

interface TokenPayload {
  userId: string
  role: string
}

interface RefreshTokenPayload {
  userId: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export function verifyToken(token: string): TokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, JWT_SECRET) as TokenPayload & { iat: number; exp: number }
}

export async function getAuthUser(request: NextRequest): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  try {
    const decoded = verifyToken(token)
    return { userId: decoded.userId, role: decoded.role }
  } catch {
    return null
  }
}
