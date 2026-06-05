import { apiUrl } from './api'

// Client-side session helpers. The JWT is the source of truth for access — the
// React route guards below are UX only; the server enforces auth/RBAC on every
// request.

export type Role = 'admin' | 'doctor' | 'nurse' | 'intake'

const TOKEN_KEY = 'swiftycare:token'
const ROLE_KEY = 'swiftycare:role'
const NAME_KEY = 'swiftycare:displayName'
const PATIENT_CASE_TOKEN_PREFIX = 'swiftycare:caseToken:'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRole(): Role | null {
  const r = localStorage.getItem(ROLE_KEY)
  return r === 'admin' || r === 'doctor' || r === 'nurse' || r === 'intake' ? r : null
}

export function getDisplayName(): string | null {
  return localStorage.getItem(NAME_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function hasRole(...roles: Role[]): boolean {
  const r = getRole()
  return !!r && roles.includes(r)
}

export function setSession(token: string, role: Role, displayName: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.setItem(NAME_KEY, displayName)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(NAME_KEY)
}

export interface LoginResult {
  role: Role
  displayName: string
}

/** Authenticate with username + password; stores the session on success. */
export async function login(username: string, password: string): Promise<LoginResult> {
  const res = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    throw { status: res.status }
  }
  const data = await res.json()
  setSession(data.token, data.user.role, data.user.displayName)
  return { role: data.user.role, displayName: data.user.displayName }
}

// ─── Patient case tokens ─────────────────────────────────────────────────────
// Scoped to a single case's questionnaire. Kept in sessionStorage so they do
// not persist beyond the browsing session.

export function setPatientCaseToken(caseId: string, token: string) {
  sessionStorage.setItem(PATIENT_CASE_TOKEN_PREFIX + caseId, token)
}

export function getPatientCaseToken(caseId: string): string | null {
  return sessionStorage.getItem(PATIENT_CASE_TOKEN_PREFIX + caseId)
}
