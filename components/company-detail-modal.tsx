'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X, Building2, Mail, Phone, MapPin, User, Calendar, Loader2, Trash2,
  CreditCard, Hash, Pencil, Save, Briefcase, PhoneCall, Users as UsersIcon,
  MessageSquare, StickyNote, Check
} from 'lucide-react'
import { getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { logContact } from '@/lib/actions/activities'

export interface TagOption {
  key: string
  label: string
  bg: string
  text: string
  dot: string
}

export interface CompanyDetailModalProps {
  companyId: string
  onClose: () => void
  onChanged?: () => void
  accentColor?: 'green' | 'orange' | 'blue' | 'purple' | 'amber' | 'gray'
  defaultBadge?: { label: string; className: string }
  tagField?: string            // e.g. 'client_tag' | 'lead_tag'
  tagOptions?: TagOption[]
  allowEdit?: boolean
  allowDelete?: boolean
}

interface EditForm {
  name: string
  codigo_cliente: string
  street: string
  city: string
  postal_code: string
  province: string
  vat_number: string
  contacto: string
  phone: string
  telefono_2: string
  ultima_compra: string
  forma_pago: string
  email: string
  email_2: string
  email_3: string
  email_4: string
  email_5: string
  description: string
}

export const LIFECYCLE_STAGES: { value: string; label: string; color: string }[] = [
  { value: 'lead',     label: 'Cliente Potencial', color: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30' },
  { value: 'customer', label: 'Cliente',           color: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' },
]

const ACCENT: Record<string, { avatar: string; spinner: string; saveBtn: string; editBtn: string; ring: string }> = {
  green:  { avatar: 'from-green-500 to-emerald-600',   spinner: 'text-green-500',  saveBtn: 'bg-green-600 hover:bg-green-700',   editBtn: 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20',   ring: 'focus:ring-green-500' },
  orange: { avatar: 'from-orange-500 to-amber-600',    spinner: 'text-orange-500', saveBtn: 'bg-orange-600 hover:bg-orange-700', editBtn: 'border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20', ring: 'focus:ring-orange-500' },
  blue:   { avatar: 'from-blue-500 to-indigo-600',     spinner: 'text-blue-500',   saveBtn: 'bg-blue-600 hover:bg-blue-700',     editBtn: 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20',       ring: 'focus:ring-blue-500' },
  purple: { avatar: 'from-purple-500 to-fuchsia-600',  spinner: 'text-purple-500', saveBtn: 'bg-purple-600 hover:bg-purple-700', editBtn: 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20', ring: 'focus:ring-purple-500' },
  amber:  { avatar: 'from-amber-500 to-yellow-600',    spinner: 'text-amber-500',  saveBtn: 'bg-amber-600 hover:bg-amber-700',   editBtn: 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20',   ring: 'focus:ring-amber-500' },
  gray:   { avatar: 'from-gray-500 to-gray-700',       spinner: 'text-gray-500',   saveBtn: 'bg-gray-600 hover:bg-gray-700',     editBtn: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50',    ring: 'focus:ring-gray-500' },
}

export function CompanyDetailModal({
  companyId,
  onClose,
  onChanged,
  accentColor = 'blue',
  defaultBadge = { label: 'Empresa', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  tagField,
  tagOptions,
  allowEdit = true,
  allowDelete = true,
}: CompanyDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stageSaving, setStageSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [logging, setLogging] = useState<string | null>(null)
  const [logNote, setLogNote] = useState('')
  const [showLogNote, setShowLogNote] = useState(false)
  const [pendingType, setPendingType] = useState<'call' | 'meeting' | 'email' | 'note' | null>(null)
  const [justLogged, setJustLogged] = useState(false)

  const accent = ACCENT[accentColor]

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setDetailLoading(true)
      const { data } = await getCompany(companyId)
      if (!cancelled) {
        setDetailData(data)
        setDetailLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [companyId])

  const startEditing = (data: any) => {
    const cf = data.custom_fields || {}
    setEditForm({
      name: data.name || '',
      codigo_cliente: cf.codigo_cliente || '',
      street: data.billing_address?.street || '',
      city: data.billing_address?.city || '',
      postal_code: data.billing_address?.postal_code || '',
      province: data.billing_address?.state || '',
      vat_number: data.vat_number || '',
      contacto: cf.contacto || '',
      phone: data.phone || '',
      telefono_2: cf.telefono_2 || '',
      ultima_compra: cf.ultima_compra || '',
      forma_pago: cf.forma_pago || '',
      email: data.email || '',
      email_2: cf.email_2 || '',
      email_3: cf.email_3 || '',
      email_4: cf.email_4 || '',
      email_5: cf.email_5 || '',
      description: data.description || '',
    })
    setIsEditing(true)
  }

  const updateField = (field: keyof EditForm, value: string) => {
    if (!editForm) return
    setEditForm({ ...editForm, [field]: value })
  }

  const handleSave = async () => {
    if (!editForm || !detailData) return
    setSaving(true)
    const cf = { ...(detailData.custom_fields || {}) }
    cf.codigo_cliente = editForm.codigo_cliente || undefined
    cf.contacto = editForm.contacto || undefined
    cf.telefono_2 = editForm.telefono_2 || undefined
    cf.ultima_compra = editForm.ultima_compra || undefined
    cf.forma_pago = editForm.forma_pago || undefined
    cf.email_2 = editForm.email_2 || undefined
    cf.email_3 = editForm.email_3 || undefined
    cf.email_4 = editForm.email_4 || undefined
    cf.email_5 = editForm.email_5 || undefined
    for (const k of Object.keys(cf)) if (cf[k] === undefined) delete cf[k]

    await updateCompany(detailData.id, {
      name: editForm.name,
      vat_number: editForm.vat_number || undefined,
      phone: editForm.phone || undefined,
      email: editForm.email || undefined,
      description: editForm.description || undefined,
      billing_address: {
        street: editForm.street || undefined,
        city: editForm.city || undefined,
        postal_code: editForm.postal_code || undefined,
        state: editForm.province || undefined,
      },
      custom_fields: cf,
    })

    const { data } = await getCompany(detailData.id)
    setDetailData(data)
    setIsEditing(false)
    setEditForm(null)
    setSaving(false)
    onChanged?.()
  }

  const handleDelete = async () => {
    if (!detailData) return
    if (!confirm('¿Eliminar esta empresa?')) return
    setDeleting(true)
    await deleteCompany(detailData.id)
    onChanged?.()
    onClose()
  }

  const handleSetStage = async (newStage: string) => {
    if (!detailData) return
    setStageSaving(true)
    await updateCompany(detailData.id, { account_type: (newStage || undefined) as any })
    setDetailData({ ...detailData, account_type: newStage || null })
    setStageSaving(false)
    onChanged?.()
  }

  const handleSetStatus = async (newStatus: string) => {
    if (!detailData) return
    setStatusSaving(true)
    const cf = { ...(detailData.custom_fields || {}) }
    if (newStatus) cf.manual_status = newStatus
    else delete cf.manual_status
    await updateCompany(detailData.id, { custom_fields: cf })
    setDetailData({ ...detailData, custom_fields: cf })
    setStatusSaving(false)
    onChanged?.()
  }

  const doLog = async (type: 'call' | 'meeting' | 'email' | 'note', note?: string) => {
    if (!detailData) return
    setLogging(type)
    await logContact(detailData.workspace_id, {
      type,
      company_id: detailData.id,
      description: note || undefined,
    })
    setLogging(null)
    setShowLogNote(false)
    setLogNote('')
    setPendingType(null)
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 2000)
    onChanged?.()
  }

  const handleSetTag = async (newTag: string | null) => {
    if (!detailData || !tagField) return
    const cf = { ...(detailData.custom_fields || {}) }
    if (newTag) cf[tagField] = newTag
    else delete cf[tagField]
    await updateCompany(detailData.id, { custom_fields: cf })
    setDetailData({ ...detailData, custom_fields: cf })
    onChanged?.()
  }

  if (!mounted) return null

  const data = detailData
  const currentTag = data?.custom_fields?.[tagField || ''] as string | undefined
  const currentTagOption = tagOptions?.find(o => o.key === currentTag)

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg bg-gradient-to-br ${accent.avatar}`}>
                {data?.name?.[0] || '?'}
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-white text-xl">{data?.name || 'Cargando...'}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {currentTagOption ? (
                    <Badge className={`${currentTagOption.bg} ${currentTagOption.text} rounded-full text-xs`}>
                      {currentTagOption.label}
                    </Badge>
                  ) : (
                    <Badge className={`${defaultBadge.className} rounded-full text-xs`}>
                      {defaultBadge.label}
                    </Badge>
                  )}
                  {data?.vat_number && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">NIF: {data.vat_number}</span>
                  )}
                  {data?.custom_fields?.codigo_cliente && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Cód: #{data.custom_fields.codigo_cliente}</span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {tagOptions && tagField && data && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {tagOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSetTag(currentTag === opt.key ? null : opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    currentTag === opt.key
                      ? `${opt.bg} ${opt.text} border-current`
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {data && (
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Tipo:</span>
                <select
                  value={data.account_type || ''}
                  onChange={(e) => handleSetStage(e.target.value)}
                  disabled={stageSaving}
                  className="flex-1 h-8 text-sm rounded-lg bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">— Sin clasificar —</option>
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {stageSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
              </div>
              {data.account_type === 'customer' && (() => {
                const manual = data.custom_fields?.manual_status as string | undefined
                return (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 pl-7">Estado:</span>
                      <select
                        value={manual || ''}
                        onChange={(e) => handleSetStatus(e.target.value)}
                        disabled={statusSaving}
                        className="flex-1 h-8 text-sm rounded-lg bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="">Automático (según actividad)</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="closed">Cerrado</option>
                      </select>
                      {statusSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 pl-7">
                      {manual
                        ? 'Estado forzado manualmente. El sistema respetará este estado.'
                        : 'El sistema clasifica este cliente en Activos, Inactivos o Cerrados según su actividad reciente.'}
                    </p>
                  </div>
                )
              })()}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {detailLoading || !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`h-6 w-6 animate-spin ${accent.spinner}`} />
            </div>
          ) : (
            <>
              {/* Quick contact logging */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <PhoneCall className="h-3.5 w-3.5" /> Registrar contacto
                  </h3>
                  {justLogged && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                      <Check className="h-3.5 w-3.5" /> Registrado
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { type: 'call' as const,    label: 'Llamada',  Icon: PhoneCall },
                    { type: 'meeting' as const, label: 'Reunión',  Icon: UsersIcon },
                    { type: 'email' as const,   label: 'Email',    Icon: Mail },
                    { type: 'note' as const,    label: 'Nota',     Icon: StickyNote },
                  ]).map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      onClick={() => { setPendingType(type); setShowLogNote(true) }}
                      disabled={logging !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors disabled:opacity-50"
                    >
                      {logging === type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                      {label}
                    </button>
                  ))}
                </div>
                {showLogNote && pendingType && (
                  <div className="mt-3 flex gap-2 items-start">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Breve nota (opcional)..."
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') doLog(pendingType, logNote) }}
                      className="flex-1 h-8 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button size="sm" onClick={() => doLog(pendingType, logNote)} disabled={logging !== null} className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                      {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowLogNote(false); setLogNote(''); setPendingType(null) }} className="h-8">
                      Cancelar
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Un click queda registrado como contacto de hoy. El cliente vuelve automáticamente a "Activos".
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Información
                  </h3>
                  {allowEdit && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => startEditing(data)}
                      className="text-xs text-gray-400 hover:text-white">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    { icon: Building2, iconColor: 'text-green-500', label: 'Empresa', value: data.name, field: 'name' as keyof EditForm },
                    { icon: Hash, iconColor: 'text-gray-500', label: 'Código Cliente', value: data.custom_fields?.codigo_cliente, field: 'codigo_cliente' as keyof EditForm },
                    { icon: MapPin, iconColor: 'text-red-500', label: 'Dirección', value: data.billing_address?.street, field: 'street' as keyof EditForm },
                    { icon: MapPin, iconColor: 'text-orange-400', label: 'Población', value: data.billing_address?.city, field: 'city' as keyof EditForm },
                    { icon: MapPin, iconColor: 'text-blue-400', label: 'C.P.', value: data.billing_address?.postal_code, field: 'postal_code' as keyof EditForm },
                    { icon: MapPin, iconColor: 'text-indigo-400', label: 'Provincia', value: data.billing_address?.state, field: 'province' as keyof EditForm },
                    { icon: Building2, iconColor: 'text-purple-500', label: 'NIF/CIF', value: data.vat_number, field: 'vat_number' as keyof EditForm },
                    { icon: User, iconColor: 'text-cyan-500', label: 'Persona Contacto', value: data.custom_fields?.contacto, field: 'contacto' as keyof EditForm },
                    { icon: Phone, iconColor: 'text-green-500', label: 'Teléfono', value: data.phone, field: 'phone' as keyof EditForm },
                    { icon: Phone, iconColor: 'text-green-400', label: 'Móvil', value: data.custom_fields?.telefono_2, field: 'telefono_2' as keyof EditForm },
                    { icon: Calendar, iconColor: 'text-amber-500', label: 'Última Compra', value: data.custom_fields?.ultima_compra, field: 'ultima_compra' as keyof EditForm },
                    { icon: CreditCard, iconColor: 'text-indigo-500', label: 'Forma de Pago', value: data.custom_fields?.forma_pago, field: 'forma_pago' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-500', label: 'Email', value: data.email, field: 'email' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-400', label: 'Email 2', value: data.custom_fields?.email_2, field: 'email_2' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-300', label: 'Email 3', value: data.custom_fields?.email_3, field: 'email_3' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-300', label: 'Email 4', value: data.custom_fields?.email_4, field: 'email_4' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-200', label: 'Email 5', value: data.custom_fields?.email_5, field: 'email_5' as keyof EditForm },
                  ]).map((f) => (
                    <div key={f.field} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <f.icon className={`h-5 w-5 ${f.iconColor} mt-0.5 flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                        {isEditing && editForm ? (
                          <Input
                            value={editForm[f.field]}
                            onChange={(e) => updateField(f.field, e.target.value)}
                            className="mt-1 h-8 text-sm bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          />
                        ) : f.value ? (
                          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{f.value}</p>
                        ) : (
                          <p className="text-sm text-gray-400">—</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</h3>
                {isEditing && editForm ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className={`w-full text-sm rounded-xl p-3 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 ${accent.ring}`}
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 whitespace-pre-wrap">
                    {data.description || 'Sin notas'}
                  </p>
                )}
              </div>

              {data.custom_fields?.import_note && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nota de importación</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
                    {data.custom_fields.import_note}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving}
                      className={`rounded-xl text-white ${accent.saveBtn}`}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => { setIsEditing(false); setEditForm(null) }}
                      className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    {allowEdit && (
                      <Button variant="outline" onClick={() => startEditing(data)}
                        className={`rounded-xl ${accent.editBtn}`}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </Button>
                    )}
                    {allowDelete && (
                      <Button variant="outline" onClick={handleDelete} disabled={deleting}
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Eliminar
                      </Button>
                    )}
                    <Button variant="outline" onClick={onClose}
                      className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                      Cerrar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body
  )
}
