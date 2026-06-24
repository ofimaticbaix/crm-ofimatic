'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X, Building2, Mail, Phone, MapPin, User, Calendar, Loader2, Trash2,
  CreditCard, Hash, Pencil, Save, Briefcase, PhoneCall, Users as UsersIcon,
  StickyNote, Check, Globe, Linkedin, DollarSign, FileText, History, AlertCircle,
  ChevronDown, Upload, Download, TrendingUp, Trophy, XCircle, Plus
} from 'lucide-react'
import { getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { logContact, getActivities } from '@/lib/actions/activities'
import { uploadPresupuesto, getPresupuestoUrl, replacePresupuestoAttachment, deletePresupuestoActivity, updatePresupuestoSentDate } from '@/lib/actions/documents'
import { createDeal, updateDealStage, deleteDeal } from '@/lib/actions/deals'
import { getPipeline } from '@/lib/actions/pipeline'
import { createClient } from '@/lib/supabase/client'
import { CompanyActivityWidget } from '@/components/company-activity-widget'
import { useWorkspace } from '@/lib/context/workspace-context'
import { invalidateAllDeals } from '@/lib/hooks/use-shared-data'
import { toast } from 'sonner'

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
  contacto_2: string
  contacto_3: string
  phone: string
  telefono_2: string
  telefono_3: string
  ultima_compra: string
  forma_pago: string
  dia_cobro: string
  email: string
  email_2: string
  email_3: string
  email_4: string
  email_5: string
  description: string
  industry: string
  company_size: string
  website: string
  linkedin_url: string
  annual_revenue: string
}

// Default list (for all standard SaaS workspaces).
export const FORMA_PAGO_OPTIONS_DEFAULT = [
  'Contado',
  'Contado antes entregar',
  'Transferencia 30 días',
  'Transferencia 60 días',
  'Transferencia 90 días',
  'Recibo 30 días',
  'Recibo 60 días',
  'Recibo 90 días',
  'Recibo domiciliado',
  'Giro bancario',
  'Confirming',
  'Pagaré',
  'Aplazado 60 días',
  'Tarjeta',
]

// Custom list requested by Ferran (Metalher) — only applies to his workspace.
export const FORMA_PAGO_OPTIONS_FERRAN = [
  'Transferencia anticipada',
  'Contado',
  'Recibo 30',
  'Recibo 60',
  'Recibo 90',
  'Transferencia 30',
  'Transferencia 60',
  'Transferencia 90',
  'Confirming 30',
  'Confirming 60',
  'Confirming 90',
  'Pagaré 30',
  'Pagaré 60',
  'Pagaré 90',
  'Tarjeta',
]

// Returns the correct forma_pago list for the given workspace context.
// Identifies Ferran's privileged account by email or workspace name.
export function getFormaPagoOptions(ctx: { userEmail?: string; workspaceName?: string }): string[] {
  const email = (ctx.userEmail || '').toLowerCase()
  const name = (ctx.workspaceName || '').toLowerCase()
  const isFerran =
    email === 'fpons@metalher.es' ||
    email.endsWith('@metalher.es') ||
    name.includes('metalher') ||
    name.includes('ofimatic')
  return isFerran ? FORMA_PAGO_OPTIONS_FERRAN : FORMA_PAGO_OPTIONS_DEFAULT
}

// Backwards-compat: keep the old name pointing to the default list. Anything
// importing FORMA_PAGO_OPTIONS without a workspace context will get the default.
export const FORMA_PAGO_OPTIONS = FORMA_PAGO_OPTIONS_DEFAULT

