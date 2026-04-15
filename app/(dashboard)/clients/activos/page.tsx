'use client'

import { useState, useEffect, useDeferredValue } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, X, Building2, UserCheck,
  Mail, Phone, MapPin, User, Calendar, Loader2, Trash2,
  ChevronDown, ChevronUp, ArrowUpDown, Tag, CreditCard, Hash, Pencil, Save, Briefcase,
  PhoneCall, Users as UsersIcon, StickyNote, Check
} from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { logContact } from '@/lib/actions/activities'
import { useCachedData } from '@/lib/hooks/use-cached-data'

type ClientTag = 'al_dia' | 'revisar' | 'vip' | null
type SortField = 'name' | 'vat_number' | 'phone' | 'city' | 'tag'
type SortDirection = 'asc' | 'desc' | null

const TAG_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; rowBg: string; rowBorder: string }> = {
  al_dia: { label: 'Al Día', bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400', rowBg: 'bg-green-500/15 hover:bg-green-500/25', rowBorder: 'border-l-4 border-l-green-400' },
  revisar: { label: 'Revisar', bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400', rowBg: 'bg-orange-500/15 hover:bg-orange-500/25', rowBorder: 'border-l-4 border-l-orange-400' },
  vip: { label: 'VIP', bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', rowBg: 'bg-yellow-500/15 hover:bg-yellow-500/25', rowBorder: 'border-l-4 border-l-yellow-400' },
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

export default function ClientesActivosPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tagDropdownId, setTagDropdownId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string>('todos')
  const [filterPago, setFilterPago] = useState<string>('todos')
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
  const [pendingType, setPendingType] = useState<'call' | 'meeting' | 'email' | 'note' | null>(null)
  const [justLogged, setJustLogged] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const doLog = async (type: 'call' | 'meeting' | 'email' | 'note', note?: string) => {
    const base = detailData || selectedClient
    if (!base || !workspaceId) return
    setLogging(type)
    await logContact(workspaceId, {
      type,
      company_id: base.id,
      description: note || undefined,
    })
    setLogging(null)
    setShowLogNote(false)
    setLogNote('')
    setPendingType(null)
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 2000)
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

  const { data: allCompanies, loading: dataLoading, refetch } = useCachedData<any[]>(
    `companies-${workspaceId}`,
    () => getCompanies(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const loading = wsLoading || (dataLoading && !allCompanies)

  // Filter only customers, excluding those manually forced to inactive/closed
  const customers = (allCompanies || []).filter((c: any) => {
    if (c.account_type !== 'customer') return false
    const manual = c.custom_fields?.manual_status
    if (manual === 'inactive' || manual === 'closed') return false
    return true
  })

  // Get unique payment methods for filter
  const paymentMethods = [...new Set(
    customers.map((c: any) => c.custom_fields?.forma_pago).filter(Boolean)
  )].sort() as string[]

  const filtered = customers.filter((c: any) => {
    if (filterTag !== 'todos') {
      const tag = c.custom_fields?.client_tag || null
      if (filterTag === 'sin_tag' && tag) return false
      if (filterTag !== 'sin_tag' && tag !== filterTag) return false
    }
    if (filterPago !== 'todos') {
      const pago = c.custom_fields?.forma_pago || ''
      if (pago !== filterPago) return false
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
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null) }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const TAG_ORDER: Record<string, number> = { vip: 0, al_dia: 1, revisar: 2 }

  const sorted = [...filtered].sort((a: any, b: any) => {
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
    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const tagCounts = {
    al_dia: customers.filter((c: any) => c.custom_fields?.client_tag === 'al_dia').length,
    revisar: customers.filter((c: any) => c.custom_fields?.client_tag === 'revisar').length,
    vip: customers.filter((c: any) => c.custom_fields?.client_tag === 'vip').length,
  }

  useEffect(() => {
    if (!selectedClient) { setDetailData(null); setIsEditing(false); setEditForm(null); return }
    async function loadDetail() {
      setDetailLoading(true)
      const { data } = await getCompany(selectedClient.id)
      setDetailData(data)
      setDetailLoading(false)
    }
    loadDetail()
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
    const company = customers.find((c: any) => c.id === clientId)
    if (!company) return

    const currentCf = company.custom_fields || {}
    const newCf = { ...currentCf, client_tag: tag || undefined }
    if (!tag) delete newCf.client_tag

    await updateCompany(clientId, { custom_fields: newCf })
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

    for (const k of Object.keys(cf)) {
      if (cf[k] === undefined) delete cf[k]
    }

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
            {customers.length} registrados · {tagCounts.al_dia} al día · {tagCounts.vip} VIP · {tagCounts.revisar} revisar
          </p>
        </div>
      </div>

      {/* Filter tags */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: 'Todos', count: customers.length },
          { id: 'al_dia', label: 'Al Día', count: tagCounts.al_dia },
          { id: 'vip', label: 'VIP', count: tagCounts.vip },
          { id: 'revisar', label: 'Revisar', count: tagCounts.revisar },
          { id: 'sin_tag', label: 'Sin etiqueta', count: customers.length - tagCounts.al_dia - tagCounts.vip - tagCounts.revisar },
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
                    <CardTitle className="text-gray-900 dark:text-white text-xl">{(detailData || selectedClient).name}</CardTitle>
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
                    )}
                  </div>
                )
              })()}

              {/* Tag selector in modal */}
              <div className="flex gap-2 mt-3">
                {Object.entries(TAG_CONFIG).map(([key, config]) => {
                  const currentTag = (detailData || selectedClient).custom_fields?.client_tag
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        handleSetTag((detailData || selectedClient).id, currentTag === key ? null : key as ClientTag)
                        if (detailData) {
                          const newCf = { ...detailData.custom_fields, client_tag: currentTag === key ? undefined : key }
                          if (currentTag === key) delete newCf.client_tag
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
                        <Input
                          autoFocus
                          placeholder="Breve nota (opcional)..."
                          value={logNote}
                          onChange={(e) => setLogNote(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') doLog(pendingType, logNote) }}
                          className="flex-1 h-8 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                      Un click queda registrado como contacto de hoy.
                    </p>
                  </div>

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
                      {[
                        { icon: Building2, iconColor: 'text-green-500', label: 'Empresa', value: (detailData || selectedClient).name, field: 'name' as keyof EditForm },
                        { icon: Hash, iconColor: 'text-gray-500', label: 'Código Cliente', value: (detailData || selectedClient).custom_fields?.codigo_cliente, field: 'codigo_cliente' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-red-500', label: 'Dirección', value: (detailData || selectedClient).billing_address?.street, field: 'street' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-orange-400', label: 'Población', value: (detailData || selectedClient).billing_address?.city, field: 'city' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-blue-400', label: 'C.P.', value: (detailData || selectedClient).billing_address?.postal_code, field: 'postal_code' as keyof EditForm },
                        { icon: MapPin, iconColor: 'text-indigo-400', label: 'Provincia', value: (detailData || selectedClient).billing_address?.state, field: 'province' as keyof EditForm },
                        { icon: Building2, iconColor: 'text-purple-500', label: 'NIF/CIF', value: (detailData || selectedClient).vat_number, field: 'vat_number' as keyof EditForm },
                        { icon: User, iconColor: 'text-cyan-500', label: 'Persona Contacto', value: (detailData || selectedClient).custom_fields?.contacto, field: 'contacto' as keyof EditForm },
                        { icon: Phone, iconColor: 'text-green-500', label: 'Teléfono', value: (detailData || selectedClient).phone, field: 'phone' as keyof EditForm },
                        { icon: Phone, iconColor: 'text-green-400', label: 'Móvil', value: (detailData || selectedClient).custom_fields?.telefono_2, field: 'telefono_2' as keyof EditForm },
                        { icon: Calendar, iconColor: 'text-amber-500', label: 'Última Compra', value: (detailData || selectedClient).custom_fields?.ultima_compra, field: 'ultima_compra' as keyof EditForm },
                        { icon: CreditCard, iconColor: 'text-indigo-500', label: 'Forma de Pago', value: (detailData || selectedClient).custom_fields?.forma_pago, field: 'forma_pago' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-500', label: 'Email', value: (detailData || selectedClient).email, field: 'email' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-400', label: 'Email 2', value: (detailData || selectedClient).custom_fields?.email_2, field: 'email_2' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-300', label: 'Email 3', value: (detailData || selectedClient).custom_fields?.email_3, field: 'email_3' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-300', label: 'Email 4', value: (detailData || selectedClient).custom_fields?.email_4, field: 'email_4' as keyof EditForm },
                        { icon: Mail, iconColor: 'text-blue-200', label: 'Email 5', value: (detailData || selectedClient).custom_fields?.email_5, field: 'email_5' as keyof EditForm },
                      ].map((f) => (
                        <div key={f.field} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                          <f.icon className={`h-5 w-5 ${f.iconColor} mt-0.5 flex-shrink-0`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                            {isEditing && editForm ? (
                              <Input
                                value={editForm[f.field]}
                                onChange={(e) => updateField(f.field, e.target.value)}
                                className="mt-1 h-8 text-sm bg-white/10 border-gray-600 text-white"
                              />
                            ) : f.value ? (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{f.value}</p>
                            ) : (
                              <p className="text-sm text-gray-400">—</p>
                            )}
                          </div>
                        </div>
                      ))}
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
                        className="w-full text-sm rounded-xl p-3 bg-white/10 border border-gray-600 text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
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
