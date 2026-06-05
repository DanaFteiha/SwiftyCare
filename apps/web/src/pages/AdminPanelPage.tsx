import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Shield,
  ArrowLeft,
  Plus,
  X,
  UserCheck,
  UserX,
  Trash2,
  KeyRound,
  ChevronUp,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { getDisplayName } from '@/lib/auth'

interface StaffUser {
  _id: string
  username: string
  displayName: string
  role: 'admin' | 'doctor' | 'nurse' | 'intake'
  active: boolean
  createdAt: string
}

const ROLE_LABELS: Record<StaffUser['role'], string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  intake: 'Intake',
}

const ROLE_COLORS: Record<StaffUser['role'], string> = {
  admin: 'bg-purple-100 text-purple-800',
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-emerald-100 text-emerald-800',
  intake: 'bg-amber-100 text-amber-800',
}

const EMPTY_ADD_FORM = { username: '', displayName: '', role: 'doctor' as StaffUser['role'], password: '' }

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { message?: string })?.message ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

function AdminPanelPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const myDisplayName = getDisplayName()

  // ─── Add-user form state ──────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)
  const [addError, setAddError] = useState('')

  // ─── Reset-password state: which row has the form open ───────────────────
  const [resetTarget, setResetTarget] = useState<{ id: string; password: string } | null>(null)
  const [resetError, setResetError] = useState('')

  // ─── Fetch users ──────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiJson<{ users: StaffUser[] }>('/users'),
  })
  const users: StaffUser[] = data?.users ?? []

  // ─── Create mutation ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: typeof addForm) =>
      apiJson<{ user: StaffUser }>('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setAddForm(EMPTY_ADD_FORM)
      setShowAdd(false)
      setAddError('')
    },
    onError: (err: Error) => setAddError(err.message),
  })

  // ─── Toggle active mutation ───────────────────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiJson<{ user: StaffUser }>(`/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: Error) => alert(err.message),
  })

  // ─── Reset password mutation ──────────────────────────────────────────────
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiJson<{ user: StaffUser }>(`/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setResetTarget(null)
      setResetError('')
    },
    onError: (err: Error) => setResetError(err.message),
  })

  // ─── Delete mutation ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiJson<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: Error) => alert(err.message),
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    createMutation.mutate(addForm)
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget) return
    setResetError('')
    resetPasswordMutation.mutate({ id: resetTarget.id, password: resetTarget.password })
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <Shield className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Staff Management</h1>
              <p className="text-xs text-gray-500">Logged in as {myDisplayName ?? 'Admin'}</p>
            </div>
          </div>

          <Button
            onClick={() => { setShowAdd(v => !v); setAddError('') }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-sm"
          >
            {showAdd ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Staff Member</>}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Add staff form */}
        {showAdd && (
          <Card className="border-purple-200 shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">New Staff Account</h2>
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Display name (e.g. Dr. Levi)"
                  value={addForm.displayName}
                  onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Username (e.g. dr.levi)"
                  value={addForm.username}
                  onChange={e => setAddForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                  autoComplete="off"
                  required
                />
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value as StaffUser['role'] }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="intake">Intake</option>
                  <option value="admin">Admin</option>
                </select>
                <Input
                  type="password"
                  placeholder="Temporary password (8+ chars)"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />

                {addError && (
                  <p className="sm:col-span-2 text-sm text-red-600">{addError}</p>
                )}

                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || !addForm.username || !addForm.displayName || !addForm.password}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Staff table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center text-red-600">
              Failed to load staff accounts.
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              No staff accounts yet. Add the first one above.
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-3 text-start font-medium text-gray-500 uppercase tracking-wide text-xs">Name</th>
                    <th className="px-5 py-3 text-start font-medium text-gray-500 uppercase tracking-wide text-xs hidden sm:table-cell">Username</th>
                    <th className="px-5 py-3 text-start font-medium text-gray-500 uppercase tracking-wide text-xs">Role</th>
                    <th className="px-5 py-3 text-start font-medium text-gray-500 uppercase tracking-wide text-xs">Status</th>
                    <th className="px-5 py-3 text-end font-medium text-gray-500 uppercase tracking-wide text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map(user => (
                    <>
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900">{user.displayName}</td>
                        <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{user.username}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 justify-end flex-wrap">
                            {/* Reset password toggle */}
                            <button
                              type="button"
                              title="Reset password"
                              onClick={() => {
                                setResetError('')
                                setResetTarget(rt =>
                                  rt?.id === user._id ? null : { id: user._id, password: '' }
                                )
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              {resetTarget?.id === user._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <KeyRound className="w-4 h-4" />
                              )}
                            </button>

                            {/* Activate / Deactivate */}
                            <button
                              type="button"
                              title={user.active ? 'Deactivate' : 'Activate'}
                              disabled={toggleActiveMutation.isPending}
                              onClick={() => toggleActiveMutation.mutate({ id: user._id, active: !user.active })}
                              className={`p-1.5 rounded transition-colors ${
                                user.active
                                  ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              title="Delete account"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Permanently delete "${user.displayName}"? This cannot be undone.`)) {
                                  deleteMutation.mutate(user._id)
                                }
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline reset-password row */}
                      {resetTarget?.id === user._id && (
                        <tr key={`${user._id}-reset`} className="bg-blue-50">
                          <td colSpan={5} className="px-5 py-3">
                            <form onSubmit={handleResetSubmit} className="flex items-center gap-3 flex-wrap">
                              <KeyRound className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="text-xs text-blue-700 font-medium shrink-0">New password for {user.displayName}:</span>
                              <Input
                                type="password"
                                placeholder="Min 8 characters"
                                value={resetTarget.password}
                                onChange={e => setResetTarget(rt => rt ? { ...rt, password: e.target.value } : null)}
                                autoComplete="new-password"
                                className="h-8 text-sm max-w-xs"
                                minLength={8}
                                required
                              />
                              {resetError && <span className="text-xs text-red-600">{resetError}</span>}
                              <Button
                                type="submit"
                                size="sm"
                                disabled={resetPasswordMutation.isPending || (resetTarget.password.length < 8)}
                                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                              >
                                {resetPasswordMutation.isPending ? 'Saving…' : 'Save'}
                              </Button>
                              <button
                                type="button"
                                onClick={() => { setResetTarget(null); setResetError('') }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </form>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Staff Management · SwiftyCare Admin
        </p>
      </div>
    </div>
  )
}

export default AdminPanelPage
