'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, X, Building2, UserCheck,
  Mail, Phone, MapPin, User, Calendar, Loader2, Trash2,
  ChevronDown, Tag, CreditCard, Hash, Pencil, Save
} from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { useCachedData } from '@/lib/hooks/use-cached-data'

type ClientTag = 'al_dia' | 'revisar' | 'vip' | null

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

  const { data: allCompanies, loading: dataLoading, refetch } = useCachedData<any[]>(
    `companies-${workspaceId}`,
    () => getCompanies(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const loading = wsLoading || (dataLoading && !allCompanies)

  // Filter only customers
  const customers = (allCompanies || []).filter((c: any) => c.account_type === 'customer')

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
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const cf = c.custom_fields || {}
    return [
      c.name, c.vat_number, c.email, c.phone,
      c.billing_address?.city, c.billing_address?.state,
      cf.contacto, cf.codigo_cliente, cf.forma_pago,
      cf.telefono_2, cf.email_2
    ].some(v => v?.toLowerCase().includes(q))
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
    <div className="space-y-5">
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
          className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden bg-[#0d1b2a]/60 backdrop-blur-sm">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#1b2838]/80 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/30">
          <div className="col-span-1">Estado</div>
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2">Población</div>
          <div className="col-span-1">Teléfono</div>
          <div className="col-span-1">Contacto</div>
          <div className="col-span-2">F. Pago</div>
          <div className="col-span-1">Email</div>
          <div className="col-span-1">NIF</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery || filterTag !== 'todos' || filterPago !== 'todos' ? 'No se encontraron resultados' : 'No hay clientes activos. Importa desde Excel.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/20">
            {filtered.map((client: any) => {
              const cf = client.custom_fields || {}
              const tag = cf.client_tag as string | undefined
              const tagInfo = tag ? TAG_CONFIG[tag] : null

              return (
                <div
                  key={client.id}
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
                  <div className="col-span-3 flex items-center gap-3 min-w-0" onClick={() => setSelectedClient(client)}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600">
                      {client.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-green-400 transition-colors">{client.name}</p>
                      {cf.codigo_cliente && <p className="text-[10px] text-gray-500">#{cf.codigo_cliente}</p>}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center" onClick={() => setSelectedClient(client)}>
                    <span className="text-xs text-gray-300 truncate">{client.billing_address?.city || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center" onClick={() => setSelectedClient(client)}>
                    <span className="text-xs text-gray-300 truncate">{client.phone || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center" onClick={() => setSelectedClient(client)}>
                    <span className="text-xs text-gray-300 truncate">{cf.contacto || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center" onClick={() => setSelectedClient(client)}>
                    <span className="text-[10px] text-gray-400 truncate">{cf.forma_pago || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center" onClick={() => setSelectedClient(client)}>
                    <span className="text-xs text-gray-300 truncate">{client.email || cf.email_2 || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center" onClick={() => setSelectedClient(client)}>
                    <span className="text-xs text-gray-400 truncate">{client.vat_number || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          Mostrando {filtered.length} de {customers.length} clientes activos
        </p>
      )}

      {tagDropdownId && (
        <div className="fixed inset-0 z-40" onClick={() => setTagDropdownId(null)} />
      )}

      {/* Detail Modal */}
      {selectedClient && (() => {
        const client = detailData || selectedClient
        const cf = client.custom_fields || {}
        const tag = cf.client_tag as string | undefined
        const tagInfo = tag ? TAG_CONFIG[tag] : null

        const InfoField = ({ icon: Icon, iconColor, label, value, href, external, field }: {
          icon: any; iconColor: string; label: string; value: string | null | undefined; href?: string; external?: boolean; field?: keyof EditForm
        }) => (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
            <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              {isEditing && field && editForm ? (
                <Input
                  value={editForm[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="mt-1 h-8 text-sm bg-white/10 border-gray-600 text-white"
                />
              ) : value ? (
                href ? (
                  <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                )
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          </div>
        )

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
                      {client.name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white text-xl">{client.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {tagInfo ? (
                          <Badge className={`${tagInfo.bg} ${tagInfo.text} rounded-full text-xs`}>
                            {tagInfo.label}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                            Cliente Activo
                          </Badge>
                        )}
                        {client.vat_number && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">NIF: {client.vat_number}</span>
                        )}
                        {cf.codigo_cliente && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Cód: #{cf.codigo_cliente}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setIsEditing(false); setEditForm(null) }} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tag selector in modal */}
                <div className="flex gap-2 mt-3">
                  {Object.entries(TAG_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        handleSetTag(client.id, tag === key ? null : key as ClientTag)
                        if (detailData) {
                          const newCf = { ...detailData.custom_fields, client_tag: tag === key ? undefined : key }
                          if (tag === key) delete newCf.client_tag
                          setDetailData({ ...detailData, custom_fields: newCf })
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        tag === key
                          ? `${config.bg} ${config.text} border-current`
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                      {config.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Información
                        </h3>
                        {!isEditing && (
                          <Button variant="ghost" size="sm" onClick={() => startEditing(client)}
                            className="text-xs text-gray-400 hover:text-white">
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InfoField icon={Building2} iconColor="text-green-500" label="Empresa" value={client.name} field="name" />
                        <InfoField icon={Hash} iconColor="text-gray-500" label="Código Cliente" value={cf.codigo_cliente} field="codigo_cliente" />
                        <InfoField icon={MapPin} iconColor="text-red-500" label="Dirección" value={client.billing_address?.street} field="street" />
                        <InfoField icon={MapPin} iconColor="text-orange-400" label="Población" value={client.billing_address?.city} field="city" />
                        <InfoField icon={MapPin} iconColor="text-blue-400" label="C.P." value={client.billing_address?.postal_code} field="postal_code" />
                        <InfoField icon={MapPin} iconColor="text-indigo-400" label="Provincia" value={client.billing_address?.state} field="province" />
                        <InfoField icon={Building2} iconColor="text-purple-500" label="NIF/CIF" value={client.vat_number} field="vat_number" />
                        <InfoField icon={User} iconColor="text-cyan-500" label="Persona Contacto" value={cf.contacto} field="contacto" />
                        <InfoField icon={Phone} iconColor="text-green-500" label="Teléfono" value={client.phone} field="phone"
                          href={!isEditing && client.phone ? `tel:${client.phone}` : undefined} />
                        <InfoField icon={Phone} iconColor="text-green-400" label="Móvil" value={cf.telefono_2} field="telefono_2"
                          href={!isEditing && cf.telefono_2 ? `tel:${cf.telefono_2}` : undefined} />
                        <InfoField icon={Calendar} iconColor="text-amber-500" label="Última Compra" value={cf.ultima_compra} field="ultima_compra" />
                        <InfoField icon={CreditCard} iconColor="text-indigo-500" label="Forma de Pago" value={cf.forma_pago} field="forma_pago" />
                        <InfoField icon={Mail} iconColor="text-blue-500" label="Email" value={client.email} field="email"
                          href={!isEditing && client.email ? `mailto:${client.email}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-400" label="Email 2" value={cf.email_2} field="email_2"
                          href={!isEditing && cf.email_2 ? `mailto:${cf.email_2}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-300" label="Email 3" value={cf.email_3} field="email_3"
                          href={!isEditing && cf.email_3 ? `mailto:${cf.email_3}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-300" label="Email 4" value={cf.email_4} field="email_4"
                          href={!isEditing && cf.email_4 ? `mailto:${cf.email_4}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-200" label="Email 5" value={cf.email_5} field="email_5"
                          href={!isEditing && cf.email_5 ? `mailto:${cf.email_5}` : undefined} />
                      </div>
                    </div>

                    {/* Notes - editable */}
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
                          {client.description || 'Sin notas'}
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
                          <Button variant="outline" onClick={() => startEditing(client)}
                            className="rounded-xl border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20">
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </Button>
                          <Button variant="outline" onClick={() => handleDelete(client.id)} disabled={deletingId === client.id}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                            {deletingId === client.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
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
          </div>
        )
      })()}
    </div>
  )
}
