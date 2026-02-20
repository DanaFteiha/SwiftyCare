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

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(input), init)
}
