import { NextResponse } from 'next/server'

interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function apiError(code: string, message: string, status: number, details?: unknown): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined && { details }) } },
    { status }
  )
}

export function apiSuccess(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export const Errors = {
  UNAUTHORIZED: () => apiError('UNAUTHORIZED', 'Authentication required', 401),
  FORBIDDEN: (message?: string) => apiError('FORBIDDEN', message || 'Insufficient permissions', 403),
  NOT_FOUND: (entity = 'Resource') => apiError('NOT_FOUND', `${entity} not found`, 404),
  VALIDATION_ERROR: (message: string) => apiError('VALIDATION_ERROR', message, 400),
  EMAIL_EXISTS: () => apiError('EMAIL_EXISTS', 'Email already exists', 409),
  INVALID_CREDENTIALS: () => apiError('INVALID_CREDENTIALS', 'Invalid email or password', 401),
  INVALID_STATE_TRANSITION: (from: string, to: string) =>
    apiError('INVALID_STATE_TRANSITION', `Cannot transition from ${from} to ${to}`, 400),
}
