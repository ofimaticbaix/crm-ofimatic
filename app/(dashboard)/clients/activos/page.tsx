'use client'

import { useState, useEffect, useDeferredValue, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, X, Building2, UserCheck,
  Mail, Phone, MapPin, User, Calendar, Loader2, Trash2,
  ChevronDown, ChevronUp, ArrowUpDown, Tag, CreditCard, Hash, Pencil, Save, Briefcase,
  PhoneCall, Users as UsersIcon, StickyNote, Check, Globe, Linkedin, DollarSign,
  FileText, History, AlertCircle, Upload, Download
} from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { FORMA_PAGO_CUSTOM_SENTINEL, getFormaPagoOptions } from '@/components/company-detail-modal'
import { logContact, getActivities } from '@/lib/actions/activities'
import { uploadPresupuesto, getPresupuestoUrl, replacePresupuestoAttachment, deletePresupuestoActivity, updatePresupuestoSentDate } from '@/lib/actions/documents'
import { toast } from 'sonner'
import { CompanyActivityWidget } from '@/components/company-activity-widget'
import { useCachedData } from '@/lib/hooks/use-cached-data'
import { useAllCompanies } from '@/lib/hooks/use-shared-data'
import { filterActiveCustomers } from '@/lib/counts'

type ClientTag = 'al_dia' | 'revisar' | 'vip' | 'descartado' | null
type SortField = 'name' | 'vat_number' | 'phone' | 'city' | 'tag' | 'dia_cobro'
type SortDirection = 'asc' | 'desc' | null

