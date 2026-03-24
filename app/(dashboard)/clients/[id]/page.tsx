'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft, Building2, Phone, Mail, Globe, MapPin, FileText,
  Users, TrendingUp, Calendar, Clock, ChevronRight, Pencil, Save, X,
  User, Briefcase, CreditCard, MessageSquare, ShoppingCart, Hash,
  Star, ExternalLink, Loader2, CheckCircle2, AlertCircle, CircleDot
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getClientDetail, type ClientDetail } from '@/lib/actions/client-detail'
import { updateCompany } from '@/lib/actions/companies'

type TabId = 'cliente' | 'financieros' | 'comunicacion' | 'comerciales' | 'contactos' | 'actividad'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'cliente', label: 'Cliente', icon: Building2 },
  { id: 'contactos', label: 'Personas de Contacto', icon: Users },
  { id: 'comerciales', label: 'Comerciales', icon: ShoppingCart },
  { id: 'financieros', label: 'Financieros', icon: CreditCard },
  { id: 'comunicacion', label: 'Comunicacion', icon: MessageSquare },
  { id: 'actividad', label: 'Actividad', icon: Calendar },
]

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('cliente')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, any>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await getClientDetail(clientId)
      if (error) setError(error)
      else setClient(data)
      setLoading(false)
    }
    if (clientId) load()
  }, [clientId])

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
      shipping_street: client.shipping_address?.street || '',
      shipping_city: client.shipping_address?.city || '',
      shipping_postal_code: client.shipping_address?.postal_code || '',
      shipping_state: client.shipping_address?.state || '',
      shipping_country: client.shipping_address?.country || '',
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
      shipping_address: {
        street: editForm.shipping_street || undefined,
        city: editForm.shipping_city || undefined,
        postal_code: editForm.shipping_postal_code || undefined,
        state: editForm.shipping_state || undefined,
        country: editForm.shipping_country || undefined,
      },
    }

    const { error } = await updateCompany(client.id, input)
    if (!error) {
      const { data } = await getClientDetail(clientId)
      if (data) setClient(data)
      setEditing(false)
    }
    setSaving(false)
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

  // Custom fields from import (contacto, telefono_2, email_2, forma_pago, codigo_cliente, ultima_compra)
  const cf = client.custom_fields || {}

  return (
    <div className="space-y-4">
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
                {client.vat_number && (
                  <span className="text-xs text-gray-400">CIF/NIF: {client.vat_number}</span>
                )}
                {cf.codigo_cliente && (
                  <span className="text-xs text-gray-400">Cod: {cf.codigo_cliente}</span>
                )}
                {client.industry && (
                  <span className="text-xs text-gray-400">{client.industry}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
            <Button size="sm" variant="outline" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
              <div className="text-lg font-bold text-white">{client.deals.length}</div>
              <div className="text-[10px] text-gray-400">Oportunidades</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-purple-400" />
            <div>
              <div className="text-lg font-bold text-white">{formatCurrency(client.deals.reduce((s, d) => s + (d.value || 0), 0))}</div>
              <div className="text-[10px] text-gray-400">Valor total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-lg font-bold text-white">{client.recent_activities.length}</div>
              <div className="text-[10px] text-gray-400">Actividades</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-700/30">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'cliente' && <TabCliente client={client} editing={editing} editForm={editForm} setEditForm={setEditForm} cf={cf} />}
        {activeTab === 'contactos' && <TabContactos contacts={client.contacts} />}
        {activeTab === 'comerciales' && <TabComerciales deals={client.deals} cf={cf} />}
        {activeTab === 'financieros' && <TabFinancieros client={client} cf={cf} />}
        {activeTab === 'comunicacion' && <TabComunicacion client={client} cf={cf} />}
        {activeTab === 'actividad' && <TabActividad activities={client.recent_activities} />}
      </div>
    </div>
  )
}

// ==========================================
// TAB: Cliente (datos generales - ERP style)
// ==========================================
function TabCliente({ client, editing, editForm, setEditForm, cf }: {
  client: ClientDetail
  editing: boolean
  editForm: Record<string, any>
  setEditForm: (v: Record<string, any>) => void
  cf: Record<string, string>
}) {
  const Field = ({ label, value, editKey, type = 'text' }: { label: string; value: string | null | undefined; editKey?: string; type?: string }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      {editing && editKey ? (
        <Input
          type={type}
          value={editForm[editKey] || ''}
          onChange={(e) => setEditForm({ ...editForm, [editKey]: e.target.value })}
          className="h-8 text-sm bg-white/5 border-gray-600"
        />
      ) : (
        <p className="text-sm text-white min-h-[32px] flex items-center">{value || <span className="text-gray-500">—</span>}</p>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Datos Principales */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" /> Datos Generales
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Codigo" value={cf.codigo_cliente} />
            <Field label="CIF / NIF" value={client.vat_number} editKey="vat_number" />
            <div className="col-span-2">
              <Field label="Razon Social" value={client.name} editKey="name" />
            </div>
            <Field label="Nombre Comercial" value={cf.nombre_comercial || client.name} />
            <Field label="Sector / Industria" value={client.industry} editKey="industry" />
            <Field label="Tamano empresa" value={client.company_size} editKey="company_size" />
            <Field label="Empleados" value={client.employees_exact?.toString()} editKey="employees_exact" type="number" />
            <Field label="Ano fundacion" value={client.founded_year?.toString()} editKey="founded_year" type="number" />
            <Field label="Tipo de cuenta" value={client.account_type} editKey="account_type" />
          </div>
        </CardContent>
      </Card>

      {/* Direccion Fiscal */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-400" /> Direccion Fiscal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Direccion" value={client.billing_address?.street} editKey="billing_street" />
            </div>
            <Field label="Poblacion" value={client.billing_address?.city} editKey="billing_city" />
            <Field label="C. Postal" value={client.billing_address?.postal_code} editKey="billing_postal_code" />
            <Field label="Provincia" value={client.billing_address?.state} editKey="billing_state" />
            <Field label="Pais" value={client.billing_address?.country || 'Espana'} editKey="billing_country" />
          </div>

          <h3 className="text-sm font-semibold text-white flex items-center gap-2 pt-3 border-t border-gray-700/30">
            <MapPin className="h-4 w-4 text-amber-400" /> Direccion de Envio
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Direccion" value={client.shipping_address?.street} editKey="shipping_street" />
            </div>
            <Field label="Poblacion" value={client.shipping_address?.city} editKey="shipping_city" />
            <Field label="C. Postal" value={client.shipping_address?.postal_code} editKey="shipping_postal_code" />
            <Field label="Provincia" value={client.shipping_address?.state} editKey="shipping_state" />
            <Field label="Pais" value={client.shipping_address?.country} editKey="shipping_country" />
          </div>
        </CardContent>
      </Card>

      {/* Contacto Rapido */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Phone className="h-4 w-4 text-purple-400" /> Datos de Contacto
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefono" value={client.phone} editKey="phone" />
            <Field label="Telefono 2" value={cf.telefono_2} />
            <Field label="E-Mail" value={client.email} editKey="email" />
            <Field label="E-Mail 2" value={cf.email_2} />
            <Field label="Sitio Web" value={client.website} editKey="website" />
            <Field label="LinkedIn" value={client.linkedin_url} editKey="linkedin_url" />
          </div>
        </CardContent>
      </Card>

      {/* Campos Personalizados */}
      {Object.keys(cf).length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" /> Campos Adicionales
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(cf)
                .filter(([k]) => !['codigo_cliente', 'telefono_2', 'email_2', 'forma_pago', 'nombre_comercial', 'contacto'].includes(k))
                .map(([key, value]) => (
                  <Field key={key} label={key.replace(/_/g, ' ')} value={value} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descripcion */}
      {(client.description || editing) && (
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" /> Descripcion / Notas
            </h3>
            {editing ? (
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full h-24 text-sm bg-white/5 border border-gray-600 rounded-lg p-3 text-white resize-none"
              />
            ) : (
              <p className="text-sm text-gray-300">{client.description || 'Sin descripcion'}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==========================================
// TAB: Personas de Contacto
// ==========================================
function TabContactos({ contacts }: { contacts: ClientDetail['contacts'] }) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No hay personas de contacto asociadas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {contacts.map((contact) => (
        <Card key={contact.id} className="hover:border-blue-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
                  <p className="text-xs text-gray-400">{contact.job_title}{contact.department ? ` - ${contact.department}` : ''}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                      <Phone className="h-3 w-3" /> {contact.phone}
                    </a>
                  )}
                  {contact.mobile && (
                    <a href={`tel:${contact.mobile}`} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                      <Phone className="h-3 w-3" /> {contact.mobile}
                    </a>
                  )}
                </div>
                {contact.notes && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{contact.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ==========================================
// TAB: Comerciales (Oportunidades/Deals)
// ==========================================
function TabComerciales({ deals, cf }: { deals: ClientDetail['deals']; cf: Record<string, string> }) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    open: { label: 'Abierta', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    won: { label: 'Ganada', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    lost: { label: 'Perdida', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }

  return (
    <div className="space-y-4">
      {/* Info from custom fields */}
      {(cf.ultima_compra || cf.forma_pago) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-6">
              {cf.ultima_compra && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Ultima Compra</span>
                  <p className="text-sm text-white mt-0.5">{cf.ultima_compra}</p>
                </div>
              )}
              {cf.forma_pago && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Forma de Pago</span>
                  <p className="text-sm text-white mt-0.5">{cf.forma_pago}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {deals.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No hay oportunidades comerciales</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map((deal) => (
            <Card key={deal.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">{deal.name}</h4>
                    <Badge className={`${statusLabels[deal.status]?.color || 'bg-gray-100 text-gray-700'} rounded-full text-[10px]`}>
                      {statusLabels[deal.status]?.label || deal.status}
                    </Badge>
                  </div>
                  {deal.stage_name && <p className="text-xs text-gray-400 mt-0.5">Etapa: {deal.stage_name}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white">{formatCurrency(deal.value || 0)}</div>
                  {deal.expected_close_date && (
                    <p className="text-[10px] text-gray-400">
                      Cierre: {new Date(deal.expected_close_date).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// TAB: Financieros
// ==========================================
function TabFinancieros({ client, cf }: { client: ClientDetail; cf: Record<string, string> }) {
  const totalDeals = client.deals.reduce((s, d) => s + (d.value || 0), 0)
  const wonDeals = client.deals.filter(d => d.status === 'won')
  const totalWon = wonDeals.reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div className="space-y-4">
      {/* Resumen Financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-white">{formatCurrency(totalDeals)}</div>
            <div className="text-[10px] text-gray-400">Pipeline Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-green-400">{formatCurrency(totalWon)}</div>
            <div className="text-[10px] text-gray-400">Ganado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-white">{formatCurrency(client.annual_revenue || 0)}</div>
            <div className="text-[10px] text-gray-400">Facturacion Anual</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-white">{wonDeals.length}</div>
            <div className="text-[10px] text-gray-400">Deals Cerrados</div>
          </CardContent>
        </Card>
      </div>

      {/* Datos financieros de custom fields */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-purple-400" /> Datos Financieros
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Forma de Pago</span>
              <p className="text-sm text-white mt-0.5">{cf.forma_pago || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Ultima Compra</span>
              <p className="text-sm text-white mt-0.5">{cf.ultima_compra || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Codigo Cliente</span>
              <p className="text-sm text-white mt-0.5">{cf.codigo_cliente || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">CIF/NIF</span>
              <p className="text-sm text-white mt-0.5">{client.vat_number || '—'}</p>
            </div>
          </div>
          {/* Cuentas contables placeholder - from ERP */}
          <div className="pt-3 border-t border-gray-700/30">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Cuentas Contables</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Cuenta Cliente</span>
                <p className="text-sm text-white mt-0.5">{cf.cuenta_cliente || cf.cuenta_contable || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Cuenta Proveedor</span>
                <p className="text-sm text-white mt-0.5">{cf.cuenta_proveedor || '—'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// TAB: Comunicacion
// ==========================================
function TabComunicacion({ client, cf }: { client: ClientDetail; cf: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-400" /> Telefonos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Telefono Principal</span>
              {client.phone ? (
                <a href={`tel:${client.phone}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {client.phone}
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">—</p>
              )}
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Telefono 2</span>
              {cf.telefono_2 ? (
                <a href={`tel:${cf.telefono_2}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {cf.telefono_2}
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">—</p>
              )}
            </div>
            {cf.fax && (
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Fax</span>
                <p className="text-sm text-white mt-0.5">{cf.fax}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-400" /> E-Mail
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">E-Mail Principal</span>
              {client.email ? (
                <a href={`mailto:${client.email}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> {client.email}
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">—</p>
              )}
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">E-Mail 2</span>
              {cf.email_2 ? (
                <a href={`mailto:${cf.email_2}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> {cf.email_2}
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" /> Web y Redes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Sitio Web</span>
              {client.website ? (
                <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                  <ExternalLink className="h-3 w-3" /> {client.website}
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">—</p>
              )}
            </div>
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">LinkedIn</span>
              {client.linkedin_url ? (
                <a href={client.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5">
                  <ExternalLink className="h-3 w-3" /> Ver perfil
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persona de contacto principal */}
      {cf.contacto && (
        <Card>
          <CardContent className="p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-amber-400" /> Persona de Contacto Principal
            </h3>
            <p className="text-sm text-white">{cf.contacto}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==========================================
// TAB: Actividad
// ==========================================
function TabActividad({ activities }: { activities: ClientDetail['recent_activities'] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No hay actividades registradas</p>
      </div>
    )
  }

  const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
    call: { icon: Phone, color: 'text-green-400' },
    email: { icon: Mail, color: 'text-blue-400' },
    meeting: { icon: Users, color: 'text-purple-400' },
    task: { icon: CheckCircle2, color: 'text-amber-400' },
    note: { icon: FileText, color: 'text-gray-400' },
  }

  return (
    <div className="space-y-2">
      {activities.map((act) => {
        const typeInfo = typeIcons[act.type] || typeIcons.task
        const Icon = typeInfo.icon
        return (
          <Card key={act.id}>
            <CardContent className="p-3 flex items-start gap-3">
              <div className={`mt-0.5 ${typeInfo.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-white truncate">{act.subject || act.type}</h4>
                  {act.is_completed && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {new Date(act.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {act.contact_name && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <User className="h-2.5 w-2.5" /> {act.contact_name}
                    </span>
                  )}
                </div>
                {act.notes && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{act.notes}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {act.scheduled_at && !act.is_completed && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(act.scheduled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
