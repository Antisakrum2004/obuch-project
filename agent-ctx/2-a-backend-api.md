# Task 2-a: Backend Infrastructure & API Routes — Work Record

**Agent**: Backend Developer
**Date**: 2026-06-07
**Status**: ✅ COMPLETED

## Summary

Wrote all backend infrastructure and API routes for Journey OS. All files compile and pass lint checks with zero errors and zero warnings.

## Files Created

### Library Files (5)

1. **`/home/z/my-project/src/lib/auth.ts`** — JWT auth utilities
   - `signAccessToken()` — 15min expiry, includes userId + role
   - `signRefreshToken()` — 7d expiry, includes userId
   - `verifyToken()` — returns decoded payload
   - `getAuthUser()` — extracts Bearer token from Authorization header, verifies, returns { userId, role }
   - JWT_SECRET from env with fallback 'journey-os-jwt-secret-dev'

2. **`/home/z/my-project/src/lib/events.ts`** — EventEmitter2 singleton
   - Typed EventEmitter2 instance with wildcard support
   - All event type constants defined (user.created, journey.*, task.*, mentor.*, feedback.given)
   - `emitEvent(type, payload)` function that logs and emits

3. **`/home/z/my-project/src/lib/errors.ts`** — Unified API error responses
   - `apiError(code, message, status)` — returns NextResponse with { error: { code, message } }
   - `apiSuccess(data, status)` — returns NextResponse with { data }
   - Predefined errors: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, EMAIL_EXISTS, INVALID_CREDENTIALS, INVALID_STATE_TRANSITION

4. **`/home/z/my-project/src/lib/rbac.ts`** — Role-based access control
   - Role hierarchy: ADMIN(6) > HR(5) > MANAGER(4) > MENTOR(3) > METHODOLOGIST(2) > EMPLOYEE(1)
   - `hasPermission()`, `canCreateUsers()`, `canManageJourneys()`, `canCompleteTasks()`, `canViewAnalytics()`

5. **`/home/z/my-project/src/lib/journey-engine.ts`** — Journey state machine
   - Allowed transitions: DRAFT→ACTIVE, ACTIVE→{PAUSED,COMPLETED,CANCELLED}, PAUSED→{ACTIVE,CANCELLED}
   - `canTransition()`, `transitionJourney()` (validates, updates DB, emits event, creates JourneyEvent)
   - `calculateJourneyProgress()` — % of completed tasks across all stages
   - `checkStageCompletion()` — auto-completes stage when all tasks done
   - `checkJourneyCompletion()` — auto-completes journey when all stages done
   - `cascadeCompletionCheck()` — chains stage→journey completion checks

### API Routes (10 route files)

6. **`/api/auth/login`** — POST: email/password login, returns tokens + user DTO
7. **`/api/auth/refresh`** — POST: refresh token rotation
8. **`/api/users`** — GET (list with pagination, ADMIN/HR), POST (create user, ADMIN/HR)
9. **`/api/users/[id]`** — GET (any auth), PATCH (self or ADMIN/HR), DELETE (soft delete, ADMIN only)
10. **`/api/journeys`** — GET (list with filters, ADMIN/HR/MANAGER), POST (create with default stages, ADMIN/HR)
11. **`/api/journeys/[id]`** — GET (full detail with progress, EMPLOYEE sees only own)
12. **`/api/journeys/[id]/status`** — PATCH (state transition via journey-engine, ADMIN/HR)
13. **`/api/tasks`** — GET (list with filters), POST (create, ADMIN/HR)
14. **`/api/tasks/[id]`** — GET (with feedback), PATCH (self or ADMIN/HR)
15. **`/api/tasks/[id]/complete`** — POST (complete task + cascade stage/journey completion)
16. **`/api/me`** — GET (current user profile + active journey with progress)
17. **`/api/dashboard`** — GET (EMPLOYEE: personal stats; ADMIN/HR/MANAGER: overview stats)

## Validation

- `bun run lint` — 0 errors, 0 warnings
- Dev server compiles successfully
- All routes follow the specification with proper auth, RBAC, event emission, and error handling
- SQLite JSON fields handled with JSON.stringify/parse for metadata and payload
- Passwords excluded from all responses via destructuring