const TAG_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; rowBg: string; rowBorder: string }> = {
  al_dia: { label: 'Al Día', bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400', rowBg: 'bg-green-500/15 hover:bg-green-500/25', rowBorder: 'border-l-4 border-l-green-400' },
  revisar: { label: 'Revisar', bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400', rowBg: 'bg-orange-500/15 hover:bg-orange-500/25', rowBorder: 'border-l-4 border-l-orange-400' },
  vip: { label: 'VIP', bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', rowBg: 'bg-yellow-500/15 hover:bg-yellow-500/25', rowBorder: 'border-l-4 border-l-yellow-400' },
  descartado: { label: 'Descartado', bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400', rowBg: 'bg-gray-500/15 hover:bg-gray-500/25', rowBorder: 'border-l-4 border-l-gray-400' },
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

export default function ClientesActivosPage() {
  const { workspaceId, loading: wsLoading, userEmail, workspaceName } = useWorkspace()
  const FORMA_PAGO_OPTIONS = getFormaPagoOptions({ userEmail, workspaceName })
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tagDropdownId, setTagDropdownId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string>('todos')
  const [filterPago, setFilterPago] = useState<string>('todos')
  const [filterCobroHoy, setFilterCobroHoy] = useState(false)
  const hoyDia = new Date().getDate()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [mounted, setMounted] = useState(false)
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
  useEffect(() => { setMounted(true) }, [])

  const loadHistory = async (compId: string) => {
    if (!workspaceId) return
    setHistoryLoading(true)
    const { data } = await getActivities(workspaceId, { companyId: compId })
    const sorted = (data || []).slice().sort((a: any, b: any) => {
      const ta = new Date(a.completed_at || a.created_at).getTime()
      const tb = new Date(b.completed_at || b.created_at).getTime()
      return tb - ta
    })
    setHistory(sorted)
    setHistoryLoading(false)
  }

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const doLog = async (type: 'call' | 'meeting' | 'email' | 'note' | 'presupuesto', note?: string) => {
    const base = detailData || selectedClient
    if (!base || !workspaceId) return
    setLogging(type)
    let metadata: Record<string, any> | undefined = undefined
    try {
      if (type === 'presupuesto' && selectedFile) {
        setUploadingFile(true)
        const base64 = await fileToBase64(selectedFile)
        const up = await uploadPresupuesto(workspaceId, base.id, {
          name: selectedFile.name, type: selectedFile.type, size: selectedFile.size, base64,
        })
        setUploadingFile(false)
        if (up.error || !up.data) {
          setLogging(null); alert(up.error || 'No se pudo subir el archivo'); return
        }
        metadata = { attachment: up.data }
      }
      if (type === 'presupuesto' && presupuestoDate) {
        metadata = { ...(metadata || {}), sent_at: presupuestoDate }
      }
      const newActivity = await logContact(workspaceId, {
        type, company_id: base.id, description: note || undefined, metadata,
      })
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
    loadHistory(base.id)
    refetch()
  }

  const downloadAttachment = async (path: string) => {
    const { url, error } = await getPresupuestoUrl(path)
    if (error || !url) { alert(error || 'No se pudo generar el enlace'); return }
    window.open(url, '_blank')
  }

  const handleReplaceFile = async (activityId: string, file: File) => {
    const base = detailData || selectedClient
    if (!base || !workspaceId) return
    setReplacingId(activityId)
    try {
      const base64 = await fileToBase64(file)
      const res = await replacePresupuestoAttachment(activityId, workspaceId, base.id, {
        name: file.name, type: file.type, size: file.size, base64,
      })
      if (res.error) { alert(res.error); return }
      await loadHistory(base.id)
    } finally {
      setReplacingId(null)
    }
  }

  const handleDeletePresupuesto = async (activityId: string) => {
    const base = detailData || selectedClient
    if (!base) return
    if (!confirm('¿Eliminar este presupuesto? Se borrará también el archivo adjunto.')) return
    setDeletingPresupuestoId(activityId)
    const res = await deletePresupuestoActivity(activityId)
    setDeletingPresupuestoId(null)
    if (res.error) { alert(res.error); return }
    await loadHistory(base.id)
  }

  const handleChangeSentDate = async (activityId: string, newDate: string) => {
    const base = detailData || selectedClient
    if (!base || !newDate) return
    const res = await updatePresupuestoSentDate(activityId, newDate)
    if (res.error) { alert(res.error); return }
    setEditingDateId(null)
    setEditingDateValue('')
    await loadHistory(base.id)
  }

  const saveDescartadoReason = async () => {
    const base = detailData || selectedClient
    if (!base) return
    const current = base.custom_fields?.descartado_reason || ''
    if (descartadoReason === current) return
    setSavingReason(true)
    const cf = { ...(base.custom_fields || {}) }
    if (descartadoReason.trim()) cf.descartado_reason = descartadoReason.trim()
    else delete cf.descartado_reason
    await updateCompany(base.id, { custom_fields: cf })
    if (detailData) setDetailData({ ...detailData, custom_fields: cf })
    if (selectedClient) setSelectedClient({ ...selectedClient, custom_fields: cf })
    setSavingReason(false)
    refetch()
  }

  const handleSetStage = async (newStage: string) => {
    if (!selectedClient) return
    setStageSaving(true)
    await updateCompany(selectedClient.id, { account_type: (newStage || undefined) as any })
    const updated = { ...selectedClient, account_type: newStage || null }
    setSelectedClient(updated)
    if (detailData) setDetailData({ ...detailData, account_type: newStage || null })
    setStageSaving(false)
    refetch()
  }

  const handleSetStatus = async (newStatus: string) => {
    if (!selectedClient) return
    setStatusSaving(true)
    const base = detailData || selectedClient
    const cf = { ...(base.custom_fields || {}) }
    if (newStatus) cf.manual_status = newStatus
    else delete cf.manual_status
    await updateCompany(base.id, { custom_fields: cf })
    if (detailData) setDetailData({ ...detailData, custom_fields: cf })
    setSelectedClient({ ...selectedClient, custom_fields: cf })
    setStatusSaving(false)
    refetch()
  }

  // SHARED dataset — same source as /metrics, /clients/inactivos, /companies, etc.
  const { data: allCompanies, loading: dataLoading, refetch } = useAllCompanies()

  const loading = wsLoading || (dataLoading && !allCompanies)

  // Active customers = source-of-truth filter from lib/counts
  const customers = useMemo(() => filterActiveCustomers(allCompanies || []), [allCompanies])

  // Get unique payment methods for filter
  const paymentMethods = [...new Set(
    customers.map((c: any) => c.custom_fields?.forma_pago).filter(Boolean)
  )].sort() as string[]

  const filtered = useMemo(() => customers.filter((c: any) => {
    if (filterTag !== 'todos') {
      const tag = c.custom_fields?.client_tag || null
      if (filterTag === 'sin_tag' && tag) return false
      if (filterTag !== 'sin_tag' && tag !== filterTag) return false
    }
    if (filterPago !== 'todos') {
      const pago = c.custom_fields?.forma_pago || ''
      if (pago !== filterPago) return false
    }
    if (filterCobroHoy) {
      if (Number(c.custom_fields?.dia_cobro) !== hoyDia) return false
    }
    if (!deferredSearch) return true
    const q = deferredSearch.toLowerCase()
    const cf = c.custom_fields || {}
    return [
      c.name, c.vat_number, c.email, c.phone,
      c.billing_address?.city, c.billing_address?.state,
      cf.contacto, cf.codigo_cliente, cf.forma_pago,
      cf.telefono_2, cf.email_2
    ].some(v => v?.toLowerCase().includes(q))
  }), [customers, filterTag, filterPago, filterCobroHoy, hoyDia, deferredSearch])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null) }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const TAG_ORDER: Record<string, number> = { vip: 0, al_dia: 1, revisar: 2, descartado: 3 }

  const sorted = useMemo(() => [...filtered].sort((a: any, b: any) => {
    if (!sortField || !sortDirection) return 0
    let valA = ''
    let valB = ''
    if (sortField === 'name') { valA = a.name || ''; valB = b.name || '' }
    else if (sortField === 'vat_number') { valA = a.vat_number || ''; valB = b.vat_number || '' }
    else if (sortField === 'phone') { valA = a.phone || ''; valB = b.phone || '' }
    else if (sortField === 'city') { valA = a.billing_address?.city || ''; valB = b.billing_address?.city || '' }
    else if (sortField === 'tag') {
      const tagA = a.custom_fields?.client_tag || ''
      const tagB = b.custom_fields?.client_tag || ''
      const orderA = TAG_ORDER[tagA] ?? 99
      const orderB = TAG_ORDER[tagB] ?? 99
      return sortDirection === 'asc' ? orderA - orderB : orderB - orderA
    }
    else if (sortField === 'dia_cobro') {
      const dA = Number(a.custom_fields?.dia_cobro) || 99
      const dB = Number(b.custom_fields?.dia_cobro) || 99
      return sortDirection === 'asc' ? dA - dB : dB - dA
    }
    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  }), [filtered, sortField, sortDirection])

  const tagCounts = {
    al_dia: customers.filter((c: any) => c.custom_fields?.client_tag === 'al_dia').length,
    revisar: customers.filter((c: any) => c.custom_fields?.client_tag === 'revisar').length,
    vip: customers.filter((c: any) => c.custom_fields?.client_tag === 'vip').length,
    descartado: customers.filter((c: any) => c.custom_fields?.client_tag === 'descartado').length,
  }
  const cobranHoyCount = customers.filter((c: any) => Number(c.custom_fields?.dia_cobro) === hoyDia).length

  useEffect(() => {
    if (!selectedClient) {
      setDetailData(null); setIsEditing(false); setEditForm(null)
      setHistory([]); setDescartadoReason('')
      return
    }
    async function loadDetail() {
      if (!selectedClient) return
      setDetailLoading(true)
      const { data } = await getCompany(selectedClient.id)
      setDetailData(data)
      setDescartadoReason(data?.custom_fields?.descartado_reason || '')
      setDetailLoading(false)
      loadHistory(selectedClient.id)
    }
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    setDeletingId(id)
    await deleteCompany(id)
    setSelectedClient(null)
    refetch()
    setDeletingId(null)
  }

  const handleSetTag = async (clientId: string, tag: ClientTag) => {
    // Read fresh data directly from DB so we never overwrite with stale custom_fields.
    const fresh = await getCompany(clientId)
    if (fresh.error || !fresh.data) {
      toast.error(fresh.error || 'No se encontró el cliente')
      return
    }
    const currentCf = fresh.data.custom_fields || {}
    const newCf: Record<string, any> = { ...currentCf }
    if (tag) newCf.client_tag = tag
    else delete newCf.client_tag
    if (tag !== 'descartado') delete newCf.descartado_reason

    const result = await updateCompany(clientId, { custom_fields: newCf })
    if (result.error) {
      toast.error(`No se pudo cambiar la etiqueta: ${result.error}`)
      return
    }

    // Keep modal state in sync
    if (detailData?.id === clientId) {
      setDetailData({ ...detailData, custom_fields: newCf })
      if (tag !== 'descartado') setDescartadoReason('')
    }
    if (selectedClient?.id === clientId) {
      setSelectedClient({ ...selectedClient, custom_fields: newCf })
    }

    setTagDropdownId(null)
    refetch()
  }

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

    for (const k of Object.keys(cf)) {
      if (cf[k] === undefined) delete cf[k]
    }

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
    refetch()
  }

  const updateField = (field: keyof EditForm, value: string) => {
    if (!editForm) return
    setEditForm({ ...editForm, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5 bg-[#0a1628]/80 backdrop-blur-sm rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <UserCheck className="h-7 w-7 text-green-400" />
            Clientes Activos
          </h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            {customers.length} registrados · {tagCounts.al_dia} al día · {tagCounts.vip} VIP · {tagCounts.revisar} revisar · {tagCounts.descartado} descartados
          </p>
        </div>
      </div>

      {/* Filtro rápido: cobran hoy */}
      {cobranHoyCount > 0 && (
        <button
          onClick={() => setFilterCobroHoy(!filterCobroHoy)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto ${
            filterCobroHoy
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>{filterCobroHoy ? '✓ Mostrando solo cobros de hoy' : `💰 Hoy cobras de ${cobranHoyCount} ${cobranHoyCount === 1 ? 'cliente' : 'clientes'} (día ${hoyDia})`}</span>
        </button>
      )}

      {/* Filter tags */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: 'Todos', count: customers.length },
          { id: 'al_dia', label: 'Al Día', count: tagCounts.al_dia },
          { id: 'vip', label: 'VIP', count: tagCounts.vip },
          { id: 'revisar', label: 'Revisar', count: tagCounts.revisar },
          { id: 'descartado', label: 'Descartado', count: tagCounts.descartado },
          { id: 'sin_tag', label: 'Sin etiqueta', count: customers.length - tagCounts.al_dia - tagCounts.vip - tagCounts.revisar - tagCounts.descartado },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterTag(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterTag === f.id
                ? f.id === 'al_dia' ? 'bg-green-500/30 text-green-300'
                : f.id === 'vip' ? 'bg-yellow-500/30 text-yellow-300'
                : f.id === 'revisar' ? 'bg-orange-500/30 text-orange-300'
                : 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Filter by payment method */}
      {paymentMethods.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <CreditCard className="h-3.5 w-3.5 text-gray-500" />
          <button
            onClick={() => setFilterPago('todos')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
              filterPago === 'todos' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Todas
          </button>
          {paymentMethods.map((pm) => (
            <button
              key={pm}
              onClick={() => setFilterPago(filterPago === pm ? 'todos' : pm)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                filterPago === pm ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, NIF, email, teléfono, ciudad, contacto, código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-white dark:border-gray-300 dark:text-gray-900 dark:placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden bg-[#0d1b2a]/60 backdrop-blur-sm">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#1b2838]/80 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/30">
          <button onClick={() => handleSort('tag')} className="col-span-1 flex items-center gap-1 hover:text-white transition-colors">
            Estado
            {sortField === 'tag' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('name')} className="col-span-3 flex items-center gap-1 hover:text-white transition-colors">
            Empresa
            {sortField === 'name' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('city')} className="col-span-2 flex items-center gap-1 hover:text-white transition-colors">
            Población
            {sortField === 'city' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('phone')} className="col-span-1 flex items-center gap-1 hover:text-white transition-colors">
            Teléfono
            {sortField === 'phone' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <div className="col-span-1">Contacto</div>
          <div className="col-span-2">F. Pago</div>
          <div className="col-span-1">Email</div>
          <button onClick={() => handleSort('vat_number')} className="col-span-1 flex items-center gap-1 hover:text-white transition-colors">
            NIF
            {sortField === 'vat_number' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery || filterTag !== 'todos' || filterPago !== 'todos' ? 'No se encontraron resultados' : 'No hay clientes activos. Importa desde Excel.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/20">
            {sorted.map((client: any) => {
              const cf = client.custom_fields || {}
              const tag = cf.client_tag as string | undefined
              const tagInfo = tag ? TAG_CONFIG[tag] : null

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 px-4 py-2.5 cursor-pointer transition-colors group ${
                    tagInfo ? `${tagInfo.rowBg} ${tagInfo.rowBorder}` : 'hover:bg-white/5'
                  }`}
                >
                  {/* Tag column */}
                  <div className="col-span-1 flex items-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTagDropdownId(tagDropdownId === client.id ? null : client.id)
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                        tagInfo
                          ? `${tagInfo.bg} ${tagInfo.text}`
                          : 'bg-white/5 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {tagInfo ? (
                        <>
                          <div className={`w-1.5 h-1.5 rounded-full ${tagInfo.dot}`} />
                          {tagInfo.label}
                        </>
                      ) : (
                        <>
                          <Tag className="h-2.5 w-2.5" />
                          <ChevronDown className="h-2.5 w-2.5" />
                        </>
                      )}
                    </button>

                    {tagDropdownId === client.id && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                        {Object.entries(TAG_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetTag(client.id, key as ClientTag)
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${
                              tag === key ? config.text : 'text-gray-300'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                            {config.label}
                          </button>
                        ))}
                        {tag && (
                          <>
                            <div className="border-t border-gray-700 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSetTag(client.id, null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-white/10 transition-colors"
                            >
                              <X className="h-2.5 w-2.5" />
                              Quitar etiqueta
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Company name */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600">
                      {client.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-green-400 transition-colors">{client.name}</p>
                      {cf.codigo_cliente && <p className="text-[10px] text-gray-500">#{cf.codigo_cliente}</p>}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{client.billing_address?.city || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{client.phone || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{cf.contacto || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-[10px] text-gray-400 truncate">{cf.forma_pago || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{client.email || cf.email_2 || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-400 truncate">{client.vat_number || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          Mostrando {sorted.length} de {customers.length} clientes activos
        </p>
      )}

      {tagDropdownId && (
        <div className="fixed inset-0 z-40" onClick={() => setTagDropdownId(null)} />
      )}

      {/* Detail Modal */}
      {mounted && selectedClient && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedClient(null); setIsEditing(false); setEditForm(null) }}
        >
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    {(detailData || selectedClient).name?.[0] || '?'}
                  </div>
                  <div>
                    {isEditing && editForm ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="text-xl font-semibold w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nombre de la empresa"
                      />
                    ) : (
                      <CardTitle className="text-gray-900 dark:text-white text-xl">{(detailData || selectedClient).name}</CardTitle>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {(detailData || selectedClient).custom_fields?.client_tag && TAG_CONFIG[(detailData || selectedClient).custom_fields.client_tag] ? (
                        <Badge className={`${TAG_CONFIG[(detailData || selectedClient).custom_fields.client_tag].bg} ${TAG_CONFIG[(detailData || selectedClient).custom_fields.client_tag].text} rounded-full text-xs`}>
                          {TAG_CONFIG[(detailData || selectedClient).custom_fields.client_tag].label}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                          Cliente Activo
                        </Badge>
                      )}
                      {(detailData || selectedClient).vat_number && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">NIF: {(detailData || selectedClient).vat_number}</span>
                      )}
                      {(detailData || selectedClient).custom_fields?.codigo_cliente && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Cód: #{(detailData || selectedClient).custom_fields.codigo_cliente}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setIsEditing(false); setEditForm(null) }} className="rounded-xl">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Lifecycle stage */}
              {(() => {
                const base = detailData || selectedClient
                const manual = base?.custom_fields?.manual_status as string | undefined
                return (
                  <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Tipo:</span>
                      <select
                        value={base?.account_type || ''}
                        onChange={(e) => handleSetStage(e.target.value)}
                        disabled={stageSaving}
                        className="flex-1 h-8 text-sm rounded-lg bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="">— Sin clasificar —</option>
                        <option value="lead">Cliente Potencial</option>
                        <option value="customer">Cliente</option>
                      </select>
                      {stageSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    </div>
                    {base?.account_type === 'customer' && (
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
                    )}
                  </div>
                )
              })()}

              {/* Tag selector in modal */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {Object.entries(TAG_CONFIG).map(([key, config]) => {
                  const currentTag = (detailData || selectedClient).custom_fields?.client_tag
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        const nextTag = currentTag === key ? null : key as ClientTag
                        handleSetTag((detailData || selectedClient).id, nextTag)
                        if (detailData) {
                          const newCf = { ...detailData.custom_fields, client_tag: nextTag || undefined }
                          if (!nextTag) delete newCf.client_tag
                          if (nextTag !== 'descartado') {
                            delete newCf.descartado_reason
                            setDescartadoReason('')
                          }
                          setDetailData({ ...detailData, custom_fields: newCf })
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        currentTag === key
                          ? `${config.bg} ${config.text} border-current`
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                      {config.label}
                    </button>
                  )
                })}
              </div>

            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-green-500" />
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
                            if (type === 'presupuesto') setPresupuestoDate(new Date().toISOString().slice(0, 10))
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
                          <Input
                            autoFocus
                            placeholder={pendingType === 'presupuesto' ? 'Ej: Presupuesto baranda (opcional)' : 'Breve nota (opcional)...'}
                            value={logNote}
                            onChange={(e) => setLogNote(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && pendingType !== 'presupuesto') doLog(pendingType, logNote) }}
                            className="flex-1 h-8 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Máx. 20 MB.</p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                      Un click queda registrado como contacto de hoy.
                    </p>
                  </div>

                  {/* Widget de actividad */}
                  {workspaceId && (detailData || selectedClient) && (
                    <CompanyActivityWidget workspaceId={workspaceId} companyId={(detailData || selectedClient).id} accentColor="green" />
                  )}

                  {/* Motivo de Descarte — sólo si el tag actual es "descartado" */}
                  {((detailData || selectedClient).custom_fields?.client_tag === 'descartado') && (
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
                        placeholder="Ej: Impago, cliente difícil, dejó de trabajar con nosotros..."
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
                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
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
                            className="mt-3 text-xs text-green-600 dark:text-green-400 hover:underline"
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
                    const fmt = (b: number) => !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`
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
                              Ordenados del más reciente al más antiguo. Puedes reemplazar el archivo, cambiar la fecha de envío o eliminar cualquier presupuesto.
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
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.subject || 'Presupuesto'}</span>
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
                                          <button onClick={() => handleChangeSentDate(p.id, editingDateValue)}
                                            className="text-[11px] text-green-600 dark:text-green-400 hover:underline font-medium">Guardar</button>
                                          <button onClick={() => { setEditingDateId(null); setEditingDateValue('') }}
                                            className="text-[11px] text-gray-500 hover:underline">Cancelar</button>
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
                                          {att.size && <span className="text-gray-400 font-normal">· {fmt(att.size)}</span>}
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

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Información
                      </h3>
                      {!isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => startEditing(detailData || selectedClient)}
                          className="text-xs text-gray-400 hover:text-white">
                          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {([
                        { icon: Building2, iconColor: 'text-green-500', label: 'Empresa', value: (detailData || selectedClient).name, field: 'name' as keyof EditForm },
                        { icon: Hash, iconColor: 'text-gray-500', label: 'Código Cliente', value: (detailData || selectedClient).custom_fields?.codigo_cliente, field: 'codigo_cliente' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-red-500', label: 'Dirección', value: (detailData || selectedClient).billing_address?.street, field: 'street' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-orange-400', label: 'Población', value: (detailData || selectedClient).billing_address?.city, field: 'city' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-blue-400', label: 'C.P.', value: (detailData || selectedClient).billing_address?.postal_code, field: 'postal_code' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-indigo-400', label: 'Provincia', value: (detailData || selectedClient).billing_address?.state, field: 'province' as keyof EditForm },
                        { icon: Building2, iconColor: 'text-purple-500', label: 'NIF/CIF', value: (detailData || selectedClient).vat_number, field: 'vat_number' as keyof EditForm },
                        { icon: User, iconColor: 'text-cyan-500', label: 'Persona Contacto', value: (detailData || selectedClient).custom_fields?.contacto, field: 'contacto' as keyof EditForm },
                        { icon: User, iconColor: 'text-cyan-400', label: 'Persona Contacto 2', value: (detailData || selectedClient).custom_fields?.contacto_2, field: 'contacto_2' as keyof EditForm },
                        { icon: User, iconColor: 'text-cyan-300', label: 'Persona Contacto 3', value: (detailData || selectedClient).custom_fields?.contacto_3, field: 'contacto_3' as keyof EditForm },
                        { icon: Phone, iconColor: 'text-green-500', label: 'Teléfono', value: (detailData || selectedClient).phone, field: 'phone' as keyof EditForm },
                        { icon: Phone, iconColor: 'text-green-400', label: 'Móvil', value: (detailData || selectedClient).custom_fields?.telefono_2, field: 'telefono_2' as keyof EditForm },
                        { icon: Phone, iconColor: 'text-green-300', label: 'Móvil 2', value: (detailData || selectedClient).custom_fields?.telefono_3, field: 'telefono_3' as keyof EditForm },
                        { icon: Calendar, iconColor: 'text-amber-500', label: 'Última Compra', value: (detailData || selectedClient).custom_fields?.ultima_compra, field: 'ultima_compra' as keyof EditForm },
                        { icon: CreditCard, iconColor: 'text-indigo-500', label: 'Forma de Pago', value: (detailData || selectedClient).custom_fields?.forma_pago, field: 'forma_pago' as keyof EditForm, type: 'select', options: FORMA_PAGO_OPTIONS },
                        { icon: Calendar, iconColor: 'text-indigo-400', label: 'Día de Cobro', value: (detailData || selectedClient).custom_fields?.dia_cobro, field: 'dia_cobro' as keyof EditForm, type: 'day' },
                        { icon: Mail, iconColor: 'text-blue-500', label: 'Email', value: (detailData || selectedClient).email, field: 'email' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-400', label: 'Email 2', value: (detailData || selectedClient).custom_fields?.email_2, field: 'email_2' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-300', label: 'Email 3', value: (detailData || selectedClient).custom_fields?.email_3, field: 'email_3' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-300', label: 'Email 4', value: (detailData || selectedClient).custom_fields?.email_4, field: 'email_4' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-200', label: 'Email 5', value: (detailData || selectedClient).custom_fields?.email_5, field: 'email_5' as keyof EditForm },
                        { icon: Briefcase, iconColor: 'text-amber-600', label: 'Sector', value: (detailData || selectedClient).industry, field: 'industry' as keyof EditForm },
                        { icon: UsersIcon, iconColor: 'text-gray-500', label: 'Tamaño', value: (detailData || selectedClient).company_size, field: 'company_size' as keyof EditForm, type: 'select', options: ['1-10','11-50','51-200','201-500','501+'] },
                        { icon: Globe, iconColor: 'text-sky-500', label: 'Sitio Web', value: (detailData || selectedClient).website, field: 'website' as keyof EditForm },
                        { icon: Linkedin, iconColor: 'text-blue-600', label: 'LinkedIn', value: (detailData || selectedClient).linkedin_url, field: 'linkedin_url' as keyof EditForm },
                        { icon: DollarSign, iconColor: 'text-emerald-500', label: 'Facturación Anual', value: (detailData || selectedClient).annual_revenue != null ? `${Number((detailData || selectedClient).annual_revenue).toLocaleString('es-ES')} €` : null, field: 'annual_revenue' as keyof EditForm, type: 'number' },
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
                                        className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                  type="number" min={1} max={31}
                                  value={editForm[f.field as keyof EditForm]}
                                  onChange={(e) => updateField(f.field, e.target.value)}
                                  placeholder="1-31"
                                  className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              ) : f.type === 'number' ? (
                                <input
                                  type="number"
                                  value={editForm[f.field as keyof EditForm]}
                                  onChange={(e) => updateField(f.field, e.target.value)}
                                  className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              ) : (
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    value={editForm[f.field as keyof EditForm]}
                                    onChange={(e) => updateField(f.field, e.target.value)}
                                    className="mt-1 flex h-8 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  {isContactField && editForm[f.field as keyof EditForm] && (
                                    <button type="button" onClick={() => updateField(f.field, '')}
                                      className="mt-1 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                      title="Eliminar esta persona">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )
                            ) : f.value ? (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
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

                  {/* Notes */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</h3>
                    {isEditing && editForm ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={3}
                        className="w-full text-sm rounded-xl p-3 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        {(detailData || selectedClient).description || 'Sin notas'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} disabled={saving}
                          className="rounded-xl bg-green-600 hover:bg-green-700 text-white">
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
                        <Button variant="outline" onClick={() => startEditing(detailData || selectedClient)}
                          className="rounded-xl border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20">
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </Button>
                        <Button variant="outline" onClick={() => handleDelete((detailData || selectedClient).id)} disabled={deletingId === (detailData || selectedClient).id}
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                          {deletingId === (detailData || selectedClient).id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                          Eliminar
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedClient(null)}
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
      )}
    </div>
  )
}
