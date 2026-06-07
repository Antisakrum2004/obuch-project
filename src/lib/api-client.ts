export async function apiClient(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ data: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()

  if (!res.ok) {
    throw { status: res.status, ...json }
  }

  return json
}
