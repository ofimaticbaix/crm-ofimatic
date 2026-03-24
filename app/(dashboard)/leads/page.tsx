'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Globe, X, Building2, Target,
  Mail, Phone, MapPin, User, Calendar, Loader2, Trash2,
  ChevronDown, Tag, Pencil, Save
} from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { useCachedData } from '@/lib/hooks/use-cached-data'

type LeadTag = 'visitar' | 'no_interesa' | 'cliente' | null

const TAG_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; rowBg: string; rowBorder: string }> = {
  visitar: { label: 'Visitar', bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400', rowBg: 'bg-orange-500/15 hover:bg-orange-500/25', rowBorder: 'border-l-4 border-l-orange-400' },
  no_interesa: { label: 'No Interesa', bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400', rowBg: 'bg-green-500/15 hover:bg-green-500/25', rowBorder: 'border-l-4 border-l-green-400' },
  cliente: { label: 'Cliente', bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', rowBg: 'bg-yellow-500/15 hover:bg-yellow-500/25', rowBorder: 'border-l-4 border-l-yellow-400' },
}

interface EditForm {
  name: string
  street: string
  city: string
  vat_number: string
  phone: string
  telefono_2: string
  email: string
  email_2: string
  website: string
  contacto: string
  fecha_actualizacion: string
  description: string
}

export default function LeadsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tagDropdownId, setTagDropdownId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string>('todos')
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

  // Filter only leads (account_type = 'lead')
  const leads = (allCompanies || []).filter((c: any) => c.account_type === 'lead')

  const filtered = leads.filter((c: any) => {
    if (filterTag !== 'todos') {
      const tag = c.custom_fields?.lead_tag || null
      if (filterTag === 'sin_tag' && tag) return false
      if (filterTag !== 'sin_tag' && tag !== filterTag) return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return [c.name, c.vat_number, c.email, c.phone, c.billing_address?.city, c.custom_fields?.contacto]
      .some(v => v?.toLowerCase().includes(q))
  })

  // Tag counts
  const tagCounts = {
    visitar: leads.filter((c: any) => c.custom_fields?.lead_tag === 'visitar').length,
    no_interesa: leads.filter((c: any) => c.custom_fields?.lead_tag === 'no_interesa').length,
    cliente: leads.filter((c: any) => c.custom_fields?.lead_tag === 'cliente').length,
  }

  // Load detail when selecting
  useEffect(() => {
    if (!selectedLead) { setDetailData(null); setIsEditing(false); setEditForm(null); return }
    async function loadDetail() {
      setDetailLoading(true)
      const { data } = await getCompany(selectedLead.id)
      setDetailData(data)
      setDetailLoading(false)
    }
    loadDetail()
  }, [selectedLead])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente potencial?')) return
    setDeletingId(id)
    await deleteCompany(id)
    setSelectedLead(null)
    refetch()
    setDeletingId(null)
  }

  const handleSetTag = async (leadId: string, tag: LeadTag) => {
    const company = leads.find((c: any) => c.id === leadId)
    if (!company) return

    const currentCf = company.custom_fields || {}
    const newCf = { ...currentCf, lead_tag: tag || undefined }
    if (!tag) delete newCf.lead_tag

    await updateCompany(leadId, { custom_fields: newCf })
    setTagDropdownId(null)
    refetch()
  }

  const startEditing = (data: any) => {
    const cf = data.custom_fields || {}
    setEditForm({
      name: data.name || '',
      street: data.billing_address?.street || '',
      city: data.billing_address?.city || '',
      vat_number: data.vat_number || '',
      phone: data.phone || '',
      telefono_2: cf.telefono_2 || '',
      email: data.email || '',
      email_2: cf.email_2 || '',
      website: data.website || '',
      contacto: cf.contacto || '',
      fecha_actualizacion: cf.fecha_actualizacion || '',
      description: data.description || '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editForm || !detailData) return
    setSaving(true)

    const cf = { ...(detailData.custom_fields || {}) }
    cf.telefono_2 = editForm.telefono_2 || undefined
    cf.email_2 = editForm.email_2 || undefined
    cf.contacto = editForm.contacto || undefined
    cf.fecha_actualizacion = editForm.fecha_actualizacion || undefined

    // Clean undefined keys
    for (const k of Object.keys(cf)) {
      if (cf[k] === undefined) delete cf[k]
    }

    await updateCompany(detailData.id, {
      name: editForm.name,
      vat_number: editForm.vat_number || undefined,
      phone: editForm.phone || undefined,
      email: editForm.email || undefined,
      website: editForm.website || undefined,
      description: editForm.description || undefined,
      billing_address: {
        street: editForm.street || undefined,
        city: editForm.city || undefined,
      },
      custom_fields: cf,
    })

    // Reload detail
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
            <Target className="h-7 w-7 text-orange-400" />
            Clientes Potenciales
          </h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            {leads.length} registrados · {tagCounts.visitar} visitar · {tagCounts.cliente} clientes · {tagCounts.no_interesa} no interesa
          </p>
        </div>
      </div>

      {/* Filter tags */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: 'Todos', count: leads.length },
          { id: 'visitar', label: 'Visitar', count: tagCounts.visitar },
          { id: 'cliente', label: 'Cliente', count: tagCounts.cliente },
          { id: 'no_interesa', label: 'No Interesa', count: tagCounts.no_interesa },
          { id: 'sin_tag', label: 'Sin etiqueta', count: leads.length - tagCounts.visitar - tagCounts.cliente - tagCounts.no_interesa },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterTag(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterTag === f.id
                ? f.id === 'visitar' ? 'bg-orange-500/30 text-orange-300'
                : f.id === 'cliente' ? 'bg-yellow-500/30 text-yellow-300'
                : f.id === 'no_interesa' ? 'bg-green-500/30 text-green-300'
                : 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, NIF, email, telefono, ciudad, contacto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-white dark:border-gray-300 dark:text-gray-900 dark:placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden bg-[#0d1b2a]/60 backdrop-blur-sm">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#1b2838]/80 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/30">
          <div className="col-span-1">Estado</div>
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2">Poblacion</div>
          <div className="col-span-1">Telefono</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-1">NIF</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery || filterTag !== 'todos' ? 'No se encontraron resultados' : 'No hay clientes potenciales. Importa desde Excel.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/20">
            {filtered.map((lead: any) => {
              const cf = lead.custom_fields || {}
              const tag = cf.lead_tag as string | undefined
              const tagInfo = tag ? TAG_CONFIG[tag] : null

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 px-4 py-2.5 cursor-pointer transition-colors group ${
                    tagInfo ? `${tagInfo.rowBg} ${tagInfo.rowBorder}` : 'hover:bg-white/5'
                  }`}
                >
                  {/* Tag column */}
                  <div className="col-span-1 flex items-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTagDropdownId(tagDropdownId === lead.id ? null : lead.id)
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

                    {/* Tag dropdown */}
                    {tagDropdownId === lead.id && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                        {Object.entries(TAG_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetTag(lead.id, key as LeadTag)
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
                                handleSetTag(lead.id, null)
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gray-600">
                      {lead.name[0]}
                    </div>
                    <p className="text-sm font-medium text-white truncate group-hover:text-orange-400 transition-colors">{lead.name}</p>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{lead.billing_address?.city || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{lead.phone || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{cf.contacto || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{lead.email || cf.email_2 || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-400 truncate">{lead.vat_number || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          Mostrando {filtered.length} de {leads.length} clientes potenciales
        </p>
      )}

      {/* Click outside to close tag dropdown */}
      {tagDropdownId && (
        <div className="fixed inset-0 z-40" onClick={() => setTagDropdownId(null)} />
      )}

      {/* Detail Modal */}
      {selectedLead && (() => {
        const lead = detailData || selectedLead
        const cf = lead.custom_fields || {}
        const tag = cf.lead_tag as string | undefined
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && undefined}>
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg bg-gray-600">
                      {lead.name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white text-xl">{lead.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {tagInfo ? (
                          <Badge className={`${tagInfo.bg} ${tagInfo.text} rounded-full text-xs`}>
                            {tagInfo.label}
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs">
                            Cliente Potencial
                          </Badge>
                        )}
                        {lead.vat_number && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">NIF: {lead.vat_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedLead(null); setIsEditing(false); setEditForm(null) }} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tag selector in modal */}
                <div className="flex gap-2 mt-3">
                  {Object.entries(TAG_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        handleSetTag(lead.id, tag === key ? null : key as LeadTag)
                        if (detailData) {
                          const newCf = { ...detailData.custom_fields, lead_tag: tag === key ? undefined : key }
                          if (tag === key) delete newCf.lead_tag
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
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Informacion
                        </h3>
                        {!isEditing && (
                          <Button variant="ghost" size="sm" onClick={() => startEditing(lead)}
                            className="text-xs text-gray-400 hover:text-white">
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InfoField icon={Building2} iconColor="text-orange-500" label="Empresa" value={lead.name} field="name" />
                        <InfoField icon={MapPin} iconColor="text-red-500" label="Direccion" value={lead.billing_address?.street} field="street" />
                        <InfoField icon={MapPin} iconColor="text-orange-400" label="Poblacion" value={lead.billing_address?.city} field="city" />
                        <InfoField icon={Building2} iconColor="text-purple-500" label="NIF" value={lead.vat_number} field="vat_number" />
                        <InfoField icon={Phone} iconColor="text-green-500" label="Telefono" value={lead.phone} field="phone"
                          href={!isEditing && lead.phone ? `tel:${lead.phone}` : undefined} />
                        <InfoField icon={Phone} iconColor="text-green-400" label="Telefono 2" value={cf.telefono_2} field="telefono_2"
                          href={!isEditing && cf.telefono_2 ? `tel:${cf.telefono_2}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-500" label="Mail Compras" value={lead.email} field="email"
                          href={!isEditing && lead.email ? `mailto:${lead.email}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-400" label="Mail Empresa" value={cf.email_2} field="email_2"
                          href={!isEditing && cf.email_2 ? `mailto:${cf.email_2}` : undefined} />
                        <InfoField icon={Globe} iconColor="text-indigo-500" label="Web" value={lead.website} field="website"
                          href={!isEditing && lead.website ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`) : undefined} external />
                        <InfoField icon={User} iconColor="text-cyan-500" label="Contacto" value={cf.contacto} field="contacto" />
                        <InfoField icon={Calendar} iconColor="text-amber-500" label="Fecha Actualizacion" value={cf.fecha_actualizacion} field="fecha_actualizacion" />
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
                          className="w-full text-sm rounded-xl p-3 bg-white/10 border border-gray-600 text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                          {lead.description || 'Sin notas'}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {isEditing ? (
                        <>
                          <Button onClick={handleSave} disabled={saving}
                            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
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
                          <Button variant="outline" onClick={() => startEditing(lead)}
                            className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20">
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </Button>
                          <Button variant="outline" onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                            {deletingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedLead(null)}
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
