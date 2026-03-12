'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/admin'
import { Shield, Building2, Users, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  subscription_status: string
  subscription_tier: string | null
  plan_id: string | null
  trial_ends_at: string | null
  created_at: string
  owner_id: string
  users: { email: string; full_name: string | null } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Activo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  inactive: { label: 'Inactivo', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  trialing: { label: 'Prueba', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  expired: { label: 'Expirado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertTriangle },
}

const PLANS = [
  { id: 'starter', label: 'Starter', color: 'text-green-400' },
  { id: 'pro', label: 'Pro', color: 'text-blue-400' },
  { id: 'enterprise', label: 'Enterprise', color: 'text-purple-400' },
]

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Check admin access
  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isAdminEmail(user.email)) {
        router.push('/dashboard')
        return
      }
      setIsAdmin(true)
      loadWorkspaces()
    }
    checkAccess()
  }, [router])

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/admin/workspaces')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error cargando workspaces')
      }
      const { data } = await res.json()
      setWorkspaces(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateWorkspace(workspaceId: string, updates: Record<string, string>) {
    setUpdating(workspaceId)
    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...updates }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error actualizando')
      }
      // Reload data
      await loadWorkspaces()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  function toggleStatus(workspace: Workspace) {
    const newStatus = workspace.subscription_status === 'active' ? 'inactive' : 'active'
    updateWorkspace(workspace.id, { subscription_status: newStatus })
  }

  function changePlan(workspace: Workspace, planId: string) {
    updateWorkspace(workspace.id, { plan_id: planId, subscription_tier: planId })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function getTrialDaysLeft(trialEndsAt: string | null): number | null {
    if (!trialEndsAt) return null
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (!isAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administracion</h1>
            <p className="text-sm text-gray-400">Gestion de workspaces y suscripciones</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">{workspaces.length}</span>
            <span className="text-sm text-gray-400">workspaces</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">
              {workspaces.filter(w => w.subscription_status === 'active' || w.subscription_status === 'trialing').length}
            </span>
            <span className="text-sm text-gray-400">activos</span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-sm">
            Cerrar
          </button>
        </div>
      )}

      {/* Workspaces table */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Workspaces</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Propietario</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha Alta</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workspaces.map((ws) => {
                const statusCfg = STATUS_CONFIG[ws.subscription_status] || STATUS_CONFIG.inactive
                const StatusIcon = statusCfg.icon
                const trialDays = getTrialDaysLeft(ws.trial_ends_at)
                const isUpdating = updating === ws.id

                return (
                  <tr key={ws.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Empresa */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{ws.name}</p>
                          <p className="text-xs text-gray-500">{ws.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Propietario */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">{ws.users?.full_name || '-'}</p>
                      <p className="text-xs text-gray-500">{ws.users?.email || '-'}</p>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                        {ws.subscription_status === 'trialing' && trialDays !== null && (
                          <span className="text-xs text-amber-400/70">{trialDays}d</span>
                        )}
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium capitalize ${
                        ws.plan_id === 'enterprise' ? 'text-purple-400' :
                        ws.plan_id === 'pro' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {ws.plan_id || 'starter'}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{formatDate(ws.created_at)}</span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle status */}
                        <button
                          onClick={() => toggleStatus(ws)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                            ws.subscription_status === 'active'
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : ws.subscription_status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>

                        {/* Plan selector */}
                        <select
                          value={ws.plan_id || 'starter'}
                          onChange={(e) => changePlan(ws, e.target.value)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer appearance-none pr-6"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                        >
                          {PLANS.map(plan => (
                            <option key={plan.id} value={plan.id} className="bg-gray-900 text-gray-300">
                              {plan.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-white/5">
          {workspaces.map((ws) => {
            const statusCfg = STATUS_CONFIG[ws.subscription_status] || STATUS_CONFIG.inactive
            const StatusIcon = statusCfg.icon
            const trialDays = getTrialDaysLeft(ws.trial_ends_at)
            const isUpdating = updating === ws.id

            return (
              <div key={ws.id} className="p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{ws.name}</p>
                      <p className="text-xs text-gray-500">{ws.users?.email || '-'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Info row */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Plan: <span className={`font-medium capitalize ${
                    ws.plan_id === 'enterprise' ? 'text-purple-400' :
                    ws.plan_id === 'pro' ? 'text-blue-400' : 'text-green-400'
                  }`}>{ws.plan_id || 'starter'}</span></span>
                  <span>Alta: {formatDate(ws.created_at)}</span>
                  {ws.subscription_status === 'trialing' && trialDays !== null && (
                    <span className="text-amber-400">{trialDays}d trial</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(ws)}
                    disabled={isUpdating}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                      ws.subscription_status === 'active'
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    {isUpdating ? 'Actualizando...' : ws.subscription_status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                  <select
                    value={ws.plan_id || 'starter'}
                    onChange={(e) => changePlan(ws, e.target.value)}
                    disabled={isUpdating}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-300 disabled:opacity-50 cursor-pointer"
                  >
                    {PLANS.map(plan => (
                      <option key={plan.id} value={plan.id} className="bg-gray-900 text-gray-300">
                        {plan.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {workspaces.length === 0 && !loading && (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">No hay workspaces registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