// Sentinel value used in the dropdown to enter a free-form custom payment method.
// When the stored `forma_pago` is not in the active list, treat it as custom.
export const FORMA_PAGO_CUSTOM_SENTINEL = '__custom__'

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
  const { userEmail, workspaceName } = useWorkspace()
  const formaPagoOptions = getFormaPagoOptions({ userEmail, workspaceName })
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
  const [pendingType, setPendingType] = useState<'call' | 'meeting' | 'email' | 'note' | 'presupuesto' | null>(null)
  const [justLogged, setJustLogged] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [descartadoReason, setDescartadoReason] = useState('')
  const [savingReason, setSavingReason] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [presupuestoDate, setPresupuestoDate] = useState('')
  const [presupuestosOpen, setPresupuestosOpen] = useState(false)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [deletingPresupuestoId, setDeletingPresupuestoId] = useState<string | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [editingDateValue, setEditingDateValue] = useState('')

  // ─── Oportunidades (embudo de ventas en la propia ficha) ────────────────
  const [oportunidadesOpen, setOportunidadesOpen] = useState(false)
  const [historialOportOpen, setHistorialOportOpen] = useState(false)
  const [companyDeals, setCompanyDeals] = useState<any[]>([])
  const [pipelineStages, setPipelineStages] = useState<any[]>([])
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [showNewDealForm, setShowNewDealForm] = useState(false)
  const [newDealName, setNewDealName] = useState('')
  const [newDealValue, setNewDealValue] = useState('')
  const [newDealStageId, setNewDealStageId] = useState<string>('')
  const [savingNewDeal, setSavingNewDeal] = useState(false)
  const [pendingDealAction, setPendingDealAction] = useState<string | null>(null)

  const accent = ACCENT[accentColor]

  useEffect(() => { setMounted(true) }, [])

  const loadHistory = async (wsId: string, compId: string) => {
    setHistoryLoading(true)
    const { data } = await getActivities(wsId, { companyId: compId })
    // Sort by most recent: completed_at if completed, otherwise created_at
    const sorted = (data || []).slice().sort((a: any, b: any) => {
      const ta = new Date(a.completed_at || a.created_at).getTime()
      const tb = new Date(b.completed_at || b.created_at).getTime()
      return tb - ta
    })
    setHistory(sorted)
    setHistoryLoading(false)
  }

  // Carga las oportunidades (deals) de esta empresa con su etapa actual.
  const loadCompanyDeals = async (compId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deals')
      .select('id, name, value, status, stage_id, created_at, stages(id, name, position, is_closed_won, is_closed_lost, probability)')
      .eq('company_id', compId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setCompanyDeals(data || [])
  }

  // Carga el pipeline por defecto (con sus stages ordenadas) — necesario para
  // poder crear nuevas oportunidades y mover entre etapas.
  const loadPipelineStages = async (wsId: string) => {
    const { data } = await getPipeline(wsId)
    if (data) {
      setPipelineId(data.id)
      setPipelineStages(data.stages || [])
    }
  }

  // Crea una nueva oportunidad asociada a esta empresa, en la etapa elegida
  // por el usuario (por defecto, la primera del pipeline).
  const handleCreateNewDeal = async () => {
    if (!detailData?.workspace_id || !pipelineId || !pipelineStages.length) {
      toast.error('No hay un embudo configurado en este workspace')
      return
    }
    if (!newDealName.trim()) return
    setSavingNewDeal(true)
    const stageId = newDealStageId || pipelineStages[0].id
    const valueNum = newDealValue ? Number(newDealValue.replace(/[^\d.]/g, '')) : undefined
    const r = await createDeal(detailData.workspace_id, {
      name: newDealName.trim(),
      pipeline_id: pipelineId,
      stage_id: stageId,
      value: valueNum,
      company_id: detailData.id,
    })
    setSavingNewDeal(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success('Oportunidad creada')
    setNewDealName('')
    setNewDealValue('')
    setNewDealStageId('')
    setShowNewDealForm(false)
    await loadCompanyDeals(detailData.id)
    invalidateAllDeals(detailData.workspace_id)
  }

  // Mueve la oportunidad a otra etapa. Si es ganado/perdido, busca la stage
  // correspondiente con flag is_closed_won / is_closed_lost.
  const handleChangeStage = async (dealId: string, newStageId: string) => {
    setPendingDealAction(dealId)
    const r = await updateDealStage(dealId, newStageId)
    setPendingDealAction(null)
    if (r.error) { toast.error(r.error); return }
    await loadCompanyDeals(detailData.id)
    invalidateAllDeals(detailData.workspace_id)
  }

  const handleMarkWon = async (dealId: string) => {
    const wonStage = pipelineStages.find(s => s.is_closed_won)
    if (!wonStage) { toast.error('No hay etapa de "Ganado" configurada'); return }
    setPendingDealAction(dealId)
    const r = await updateDealStage(dealId, wonStage.id)
    setPendingDealAction(null)
    if (r.error) { toast.error(r.error); return }
    toast.success('Marcada como ganada 🎉')
    await loadCompanyDeals(detailData.id)
    invalidateAllDeals(detailData.workspace_id)
  }

  const handleMarkLost = async (dealId: string) => {
    const lostStage = pipelineStages.find(s => s.is_closed_lost)
    if (!lostStage) { toast.error('No hay etapa de "Perdido" configurada'); return }
    setPendingDealAction(dealId)
    const r = await updateDealStage(dealId, lostStage.id)
    setPendingDealAction(null)
    if (r.error) { toast.error(r.error); return }
    toast.success('Marcada como perdida')
    await loadCompanyDeals(detailData.id)
    invalidateAllDeals(detailData.workspace_id)
  }

  const handleDeleteDeal = async (dealId: string, dealName: string) => {
    if (!confirm(`¿Eliminar la oportunidad "${dealName}"?`)) return
    setPendingDealAction(dealId)
    const r = await deleteDeal(dealId)
    setPendingDealAction(null)
    if (r.error) { toast.error(r.error); return }
    toast.success('Oportunidad eliminada')
    await loadCompanyDeals(detailData.id)
    invalidateAllDeals(detailData.workspace_id)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setDetailLoading(true)
      const { data } = await getCompany(companyId)
      if (!cancelled) {
        setDetailData(data)
        setDetailLoading(false)
        setDescartadoReason(data?.custom_fields?.descartado_reason || '')
        if (data?.workspace_id && data?.id) {
          loadHistory(data.workspace_id, data.id)
          loadCompanyDeals(data.id)
          loadPipelineStages(data.workspace_id)
        }
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
      contacto_2: cf.contacto_2 || '',
      contacto_3: cf.contacto_3 || '',
      phone: data.phone || '',
      telefono_2: cf.telefono_2 || '',
      telefono_3: cf.telefono_3 || '',
      ultima_compra: cf.ultima_compra || '',
      forma_pago: cf.forma_pago || '',
      dia_cobro: cf.dia_cobro || '',
      email: data.email || '',
      email_2: cf.email_2 || '',
      email_3: cf.email_3 || '',
      email_4: cf.email_4 || '',
      email_5: cf.email_5 || '',
      description: data.description || '',
      industry: data.industry || '',
      company_size: data.company_size || '',
      website: data.website || '',
      linkedin_url: data.linkedin_url || '',
      annual_revenue: data.annual_revenue != null ? String(data.annual_revenue) : '',
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
    cf.contacto_2 = editForm.contacto_2 || undefined
    cf.contacto_3 = editForm.contacto_3 || undefined
    cf.telefono_2 = editForm.telefono_2 || undefined
    cf.telefono_3 = editForm.telefono_3 || undefined
    cf.ultima_compra = editForm.ultima_compra || undefined
    cf.forma_pago = editForm.forma_pago || undefined
    cf.dia_cobro = editForm.dia_cobro || undefined
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
      industry: editForm.industry || undefined,
      company_size: editForm.company_size || undefined,
      website: editForm.website || undefined,
      linkedin_url: editForm.linkedin_url || undefined,
      annual_revenue: editForm.annual_revenue ? parseFloat(editForm.annual_revenue) : undefined,
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

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const doLog = async (type: 'call' | 'meeting' | 'email' | 'note' | 'presupuesto', note?: string) => {
    if (!detailData) return
    setLogging(type)
    let metadata: Record<string, any> | undefined = undefined
    try {
      if (type === 'presupuesto' && selectedFile) {
        setUploadingFile(true)
        const base64 = await fileToBase64(selectedFile)
        const up = await uploadPresupuesto(detailData.workspace_id, detailData.id, {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          base64,
        })
        setUploadingFile(false)
        if (up.error || !up.data) {
          setLogging(null)
          alert(up.error || 'No se pudo subir el archivo')
          return
        }
        metadata = { attachment: up.data }
      }
      // Store the sent date for presupuestos
      if (type === 'presupuesto' && presupuestoDate) {
        metadata = { ...(metadata || {}), sent_at: presupuestoDate }
      }
      const newActivity = await logContact(detailData.workspace_id, {
        type,
        company_id: detailData.id,
        description: note || undefined,
        metadata,
      })
      // If the user picked a specific sent date, also align completed_at to that date
      if (type === 'presupuesto' && presupuestoDate && newActivity.data?.id) {
        await updatePresupuestoSentDate(newActivity.data.id, presupuestoDate)
      }
    } finally {
      setUploadingFile(false)
    }
    setLogging(null)
    setShowLogNote(false)
    setLogNote('')
    setPendingType(null)
    setSelectedFile(null)
    setPresupuestoDate('')
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 2000)
    // Refresh contact history right after logging so the user sees it immediately
    loadHistory(detailData.workspace_id, detailData.id)
    onChanged?.()
  }

  const downloadAttachment = async (path: string) => {
    const { url, error } = await getPresupuestoUrl(path)
    if (error || !url) {
      alert(error || 'No se pudo generar el enlace')
      return
    }
    window.open(url, '_blank')
  }

  const handleReplaceFile = async (activityId: string, file: File) => {
    if (!detailData) return
    setReplacingId(activityId)
    try {
      const base64 = await fileToBase64(file)
      const res = await replacePresupuestoAttachment(activityId, detailData.workspace_id, detailData.id, {
        name: file.name, type: file.type, size: file.size, base64,
      })
      if (res.error) {
        alert(res.error)
        return
      }
      await loadHistory(detailData.workspace_id, detailData.id)
    } finally {
      setReplacingId(null)
    }
  }

  const handleDeletePresupuesto = async (activityId: string) => {
    if (!detailData) return
    if (!confirm('¿Eliminar este presupuesto? Se borrará también el archivo adjunto.')) return
    setDeletingPresupuestoId(activityId)
    const res = await deletePresupuestoActivity(activityId)
    setDeletingPresupuestoId(null)
    if (res.error) {
      alert(res.error)
      return
    }
    await loadHistory(detailData.workspace_id, detailData.id)
  }

  const handleChangeSentDate = async (activityId: string, newDate: string) => {
    if (!detailData || !newDate) return
    const res = await updatePresupuestoSentDate(activityId, newDate)
    if (res.error) { alert(res.error); return }
    setEditingDateId(null)
    setEditingDateValue('')
    await loadHistory(detailData.workspace_id, detailData.id)
  }

  const handleSetTag = async (newTag: string | null) => {
    if (!detailData || !tagField) return
    const cf = { ...(detailData.custom_fields || {}) }
    if (newTag) cf[tagField] = newTag
    else delete cf[tagField]
    // When the tag changes away from "descartado", clear the reason so it doesn't linger
    if (newTag !== 'descartado') {
      delete cf.descartado_reason
      setDescartadoReason('')
    }
    await updateCompany(detailData.id, { custom_fields: cf })
    setDetailData({ ...detailData, custom_fields: cf })
    onChanged?.()
  }

  const saveDescartadoReason = async () => {
    if (!detailData) return
    const current = detailData.custom_fields?.descartado_reason || ''
    if (descartadoReason === current) return
    setSavingReason(true)
    const cf = { ...(detailData.custom_fields || {}) }
    if (descartadoReason.trim()) cf.descartado_reason = descartadoReason.trim()
    else delete cf.descartado_reason
    await updateCompany(detailData.id, { custom_fields: cf })
    setDetailData({ ...detailData, custom_fields: cf })
    setSavingReason(false)
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
                {isEditing && editForm ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-xl font-semibold w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la empresa"
                  />
                ) : (
                  <CardTitle className="text-gray-900 dark:text-white text-xl">{data?.name || 'Cargando...'}</CardTitle>
                )}
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
                      </select>
                      {statusSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 pl-7">
                      {manual
                        ? 'Estado forzado manualmente. El sistema respetará este estado.'
                        : 'El sistema clasifica este cliente en Activos o Inactivos según su actividad reciente.'}
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
                    { type: 'call' as const,        label: 'Llamada',    Icon: PhoneCall },
                    { type: 'meeting' as const,     label: 'Reunión',    Icon: UsersIcon },
                    { type: 'email' as const,       label: 'Email',      Icon: Mail },
                    { type: 'note' as const,        label: 'Nota',       Icon: StickyNote },
                    { type: 'presupuesto' as const, label: 'Presupuesto', Icon: FileText },
                  ]).map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      onClick={() => {
                        setPendingType(type)
                        setShowLogNote(true)
                        if (type === 'presupuesto') {
                          setPresupuestoDate(new Date().toISOString().slice(0, 10))
                        }
                      }}
                      disabled={logging !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors disabled:opacity-50"
                    >
                      {logging === type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                      {label}
                    </button>
                  ))}
                </div>
                {showLogNote && pendingType && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <input
                        type="text"
                        autoFocus
                        placeholder={pendingType === 'presupuesto' ? 'Ej: Presupuesto obra baranda (opcional)' : 'Breve nota (opcional)...'}
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && pendingType !== 'presupuesto') doLog(pendingType, logNote) }}
                        className="flex-1 h-8 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button size="sm" onClick={() => doLog(pendingType, logNote)} disabled={logging !== null || uploadingFile} className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                        {logging || uploadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setShowLogNote(false); setLogNote(''); setPendingType(null); setSelectedFile(null) }} className="h-8">
                        Cancelar
                      </Button>
                    </div>
                    {pendingType === 'presupuesto' && (
                      <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Fecha de envío:</span>
                          <input
                            type="date"
                            value={presupuestoDate}
                            onChange={(e) => setPresupuestoDate(e.target.value)}
                            className="h-7 text-xs rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer">
                          <FileText className="h-3.5 w-3.5" />
                          {selectedFile ? selectedFile.name : 'Adjuntar presupuesto (PDF, Word, Excel, imagen)'}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          {selectedFile && (
                            <button type="button" onClick={(e) => { e.preventDefault(); setSelectedFile(null) }} className="ml-auto text-gray-400 hover:text-red-500">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </label>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Máx. 20 MB. El archivo queda asociado a esta empresa.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Un click queda registrado como contacto de hoy. El cliente vuelve automáticamente a "Activos".
                </p>
              </div>

              {/* Widget de actividad: última y próxima acción */}
              {data?.workspace_id && data?.id && (
                <CompanyActivityWidget workspaceId={data.workspace_id} companyId={data.id} accentColor={accentColor as any} />
              )}

              {/* Motivo de Descarte — sólo si el tag actual es "descartado" */}
              {tagField && currentTag === 'descartado' && (
                <div className="rounded-xl border-2 border-gray-400/40 dark:border-gray-600/50 bg-gray-500/5 dark:bg-gray-800/30 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    Motivo de Descarte
                    {savingReason && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 ml-auto" />}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                    Explica brevemente por qué este cliente ha sido descartado. Se guarda automáticamente al salir del campo.
                  </p>
                  <textarea
                    value={descartadoReason}
                    onChange={(e) => setDescartadoReason(e.target.value)}
                    onBlur={saveDescartadoReason}
                    rows={3}
                    placeholder="Ej: No tiene presupuesto, no encaja con nuestra oferta, compite con proveedor existente, impago anterior..."
                    className="w-full text-sm rounded-lg bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              )}

              {/* Historial de Contacto */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/40 p-4">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="h-3.5 w-3.5" /> Historial de Contacto
                  <span className="ml-auto text-[10px] font-normal text-gray-400">
                    {history.length === 0 ? 'sin contactos' : `${history.length} ${history.length === 1 ? 'contacto' : 'contactos'}`}
                  </span>
                </h3>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className={`h-4 w-4 animate-spin ${accent.spinner}`} />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Todavía no has registrado ningún contacto con este cliente.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {(showAllHistory ? history : history.slice(0, 5)).map((act) => {
                        const meta: Record<string, { icon: any; label: string; color: string; bg: string }> = {
                          call:        { icon: PhoneCall,   label: 'Llamada',     color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20' },
                          meeting:     { icon: UsersIcon,   label: 'Reunión',     color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                          email:       { icon: Mail,        label: 'Email',       color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
                          note:        { icon: StickyNote,  label: 'Nota',        color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
                          presupuesto: { icon: FileText,    label: 'Presupuesto', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        }
                        const m = meta[act.type] || meta.note
                        const when = act.completed_at || act.scheduled_at || act.due_date || act.created_at
                        const dateStr = new Date(when).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                        const timeStr = act.scheduled_at ? ` · ${new Date(act.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''
                        const Icon = m.icon
                        const statusChip = act.is_completed
                          ? { label: 'Hecho', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
                          : { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
                        return (
                          <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50/50 dark:bg-gray-800/40">
                            <div className={`${m.bg} ${m.color} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusChip.cls}`}>{statusChip.label}</span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">· {dateStr}{timeStr}</span>
                              </div>
                              {act.subject && act.subject !== m.label && (
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{act.subject}</p>
                              )}
                              {act.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 break-words">{act.description}</p>
                              )}
                              {act.metadata?.attachment?.path && (
                                <button
                                  onClick={() => downloadAttachment(act.metadata.attachment.path)}
                                  className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                >
                                  <FileText className="h-3 w-3" />
                                  {act.metadata.attachment.name || 'Descargar archivo'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {history.length > 5 && (
                      <button
                        onClick={() => setShowAllHistory(v => !v)}
                        className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showAllHistory ? 'Mostrar menos' : `Ver los ${history.length - 5} restantes`}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Historial de Presupuestos — desplegable */}
              {(() => {
                const presupuestos = history
                  .filter(a => a.type === 'presupuesto')
                  .sort((a: any, b: any) => {
                    const ta = new Date(a.completed_at || a.created_at).getTime()
                    const tb = new Date(b.completed_at || b.created_at).getTime()
                    return tb - ta
                  })
                if (presupuestos.length === 0) return null
                const formatSize = (bytes: number) => {
                  if (!bytes) return ''
                  if (bytes < 1024) return `${bytes} B`
                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
                }
                return (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/10">
                    <button
                      onClick={() => setPresupuestosOpen(v => !v)}
                      className="w-full flex items-center gap-2 p-4 text-left"
                    >
                      <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Presupuestos</span>
                      <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                        {presupuestos.length}
                      </span>
                      <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform ${presupuestosOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {presupuestosOpen && (
                      <div className="px-4 pb-4 space-y-2">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                          Ordenados del más reciente al más antiguo. Puedes reemplazar el archivo o eliminar cualquier presupuesto.
                        </p>
                        {presupuestos.map((p) => {
                          const sentIso = p.metadata?.sent_at || (p.completed_at ? p.completed_at.slice(0, 10) : null)
                          const sentStr = sentIso ? new Date(sentIso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                          const att = p.metadata?.attachment
                          const isReplacing = replacingId === p.id
                          const isDeleting = deletingPresupuestoId === p.id
                          const isEditingDate = editingDateId === p.id
                          return (
                            <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 hover:shadow-sm transition-shadow">
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {p.subject || 'Presupuesto'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isEditingDate ? (
                                    <>
                                      <input
                                        type="date"
                                        value={editingDateValue}
                                        onChange={(e) => setEditingDateValue(e.target.value)}
                                        className="h-6 text-[11px] rounded bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-700 text-gray-900 dark:text-white px-1.5"
                                      />
                                      <button
                                        onClick={() => handleChangeSentDate(p.id, editingDateValue)}
                                        className="text-[11px] text-green-600 dark:text-green-400 hover:underline font-medium"
                                      >Guardar</button>
                                      <button
                                        onClick={() => { setEditingDateId(null); setEditingDateValue('') }}
                                        className="text-[11px] text-gray-500 hover:underline"
                                      >Cancelar</button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingDateId(p.id)
                                        setEditingDateValue(sentIso || new Date().toISOString().slice(0, 10))
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                                      title="Cambiar fecha de envío"
                                    >
                                      <Calendar className="h-3 w-3" />
                                      <span>Enviado el <span className="font-medium text-gray-800 dark:text-gray-200">{sentStr}</span></span>
                                      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  )}
                                </div>
                                {p.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">{p.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {att?.path ? (
                                    <button
                                      onClick={() => downloadAttachment(att.path)}
                                      className="inline-flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-md font-medium transition-colors"
                                      title="Descargar archivo"
                                    >
                                      <Download className="h-3 w-3" />
                                      <span className="max-w-[200px] truncate">{att.name || 'Descargar'}</span>
                                      {att.size && <span className="text-gray-400 font-normal">· {formatSize(att.size)}</span>}
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-gray-400 italic">Sin archivo adjunto</span>
                                  )}
                                  <label className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${isReplacing ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    {isReplacing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                    {att ? 'Reemplazar' : 'Subir archivo'}
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                      disabled={isReplacing}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) handleReplaceFile(p.id, f)
                                        e.currentTarget.value = ''
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    onClick={() => handleDeletePresupuesto(p.id)}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                    title="Eliminar presupuesto"
                                  >
                                    {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Oportunidades — embudo de ventas inline */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/10">
                <button
                  onClick={() => setOportunidadesOpen(v => !v)}
                  className="w-full flex items-center gap-2 p-4 text-left"
                >
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Oportunidades
                  </span>
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                    {companyDeals.length}
                  </span>
                  <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform ${oportunidadesOpen ? 'rotate-180' : ''}`} />
                </button>

                {oportunidadesOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      Crea y gestiona oportunidades del embudo de ventas para esta empresa sin salir de la ficha.
                    </p>

                    {/* Listado */}
                    {companyDeals.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                        Sin oportunidades. Crea la primera con el botón de abajo.
                      </div>
                    ) : (
                      companyDeals.map((d) => {
                        const stage = d.stages
                        const isWon = !!stage?.is_closed_won
                        const isLost = !!stage?.is_closed_lost
                        const isClosed = isWon || isLost
                        const pending = pendingDealAction === d.id
                        const valueFmt = d.value != null ? `${Number(d.value).toLocaleString('es-ES')} €` : '— €'
                        return (
                          <div key={d.id} className={`p-3 rounded-lg border transition-colors ${
                            isWon
                              ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50'
                              : isLost
                                ? 'bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                                : 'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700/40'
                          }`}>
                            <div className="flex items-start gap-3 flex-wrap">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isWon
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                  : isLost
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                              }`}>
                                {isWon ? <Trophy className="h-4 w-4" /> : isLost ? <XCircle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {d.name}
                                  </span>
                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    {valueFmt}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <select
                                    value={d.stage_id}
                                    onChange={(e) => handleChangeStage(d.id, e.target.value)}
                                    disabled={pending}
                                    className="text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                                  >
                                    {pipelineStages.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleMarkWon(d.id)}
                                    disabled={pending || isWon}
                                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                                      isWon
                                        ? 'bg-emerald-200 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 cursor-default'
                                        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50'
                                    }`}
                                    title="Marcar como ganada"
                                  >
                                    <Trophy className="h-3 w-3" />
                                    {isWon ? 'Ganada' : 'Ganar'}
                                  </button>
                                  <button
                                    onClick={() => handleMarkLost(d.id)}
                                    disabled={pending || isLost}
                                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                                      isLost
                                        ? 'bg-red-200 dark:bg-red-800/60 text-red-800 dark:text-red-200 cursor-default'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50'
                                    }`}
                                    title="Marcar como perdida"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    {isLost ? 'Perdida' : 'Perder'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeal(d.id, d.name)}
                                    disabled={pending}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 ml-auto"
                                    title="Eliminar oportunidad"
                                  >
                                    {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}

                    {/* Form de creación */}
                    {showNewDealForm ? (
                      <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-700/50 bg-white dark:bg-gray-900/40 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
                          <input
                            type="text"
                            placeholder="Título de la oportunidad"
                            value={newDealName}
                            onChange={(e) => setNewDealName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && newDealName.trim()) handleCreateNewDeal() }}
                            autoFocus
                            className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Valor estimado €"
                            value={newDealValue}
                            onChange={(e) => setNewDealValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && newDealName.trim()) handleCreateNewDeal() }}
                            className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            Etapa inicial del embudo
                          </label>
                          <select
                            value={newDealStageId || pipelineStages[0]?.id || ''}
                            onChange={(e) => setNewDealStageId(e.target.value)}
                            className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          >
                            {pipelineStages.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}{s.is_closed_won ? ' (Ganado)' : s.is_closed_lost ? ' (Perdido)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCreateNewDeal}
                            disabled={savingNewDeal || !newDealName.trim()}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50"
                          >
                            {savingNewDeal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Crear oportunidad
                          </button>
                          <button
                            onClick={() => { setShowNewDealForm(false); setNewDealName(''); setNewDealValue(''); setNewDealStageId('') }}
                            disabled={savingNewDeal}
                            className="text-xs px-3 py-1.5 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setShowNewDealForm(true); setNewDealStageId(pipelineStages[0]?.id || '') }}
                        disabled={!pipelineStages.length}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nueva oportunidad
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Historial de Oportunidades — resumen breve, solo lectura */}
              {(() => {
                const total = companyDeals.length
                if (total === 0) return null
                const won = companyDeals.filter(d => d.stages?.is_closed_won)
                const lost = companyDeals.filter(d => d.stages?.is_closed_lost)
                const open = companyDeals.filter(d => !d.stages?.is_closed_won && !d.stages?.is_closed_lost)
                const sumValue = (arr: any[]) => arr.reduce((acc, d) => acc + (Number(d.value) || 0), 0)
                const fmt = (n: number) => `${n.toLocaleString('es-ES')} €`
                const wonValue = sumValue(won)
                const lostValue = sumValue(lost)
                const openValue = sumValue(open)
                const closedTotal = won.length + lost.length
                const winRate = closedTotal > 0 ? Math.round((won.length / closedTotal) * 100) : null
                const sorted = [...companyDeals].sort((a, b) => {
                  const ta = new Date(a.created_at).getTime()
                  const tb = new Date(b.created_at).getTime()
                  return tb - ta
                })

                return (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/10">
                    <button
                      onClick={() => setHistorialOportOpen(v => !v)}
                      className="w-full flex items-center gap-2 p-4 text-left"
                    >
                      <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        Historial de Oportunidades
                      </span>
                      <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                        {total}
                      </span>
                      <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform ${historialOportOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {historialOportOpen && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Resumen de números */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 text-center">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Ganadas</div>
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{won.length}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{fmt(wonValue)}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 text-center">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Perdidas</div>
                            <div className="text-base font-bold text-red-600 dark:text-red-400">{lost.length}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{fmt(lostValue)}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 text-center">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">En curso</div>
                            <div className="text-base font-bold text-blue-600 dark:text-blue-400">{open.length}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{fmt(openValue)}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 text-center">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Tasa éxito</div>
                            <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                              {winRate !== null ? `${winRate}%` : '—'}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {closedTotal > 0 ? `${won.length} de ${closedTotal} cerradas` : 'sin cerrar aún'}
                            </div>
                          </div>
                        </div>

                        {/* Timeline compacto */}
                        <div className="border-t border-amber-200/60 dark:border-amber-800/30 pt-3">
                          <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Cronología (de la más reciente)
                          </p>
                          <div className="space-y-1">
                            {sorted.map(d => {
                              const isWon = !!d.stages?.is_closed_won
                              const isLost = !!d.stages?.is_closed_lost
                              const dateStr = new Date(d.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                              const valueFmt = d.value != null ? `${Number(d.value).toLocaleString('es-ES')} €` : '—'
                              return (
                                <div key={d.id} className="flex items-center gap-2 py-1.5 text-xs border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                    isWon
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                      : isLost
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {isWon ? <Trophy className="h-3 w-3" /> : isLost ? <XCircle className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{dateStr}</span>
                                  <span className="font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">{d.name}</span>
                                  <span className="text-gray-600 dark:text-gray-300 font-medium w-24 text-right flex-shrink-0">{valueFmt}</span>
                                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    isWon
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                      : isLost
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {d.stages?.name || '—'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-400 italic pt-1">
                          Para informes en PDF, filtros por rango y exportaciones, ve a <span className="font-medium">Oportunidades</span> → "Historial de oportunidades cerradas".
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}

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
                    { icon: User, iconColor: 'text-cyan-400', label: 'Persona Contacto 2', value: data.custom_fields?.contacto_2, field: 'contacto_2' as keyof EditForm },
                    { icon: User, iconColor: 'text-cyan-300', label: 'Persona Contacto 3', value: data.custom_fields?.contacto_3, field: 'contacto_3' as keyof EditForm },
                    { icon: Phone, iconColor: 'text-green-500', label: 'Teléfono', value: data.phone, field: 'phone' as keyof EditForm },
                    { icon: Phone, iconColor: 'text-green-400', label: 'Móvil', value: data.custom_fields?.telefono_2, field: 'telefono_2' as keyof EditForm },
                    { icon: Phone, iconColor: 'text-green-300', label: 'Móvil 2', value: data.custom_fields?.telefono_3, field: 'telefono_3' as keyof EditForm },
                    { icon: Calendar, iconColor: 'text-amber-500', label: 'Última Compra', value: data.custom_fields?.ultima_compra, field: 'ultima_compra' as keyof EditForm },
                    { icon: CreditCard, iconColor: 'text-indigo-500', label: 'Forma de Pago', value: data.custom_fields?.forma_pago, field: 'forma_pago' as keyof EditForm, type: 'select', options: formaPagoOptions },
                    { icon: Calendar, iconColor: 'text-indigo-400', label: 'Día de Cobro', value: data.custom_fields?.dia_cobro, field: 'dia_cobro' as keyof EditForm, type: 'day' },
                    { icon: Mail, iconColor: 'text-blue-500', label: 'Email', value: data.email, field: 'email' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-400', label: 'Email 2', value: data.custom_fields?.email_2, field: 'email_2' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-300', label: 'Email 3', value: data.custom_fields?.email_3, field: 'email_3' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-300', label: 'Email 4', value: data.custom_fields?.email_4, field: 'email_4' as keyof EditForm },
                    { icon: Mail, iconColor: 'text-blue-200', label: 'Email 5', value: data.custom_fields?.email_5, field: 'email_5' as keyof EditForm },
                    { icon: Briefcase, iconColor: 'text-amber-600', label: 'Sector', value: data.industry, field: 'industry' as keyof EditForm },
                    { icon: UsersIcon, iconColor: 'text-gray-500', label: 'Tamaño', value: data.company_size, field: 'company_size' as keyof EditForm, type: 'select', options: ['1-10','11-50','51-200','201-500','501+'] },
                    { icon: Globe, iconColor: 'text-sky-500', label: 'Sitio Web', value: data.website, field: 'website' as keyof EditForm },
                    { icon: Linkedin, iconColor: 'text-blue-600', label: 'LinkedIn', value: data.linkedin_url, field: 'linkedin_url' as keyof EditForm },
                    { icon: DollarSign, iconColor: 'text-emerald-500', label: 'Facturación Anual', value: data.annual_revenue != null ? `${Number(data.annual_revenue).toLocaleString('es-ES')} €` : null, field: 'annual_revenue' as keyof EditForm, type: 'number' },
                  ] as any[]).map((f: any) => {
                    const isContactField = ['contacto', 'contacto_2', 'contacto_3'].includes(f.field)
                    return (
                    <div key={f.field} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <f.icon className={`h-5 w-5 ${f.iconColor} mt-0.5 flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                        {isEditing && editForm ? (
                          f.type === 'select' ? (
                            (() => {
                              const currentVal = editForm[f.field as keyof EditForm] as string
                              const options: string[] = f.options || []
                              const isCustom = currentVal !== '' && !options.includes(currentVal)
                              return (
                                <>
                                  <select
                                    value={isCustom ? FORMA_PAGO_CUSTOM_SENTINEL : currentVal}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      if (v === FORMA_PAGO_CUSTOM_SENTINEL) updateField(f.field, ' ')
                                      else updateField(f.field, v)
                                    }}
                                    className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">— Seleccionar —</option>
                                    {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                    <option value={FORMA_PAGO_CUSTOM_SENTINEL}>⚙️ Personalizar...</option>
                                  </select>
                                  {isCustom && (
                                    <input
                                      type="text"
                                      autoFocus
                                      value={currentVal === ' ' ? '' : currentVal}
                                      onChange={(e) => updateField(f.field, e.target.value)}
                                      placeholder="Escribe la forma de pago concreta"
                                      className="mt-1 flex h-8 w-full rounded-md border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  )}
                                </>
                              )
                            })()
                          ) : f.type === 'day' ? (
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={editForm[f.field as keyof EditForm]}
                              onChange={(e) => updateField(f.field, e.target.value)}
                              placeholder="1-31"
                              className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : f.type === 'number' ? (
                            <input
                              type="number"
                              value={editForm[f.field as keyof EditForm]}
                              onChange={(e) => updateField(f.field, e.target.value)}
                              className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={editForm[f.field as keyof EditForm]}
                                onChange={(e) => updateField(f.field, e.target.value)}
                                className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {isContactField && editForm[f.field as keyof EditForm] && (
                                <button
                                  type="button"
                                  onClick={() => updateField(f.field, '')}
                                  className="mt-1 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                  title="Eliminar esta persona"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )
                        ) : f.value ? (
                          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {f.field === 'dia_cobro' ? `Día ${f.value} de cada mes` : f.value}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">—</p>
                        )}
                      </div>
                    </div>
                  )})}
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
