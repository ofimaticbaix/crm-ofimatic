'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft, Building2, Phone, Mail, Globe, MapPin, FileText,
  Users, TrendingUp, Calendar, Clock, Pencil, Save, X,
  User, CreditCard, Star, ExternalLink, Loader2, CheckCircle2,
  AlertCircle, Plus, Link2, Unlink, Trash2, ChevronDown
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  getClientDetail, type ClientDetail, type ClientActivity,
  getWorkspaceContactsForLinking, linkContactToCompany, unlinkContactFromCompany
} from '@/lib/actions/client-detail'
import { updateCompany } from '@/lib/actions/companies'
import { deleteCompany } from '@/lib/actions/companies'
import { useWorkspace } from '@/lib/context/workspace-context'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { workspaceId } = useWorkspace()

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const [deleting, setDeleting] = useState(false)

  // Contact linking
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [availableContacts, setAvailableContacts] = useState<{ id: string; name: string; email: string | null }[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [linkingContact, setLinkingContact] = useState(false)

  // Activity filters
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('all')

  const reload = useCallback(async () => {
    const { data, error } = await getClientDetail(clientId)
    if (error) setError(error)
    else setClient(data)
  }, [clientId])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await reload()
      setLoading(false)
    }
    if (clientId) load()
  }, [clientId, reload])

  const startEditing = () => {
    if (!client) return
    setEditForm({
      name: client.name || '',
      vat_number: client.vat_number || '',
      phone: client.phone || '',
      email: client.email || '',
      website: client.website || '',
      industry: client.industry || '',
      company_size: client.company_size || '',
      description: client.description || '',
      linkedin_url: client.linkedin_url || '',
      account_type: client.account_type || 'prospect',
      account_status: client.account_status || 'active',
      annual_revenue: client.annual_revenue || '',
      founded_year: client.founded_year || '',
      employees_exact: client.employees_exact || '',
      billing_street: client.billing_address?.street || '',
      billing_city: client.billing_address?.city || '',
      billing_postal_code: client.billing_address?.postal_code || '',
      billing_state: client.billing_address?.state || '',
      billing_country: client.billing_address?.country || 'Espana',
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditForm({})
  }

  const saveChanges = async () => {
    if (!client) return
    setSaving(true)
    const input: Record<string, any> = {
      name: editForm.name,
      vat_number: editForm.vat_number || null,
      phone: editForm.phone || null,
      email: editForm.email || null,
      website: editForm.website || null,
      industry: editForm.industry || null,
      company_size: editForm.company_size || null,
      description: editForm.description || null,
      linkedin_url: editForm.linkedin_url || null,
      account_type: editForm.account_type,
      account_status: editForm.account_status,
      annual_revenue: editForm.annual_revenue ? Number(editForm.annual_revenue) : null,
      founded_year: editForm.founded_year ? Number(editForm.founded_year) : null,
      employees_exact: editForm.employees_exact ? Number(editForm.employees_exact) : null,
      billing_address: {
        street: editForm.billing_street || undefined,
        city: editForm.billing_city || undefined,
        postal_code: editForm.billing_postal_code || undefined,
        state: editForm.billing_state || undefined,
        country: editForm.billing_country || undefined,
      },
    }

    const { error } = await updateCompany(client.id, input)
    if (!error) {
      await reload()
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!client) return
    if (!confirm('¿Eliminar esta empresa? Esta accion no se puede deshacer facilmente.')) return
    setDeleting(true)
    const { error } = await deleteCompany(client.id)
    if (!error) {
      router.push('/clients')
    }
    setDeleting(false)
  }

  const openContactPicker = async () => {
    if (!workspaceId || !client) return
    setShowContactPicker(true)
    const { data } = await getWorkspaceContactsForLinking(workspaceId, client.id)
    setAvailableContacts(data || [])
  }

  const handleLinkContact = async (contactId: string) => {
    if (!client) return
    setLinkingContact(true)
    const { error } = await linkContactToCompany(contactId, client.id)
    if (!error) {
      await reload()
      // Refresh available contacts
      if (workspaceId) {
        const { data } = await getWorkspaceContactsForLinking(workspaceId, client.id)
        setAvailableContacts(data || [])
      }
    }
    setLinkingContact(false)
  }

  const handleUnlinkContact = async (contactId: string) => {
    if (!confirm('¿Desvincular este contacto de la empresa?')) return
    const { error } = await unlinkContactFromCompany(contactId)
    if (!error) await reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-400">{error || 'Cliente no encontrado'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Clientes
        </Button>
      </div>
    )
  }

  const accountTypeLabels: Record<string, string> = {
    customer: 'Cliente', prospect: 'Prospecto', lead: 'Lead', partner: 'Partner', supplier: 'Proveedor'
  }
  const accountTypeBadge: Record<string, string> = {
    customer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    partner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    supplier: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }

  const cf = client.custom_fields || {}
  const openDeals = client.deals.filter(d => d.status === 'open')
  const totalValue = client.deals.reduce((s, d) => s + (d.value || 0), 0)

  // Activity filtering
  const filteredActivities = client.recent_activities.filter(a => {
    if (activityTypeFilter !== 'all' && a.type !== activityTypeFilter) return false
    if (activityStatusFilter === 'pending' && a.is_completed) return false
    if (activityStatusFilter === 'completed' && !a.is_completed) return false
    if (activityStatusFilter === 'cancelled') return false // placeholder
    return true
  })

  const pendingCount = client.recent_activities.filter(a => !a.is_completed).length
  const completedCount = client.recent_activities.filter(a => a.is_completed).length

  // Filtered contacts for picker
  const filteredAvailable = availableContacts.filter(c =>
    !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase()))
  )

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/clients')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
              {client.name[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-white truncate">{client.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge className={`${accountTypeBadge[client.account_type || 'prospect']} rounded-full text-[10px]`}>
                  {accountTypeLabels[client.account_type || 'prospect']}
                </Badge>
                {cf.codigo_cliente && (
                  <span className="text-xs text-gray-400">Cod: {cf.codigo_cliente}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-lg font-bold text-white">{client.contacts.length}</div>
              <div className="text-[10px] text-gray-400">Contactos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <div>
              <div className="text-lg font-bold text-white">{openDeals.length}</div>
              <div className="text-[10px] text-gray-400">Deals Abiertos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-purple-400" />
            <div>
              <div className="text-lg font-bold text-white">{formatCurrency(totalValue)}</div>
              <div className="text-[10px] text-gray-400">Valor Total</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informacion de Contacto */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" /> Informacion de Contacto
          </h3>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                <Input value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Telefono</label>
                <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Direccion</label>
                <Input value={editForm.billing_street || ''} onChange={(e) => setEditForm({ ...editForm, billing_street: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Poblacion</label>
                <Input value={editForm.billing_city || ''} onChange={(e) => setEditForm({ ...editForm, billing_city: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Provincia</label>
                <Input value={editForm.billing_state || ''} onChange={(e) => setEditForm({ ...editForm, billing_state: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">C. Postal</label>
                <Input value={editForm.billing_postal_code || ''} onChange={(e) => setEditForm({ ...editForm, billing_postal_code: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">CIF/NIF</label>
                <Input value={editForm.vat_number || ''} onChange={(e) => setEditForm({ ...editForm, vat_number: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sitio Web</label>
                <Input value={editForm.website || ''} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Razon Social</label>
                <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm bg-white/5 border-gray-600" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6">
              <InfoRow icon={Mail} label="Email" value={client.email} href={client.email ? `mailto:${client.email}` : undefined} />
              <InfoRow icon={Phone} label="Telefono" value={client.phone} href={client.phone ? `tel:${client.phone}` : undefined} />
              {cf.telefono_2 && <InfoRow icon={Phone} label="Telefono 2" value={cf.telefono_2} href={`tel:${cf.telefono_2}`} />}
              {cf.email_2 && <InfoRow icon={Mail} label="Email 2" value={cf.email_2} href={`mailto:${cf.email_2}`} />}
              <InfoRow icon={MapPin} label="Direccion" value={client.billing_address?.street} />
              <InfoRow icon={MapPin} label="Poblacion" value={client.billing_address?.city} />
              <InfoRow icon={MapPin} label="Provincia" value={client.billing_address?.state} />
              <InfoRow icon={MapPin} label="C. Postal" value={client.billing_address?.postal_code} />
              <InfoRow icon={FileText} label="CIF/NIF" value={client.vat_number} />
              {client.website && (
                <InfoRow icon={Globe} label="Web" value={client.website} href={client.website.startsWith('http') ? client.website : `https://${client.website}`} external />
              )}
              {cf.forma_pago && <InfoRow icon={CreditCard} label="Forma de Pago" value={cf.forma_pago} />}
              {cf.ultima_compra && <InfoRow icon={Calendar} label="Ultima Compra" value={cf.ultima_compra} />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personas de Contacto */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" /> Personas de Contacto ({client.contacts.length})
            </h3>
            <Button size="sm" variant="outline" onClick={openContactPicker} className="text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Anadir Contacto
            </Button>
          </div>

          {/* Contact Picker Dropdown */}
          {showContactPicker && (
            <div className="border border-gray-600 rounded-lg bg-gray-800/90 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Seleccionar contacto existente</span>
                <button onClick={() => { setShowContactPicker(false); setContactSearch('') }} className="text-gray-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                placeholder="Buscar por nombre o email..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="h-8 text-sm bg-white/5 border-gray-600"
                autoFocus
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredAvailable.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2 text-center">
                    {availableContacts.length === 0 ? 'No hay contactos disponibles' : 'Sin resultados'}
                  </p>
                ) : (
                  filteredAvailable.slice(0, 10).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleLinkContact(c.id)}
                      disabled={linkingContact}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/10 text-left transition-colors disabled:opacity-50"
                    >
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate">{c.name}</p>
                        {c.email && <p className="text-[10px] text-gray-500 truncate">{c.email}</p>}
                      </div>
                      <Link2 className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Linked Contacts */}
          {client.contacts.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay contactos asociados</p>
          ) : (
            <div className="space-y-2">
              {client.contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(contact.first_name?.[0] || '')}{(contact.last_name?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {contact.first_name} {contact.last_name}
                      </h4>
                      {contact.is_decision_maker && (
                        <Star className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    {contact.job_title && (
                      <p className="text-[10px] text-gray-400">{contact.job_title}{contact.department ? ` - ${contact.department}` : ''}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                          <Mail className="h-2.5 w-2.5" /> {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-[11px] text-green-400 hover:text-green-300">
                          <Phone className="h-2.5 w-2.5" /> {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkContact(contact.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                    title="Desvincular contacto"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Oportunidades */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" /> Oportunidades ({client.deals.length})
          </h3>
          {client.deals.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay oportunidades activas</p>
          ) : (
            <div className="space-y-2">
              {client.deals.map((deal) => {
                const statusLabels: Record<string, { label: string; color: string }> = {
                  open: { label: 'Abierta', color: 'bg-blue-900/30 text-blue-400' },
                  won: { label: 'Ganada', color: 'bg-green-900/30 text-green-400' },
                  lost: { label: 'Perdida', color: 'bg-red-900/30 text-red-400' },
                }
                const st = statusLabels[deal.status] || statusLabels.open
                return (
                  <div key={deal.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white truncate">{deal.name}</h4>
                        <Badge className={`${st.color} rounded-full text-[9px]`}>{st.label}</Badge>
                      </div>
                      {deal.stage_name && <p className="text-[10px] text-gray-400 mt-0.5">Etapa: {deal.stage_name}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-white">{formatCurrency(deal.value || 0)}</div>
                      {deal.expected_close_date && (
                        <p className="text-[10px] text-gray-400">
                          Cierre: {new Date(deal.expected_close_date).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actividades */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" /> Actividades
            </h3>
          </div>

          {/* Type filters */}
          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'call', label: 'Llamar' },
              { id: 'meeting', label: 'Visitar' },
              { id: 'email', label: 'Email' },
              { id: 'task', label: 'Tarea' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActivityTypeFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  activityTypeFilter === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 border-b border-gray-700/30 pb-2">
            {[
              { id: 'all', label: `Todas` },
              { id: 'pending', label: `Pendiente (${pendingCount})` },
              { id: 'completed', label: `Completada (${completedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActivityStatusFilter(f.id)}
                className={`px-2.5 py-1 text-[10px] font-medium transition-colors border-b-2 ${
                  activityStatusFilter === f.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Activity list */}
          {filteredActivities.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">Sin actividades</p>
          ) : (
            <div className="space-y-1.5">
              {filteredActivities.map((act) => {
                const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
                  call: { icon: Phone, color: 'text-green-400' },
                  email: { icon: Mail, color: 'text-blue-400' },
                  meeting: { icon: Users, color: 'text-purple-400' },
                  task: { icon: CheckCircle2, color: 'text-amber-400' },
                  note: { icon: FileText, color: 'text-gray-400' },
                }
                const typeInfo = typeIcons[act.type] || typeIcons.task
                const Icon = typeInfo.icon
                return (
                  <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`mt-0.5 ${typeInfo.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">{act.subject || act.type}</span>
                        {act.is_completed && <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500">
                          {new Date(act.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {act.contact_name && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <User className="h-2.5 w-2.5" /> {act.contact_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {act.scheduled_at && !act.is_completed && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5 flex-shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(act.scheduled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pb-6">
        {editing ? (
          <>
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-400 hover:text-red-300 border-red-800 hover:border-red-600">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Helper component for info rows
function InfoRow({ icon: Icon, label, value, href, external }: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  href?: string
  external?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
        {value ? (
          href ? (
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="block text-sm text-blue-400 hover:text-blue-300 truncate"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm text-white">{value}</p>
          )
        ) : (
          <p className="text-sm text-gray-600">—</p>
        )}
      </div>
    </div>
  )
}
