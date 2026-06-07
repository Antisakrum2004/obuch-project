const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 100,
  HR: 80,
  MANAGER: 60,
  MENTOR: 40,
  METHODOLOGIST: 30,
  EMPLOYEE: 20,
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export function canCreateUsers(role: string): boolean {
  return ['ADMIN', 'HR'].includes(role)
}

export function canManageJourneys(role: string): boolean {
  return ['ADMIN', 'HR'].includes(role)
}

export function canCompleteTasks(role: string): boolean {
  return ['EMPLOYEE', 'MENTOR', 'MANAGER', 'HR', 'ADMIN'].includes(role)
}

export function canViewAnalytics(role: string): boolean {
  return ['ADMIN', 'HR', 'MANAGER'].includes(role)
}

export function canViewAllJourneys(role: string): boolean {
  return ['ADMIN', 'HR', 'MANAGER'].includes(role)
}
