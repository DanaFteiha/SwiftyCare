export function getApiBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL
  if (typeof envBase === 'string' && envBase.trim()) {
    return envBase.replace(/\/+$/, '')
  }
  return ''
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}/api${normalizedPath}`
}

// Read the staff token lazily (avoid an import cycle at module-eval time).
function getStoredToken(): string | null {
  try {
    return localStorage.getItem('swiftycare:token')
  } catch {
    return null
  }
}

export async function apiFetch(input: string, init?: RequestInit, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  // Attach the staff bearer token by default. Callers may override by passing
  // their own Authorization header (e.g. patient flows use a case token).
  const headers = new Headers(init?.headers as HeadersInit | undefined)
  if (!headers.has('Authorization')) {
    const token = getStoredToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    return await fetch(apiUrl(input), { ...init, headers, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
