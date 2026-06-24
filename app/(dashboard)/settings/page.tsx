'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, CreditCard, Bell, Check, Loader2, Zap, Crown, Building2, X, Copy, Mail, UserMinus, Clock, Plug, Image as ImageIcon, Upload, Trash2 } from 'lucide-react'
import { ApiKeysSection } from '@/components/settings/api-keys-section'
import { WebhooksSection } from '@/components/settings/webhooks-section'
import { useWorkspace } from '@/lib/context/workspace-context'
import { updateWorkspaceName, updateWorkspaceSubtitle, setWorkspaceBrandingUrl, removeWorkspaceBranding, updateWorkspaceBackgroundColor } from '@/lib/actions/workspace'
import { createClient } from '@/lib/supabase/client'
import { getPlans, getWorkspaceUsage } from '@/lib/actions/plans'
import { useCachedData, invalidateCache } from '@/lib/hooks/use-cached-data'
import { toast } from 'sonner'

import type { Plan } from '@/lib/actions/plans'
import { getWorkspaceMembers, getWorkspaceInvitations, inviteUser, revokeInvitation, removeMember, updateMemberRole } from '@/lib/actions/invitations'
import type { Member, Invitation } from '@/lib/actions/invitations'

export default function SettingsPage() {
  const { workspaceId, workspaceName, userName, userEmail, userId, role, planId, plan, loading: wsLoading, logoUrl, backgroundUrl, appSubtitle, backgroundColor, refresh: refreshWorkspace } = useWorkspace()
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [subtitle, setSubtitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  // Cached data - loads instantly if cached, fetches in background
  const { data: plans, loading: plansLoading } = useCachedData<Plan[]>(
    'settings-plans',
    () => getPlans(),
    [],
    { staleTime: 60000 } // Plans rarely change, cache for 1 min
  )

  const { data: usage, loading: usageLoading } = useCachedData(
    `settings-usage-${workspaceId}`,
    () => getWorkspaceUsage(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const { data: members, loading: membersLoading, refetch: refetchMembers } = useCachedData<Member[]>(
    `settings-members-${workspaceId}`,
    () => getWorkspaceMembers(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const { data: invitations, loading: invitationsLoading, refetch: refetchInvitations } = useCachedData<Invitation[]>(
    `settings-invitations-${workspaceId}`,
    () => getWorkspaceInvitations(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  // Team modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState<{ token: string; email: string } | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  // Overall loading state - only block if NO cached data
  const loading = wsLoading || (plansLoading && !plans) || (membersLoading && !members)

  useEffect(() => {
    if (!wsLoading) {
      setSubtitle(appSubtitle || '')
    }
    if (!wsLoading && workspaceName) {
      setCompanyName(workspaceName)
    }
  }, [wsLoading, workspaceName, appSubtitle])

  const handleSaveWorkspace = async () => {
    if (!workspaceId || !companyName.trim()) return
    const r1 = await updateWorkspaceName(workspaceId, companyName.trim())
    const r2 = await updateWorkspaceSubtitle(workspaceId, subtitle.trim())
    if (!r1.error && !r2.error) {
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
      await refreshWorkspace()
    }
  }

  const handleBrandingUpload = async (kind: 'logo' | 'background', file: File) => {
    if (!workspaceId) return
    if (file.size > 3 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 3 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se aceptan imágenes')
      return
    }
    if (kind === 'logo') setUploadingLogo(true); else setUploadingBg(true)
    try {
      // Subir directo a Supabase Storage desde el cliente (evita límite de server actions)
      const supabase = createClient()
      const extByMime: Record<string, string> = {
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
        'image/webp': 'webp', 'image/svg+xml': 'svg',
      }
      const ext = extByMime[file.type] || 'png'
      const path = `${workspaceId}/${kind}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('workspace-branding')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) { toast.error(`Error subiendo: ${upErr.message}`); return }

      const { data: pub } = supabase.storage.from('workspace-branding').getPublicUrl(path)
      // Cache-busting con timestamp
      const url = `${pub.publicUrl}?v=${Date.now()}`

      const result = await setWorkspaceBrandingUrl(workspaceId, kind, url)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(kind === 'logo' ? 'Logo actualizado' : 'Fondo actualizado')
        await refreshWorkspace()
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || err}`)
    } finally {
      if (kind === 'logo') setUploadingLogo(false); else setUploadingBg(false)
    }
  }

  const handleBackgroundMode = async (mode: 'white' | 'black' | 'image' | 'default') => {
    if (!workspaceId) return
    const r = await updateWorkspaceBackgroundColor(workspaceId, mode)
    if (r.error) toast.error(r.error)
    else { toast.success('Fondo actualizado'); await refreshWorkspace() }
  }

  const handleBrandingRemove = async (kind: 'logo' | 'background') => {
    if (!workspaceId) return
    if (kind === 'logo') setUploadingLogo(true); else setUploadingBg(true)
    try {
      const result = await removeWorkspaceBranding(workspaceId, kind)
      if (result.error) toast.error(result.error)
      else { toast.success('Restaurado al original'); await refreshWorkspace() }
    } finally {
      if (kind === 'logo') setUploadingLogo(false); else setUploadingBg(false)
    }
  }

  const getUsagePercent = (current: number, max: number | null) => {
    if (max === null) return 0
    return Math.min(Math.round((current / max) * 100), 100)
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-amber-500'
    return 'bg-blue-500'
  }


  if (wsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Configuracion</h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">Gestiona tu workspace, equipo y plan</p>
      </div>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Building2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Espacio de Trabajo
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Informacion basica de tu espacio de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Nombre de la Empresa
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Aparece en el sidebar y en la cabecera de la app.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Subtítulo / Tagline
            </label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ej: CRM Platform · Ventas · Gestión Comercial"
              className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Línea pequeña debajo del nombre en el sidebar.</p>
          </div>
          <Button
            onClick={handleSaveWorkspace}
            className="rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {showSaveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Guardado!
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Personalización: logo + fondo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <ImageIcon className="h-5 w-5 text-pink-500 dark:text-pink-400" />
            Personalización
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Pon tu logo y tu imagen de fondo. Solo se aplica a tu workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-fit transition-colors disabled:opacity-50">
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBrandingUpload('logo', f); e.target.value = '' }}
                  />
                </label>
                {logoUrl && (
                  <button onClick={() => handleBrandingRemove('logo')} disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline w-fit">
                    <Trash2 className="h-3 w-3" /> Restaurar al original
                  </button>
                )}
                <p className="text-[11px] text-gray-500 dark:text-gray-400">PNG, JPG, WEBP o SVG. Máximo 3 MB. Cuadrado recomendado.</p>
              </div>
            </div>
          </div>

          {/* Modo de fondo */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Tipo de fondo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { key: 'default' as const, label: 'Predeterminado', preview: 'bg-gradient-to-br from-blue-500 to-indigo-700' },
                { key: 'image'   as const, label: 'Imagen propia',  preview: 'bg-gradient-to-br from-pink-500 to-orange-500' },
                { key: 'white'   as const, label: 'Blanco',         preview: 'bg-white border border-gray-300' },
                { key: 'black'   as const, label: 'Negro',          preview: 'bg-black' },
              ]).map(opt => {
                const isActive = (backgroundColor || 'default') === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleBackgroundMode(opt.key)}
                    className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg ${opt.preview}`} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
                    {isActive && <Check className="absolute top-1 right-1 h-3.5 w-3.5 text-blue-500" />}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Si eliges "Imagen propia", sube tu archivo abajo.</p>
          </div>

          {/* Fondo */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Imagen de fondo</label>
            <div className="space-y-2">
              <div className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden">
                {backgroundUrl ? (
                  <img src={backgroundUrl} alt="Fondo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Sin fondo personalizado (usa el predeterminado)</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors disabled:opacity-50">
                  {uploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {backgroundUrl ? 'Cambiar fondo' : 'Subir fondo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingBg}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBrandingUpload('background', f); e.target.value = '' }}
                  />
                </label>
                {backgroundUrl && (
                  <button onClick={() => handleBrandingRemove('background')} disabled={uploadingBg}
                    className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline">
                    <Trash2 className="h-3 w-3" /> Restaurar al original
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">PNG, JPG o WEBP. Máximo 3 MB. Recomendado horizontal (16:9 o similar).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            Equipo
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Gestiona usuarios y permisos
            {plan?.max_users && members && (
              <span className="ml-2 text-xs">({members.length} de {plan.max_users} usuarios)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Members list */}
            {(members || []).map((member) => {
              const isOwner = member.role === 'owner'
              const isCurrentUser = member.userId === userId
              const canRemove = ['owner', 'admin'].includes(role) && !isOwner && !isCurrentUser
              // Solo el owner puede cambiar roles. Y no puede cambiar su propio rol
              // (debe transferir propiedad para soltarlo).
              const canChangeRole = role === 'owner' && !isCurrentUser
              const roleLabel = member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Admin' : 'Miembro'
              const initials = member.fullName.split(' ').length >= 2
                ? `${member.fullName.split(' ')[0][0]}${member.fullName.split(' ')[1][0]}`.toUpperCase()
                : member.fullName.substring(0, 2).toUpperCase()

              return (
                <div key={member.userId} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {member.fullName}
                        {isCurrentUser && <span className="text-xs text-gray-400 ml-2">(tu)</span>}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.email} &bull; {roleLabel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canChangeRole ? (
                      <select
                        value={member.role}
                        onChange={async (e) => {
                          const newRole = e.target.value as 'owner' | 'admin' | 'member'
                          if (newRole === member.role) return
                          if (newRole === 'owner') {
                            const ok = confirm(
                              `¿Transferir la PROPIEDAD del workspace a ${member.fullName}?\n\n` +
                              `Tú pasarás a ser Admin. Solo ${member.fullName} podrá volver a transferirla.\n\n` +
                              `Esta acción es difícil de revertir.`,
                            )
                            if (!ok) { e.target.value = member.role; return }
                          }
                          const result = await updateMemberRole(workspaceId, member.userId, newRole)
                          if (result.error) {
                            toast.error(result.error)
                            e.target.value = member.role
                          } else {
                            toast.success(
                              newRole === 'owner'
                                ? `Propiedad transferida a ${member.fullName}`
                                : `Rol actualizado a ${newRole === 'admin' ? 'Admin' : 'Miembro'}`,
                            )
                            refetchMembers()
                            // Si fue transferencia, refrescar el contexto para que el usuario vea su nuevo rol
                            if (newRole === 'owner') await refreshWorkspace()
                          }
                        }}
                        className="text-xs rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                        title="Cambiar rol"
                      >
                        <option value="member">Miembro</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Propietario (transferir)</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className={`rounded-full ${
                        isOwner
                          ? 'dark:border-amber-500/30 dark:text-amber-400 border-amber-300 text-amber-600'
                          : member.role === 'admin'
                            ? 'dark:border-purple-500/30 dark:text-purple-400 border-purple-300 text-purple-600'
                            : 'dark:border-blue-500/30 dark:text-blue-400 border-blue-300 text-blue-600'
                      }`}>
                        {isOwner ? 'Propietario' : member.role === 'admin' ? 'Admin' : 'Miembro'}
                      </Badge>
                    )}
                    {canRemove && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Eliminar a ${member.fullName} del workspace?`)) return
                          const result = await removeMember(workspaceId, member.userId)
                          if (result.error) {
                            toast.error(result.error)
                          } else {
                            refetchMembers()
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar miembro"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pending invitations */}
            {invitations && invitations.length > 0 && (
              <>
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Invitaciones pendientes
                  </p>
                </div>
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">{inv.email}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expira {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                          {' '}&bull; {inv.role === 'admin' ? 'Admin' : 'Miembro'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full dark:border-yellow-500/30 dark:text-yellow-400 border-yellow-300 text-yellow-600 text-xs">
                        Pendiente
                      </Badge>
                      {['owner', 'admin'].includes(role) && (
                        <button
                          onClick={async () => {
                            const result = await revokeInvitation(inv.id)
                            if (result.error) {
                              toast.error(result.error)
                            } else {
                              refetchInvitations()
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Revocar invitacion"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Invite button */}
            {['owner', 'admin'].includes(role) && (
              <Button
                variant="outline"
                className="w-full rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
                onClick={() => {
                  if (plan?.max_users && (members?.length || 0) >= plan.max_users) {
                    toast.error(`Has alcanzado el límite de ${plan.max_users} usuarios en tu plan. Mejora tu plan para invitar más usuarios.`)
                  } else {
                    setInviteEmail('')
                    setInviteRole('member')
                    setInviteError('')
                    setInviteSuccess(null)
                    setShowInviteModal(true)
                  }
                }}
              >
                + Invitar Usuario
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invitar Usuario</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Invitacion enviada</p>
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-300">
                    Se ha creado una invitacion para <strong>{inviteSuccess.email}</strong>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Enlace de invitacion
                  </label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteSuccess.token}`}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
                    />
                    <Button
                      variant="outline"
                      className="rounded-xl dark:border-gray-700 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteSuccess!.token}`)
                        setCopiedToken(true)
                        setTimeout(() => setCopiedToken(false), 2000)
                      }}
                    >
                      {copiedToken ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Comparte este enlace con el usuario. La invitacion expira en 7 dias.
                  </p>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Rol
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setInviteRole('member')}
                      className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                        inviteRole === 'member'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">Miembro</div>
                      <div className="text-xs mt-1 opacity-70">Acceso basico al CRM</div>
                    </button>
                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                        inviteRole === 'admin'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">Admin</div>
                      <div className="text-xs mt-1 opacity-70">Gestion completa</div>
                    </button>
                  </div>
                </div>

                {inviteError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
                    {inviteError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl dark:border-gray-700 dark:text-gray-300"
                    onClick={() => setShowInviteModal(false)}
                    disabled={inviteLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    onClick={async () => {
                      setInviteLoading(true)
                      setInviteError('')
                      const result = await inviteUser(workspaceId, inviteEmail.trim(), inviteRole)
                      setInviteLoading(false)
                      if (result.error) {
                        setInviteError(result.error)
                      } else if (result.data) {
                        setInviteSuccess({ token: result.data.token, email: result.data.email })
                        // Refresh invitations list
                        refetchInvitations()
                      }
                    }}
                  >
                    {inviteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Enviar Invitacion
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Usage */}
      {usage && plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Settings className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Uso Actual
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Consumo de recursos en tu plan {plan.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Contactos', current: usage.contacts, max: plan.max_contacts },
                { label: 'Empresas', current: usage.companies, max: plan.max_companies },
                { label: 'Oportunidades', current: usage.deals, max: plan.max_deals },
                { label: 'Pipelines', current: usage.pipelines, max: plan.max_pipelines },
              ].map((item) => {
                const percent = item.max === null ? 0 : getUsagePercent(item.current, item.max)
                return (
                  <div key={item.label} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.current}{item.max !== null ? `/${item.max}` : ''}
                      </span>
                    </div>
                    {item.max !== null ? (
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getUsageColor(percent)}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400 font-medium">Ilimitado</div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <CreditCard className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            Plan y Facturacion
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Elige el plan que mejor se adapte a tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Anual
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">-17%</span>
            </button>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(plans || []).map((p) => {
              const isCurrent = p.id === planId
              const isPopular = p.id === 'pro'
              const price = billingPeriod === 'monthly' ? p.price_monthly : Math.round(p.price_yearly / 12 * 100) / 100

              return (
                <div
                  key={p.id}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                      : isPopular
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold">
                        Popular
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                        Plan Actual
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4 mt-2">
                    <div className="flex items-center justify-center mb-2">
                      {p.id === 'enterprise' ? (
                        <Crown className="h-6 w-6 text-amber-400" />
                      ) : p.id === 'pro' ? (
                        <Zap className="h-6 w-6 text-amber-400" />
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h3>
                    <div className="mt-2">
                      {price === 0 ? (
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">Gratis</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">{price}&euro;</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">/mes</span>
                        </>
                      )}
                    </div>
                    {billingPeriod === 'yearly' && price > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {p.price_yearly}&euro;/ano
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {p.max_users === null ? 'Usuarios ilimitados' : `${p.max_users} usuario${p.max_users > 1 ? 's' : ''}`}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {p.max_contacts === null ? 'Contactos ilimitados' : `${p.max_contacts} contactos`}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {p.max_companies === null ? 'Empresas ilimitadas' : `${p.max_companies} empresas`}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {p.max_deals === null ? 'Deals ilimitados' : `${p.max_deals} oportunidades`}
                    </div>
                    {p.features?.csv_import && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        Importacion CSV/Excel
                      </div>
                    )}
                    {p.features?.ai_assistant && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        Asistente IA
                      </div>
                    )}
                    {p.features?.whatsapp_integration && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        WhatsApp Integration
                      </div>
                    )}
                    {p.features?.api_access && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        Acceso API
                      </div>
                    )}
                    {p.features?.white_label && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        White Label
                      </div>
                    )}
                    {p.features?.priority_support && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        Soporte Prioritario
                      </div>
                    )}
                  </div>

                  <Button
                    className={`w-full rounded-xl text-sm ${
                      isCurrent
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 cursor-default hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'shadow-lg hover:shadow-xl transition-all'
                    }`}
                    disabled={isCurrent}
                    onClick={() => {
                      if (!isCurrent) {
                        window.open('mailto:comercial@ofimaticbaix.com?subject=Cambio de plan CRM&body=Hola, me gustaría cambiar al plan ' + p.name, '_blank')
                      }
                    }}
                  >
                    {isCurrent ? 'Plan Actual' : 'Contactar'}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Info about billing */}
          {planId && planId !== 'starter' && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Para cambios de plan o consultas sobre facturacion, contacta con <a href="mailto:comercial@ofimaticbaix.com" className="text-blue-600 dark:text-blue-400 hover:underline">comercial@ofimaticbaix.com</a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            Notificaciones
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Configura como quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Email notifications', desc: 'Recibe updates por email', key: 'email' },
              { label: 'Deal updates', desc: 'Notificaciones de cambios en deals', key: 'deals' },
              { label: 'Tareas vencidas', desc: 'Alerta cuando una tarea pasa su fecha limite', key: 'tasks' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded-lg border-2 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* API Keys / n8n Integration */}
      <ApiKeysSection workspaceId={workspaceId} />

      {/* Webhooks */}
      <WebhooksSection workspaceId={workspaceId} />
    </div>
  )
}
