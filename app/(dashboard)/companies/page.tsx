'use client'

import { useState, useEffect, useDeferredValue, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Plus, Globe, Users, X, Building2, TrendingUp,
  Mail, Phone, MapPin, User, Briefcase, DollarSign,
  Calendar, ChevronRight, PhoneCall, PlusCircle, Loader2, Pencil, Trash2,
  Link2, Unlink, Linkedin, CheckCircle, Hash
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, createCompany } from '@/lib/actions/companies'
import { getDeals } from '@/lib/actions/deals'
import { useCachedData } from '@/lib/hooks/use-cached-data'
import { useAllCompanies } from '@/lib/hooks/use-shared-data'
import { CompanyDetailModal, FORMA_PAGO_CUSTOM_SENTINEL, getFormaPagoOptions } from '@/components/company-detail-modal'
import { toast } from 'sonner'

export default function CompaniesPage() {
  const { workspaceId, loading: wsLoading, userEmail, workspaceName } = useWorkspace()
  const FORMA_PAGO_OPTIONS = getFormaPagoOptions({ userEmail, workspaceName })

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'activo' | 'potencial' | 'inactivo' | 'sin_clasificar'>('todos')
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [newCompany, setNewCompany] = useState({
    // ¿Dónde va? — obligatorio
    account_type: '' as '' | 'lead' | 'customer',
    // Solo aplica cuando account_type='customer': activo o inactivo
    customer_status: 'active' as 'active' | 'inactive',
    // Datos básicos
    name: '',
    vat_number: '',
    codigo_cliente: '',
    // Información adicional (opcional)
    industry: '',
    company_size: '',
    website: '',
    linkedin_url: '',
    annual_revenue: '',
    // Dirección
    street: '',
    city: '',
    postal_code: '',
    province: '',
    // Personas de contacto
    contacto: '',
    contacto_2: '',
    contacto_3: '',
    // Teléfonos
    phone: '',
    telefono_2: '',
    telefono_3: '',
    // Emails
    email: '',
    email_2: '',
    email_3: '',
    email_4: '',
    email_5: '',
    // Facturación (clientes)
    ultima_compra: '',
    forma_pago: '',
    dia_cobro: '',
    // Notas
    description: '',
  })

  // Cached data - loads instantly if cached
  // SHARED dataset (mismo que usan /clients, /metrics, /leads, /companies, etc.).
  const { data: companies, loading: companiesLoading, refetch: refetchCompanies } = useAllCompanies()

  const { data: allDeals } = useCachedData<any[]>(
    `deals-${workspaceId}`,
    () => getDeals(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId, staleTime: 60000 }
  )

  // Overall loading - only block if no cached data
  const loading = wsLoading || (companiesLoading && !companies)

  const deferredCompanySearch = useDeferredValue(searchQuery)

  // Status calculation per company: same rule as the badge in the card.
  const getCompanyStatus = (c: any): 'activo' | 'potencial' | 'inactivo' | 'sin_clasificar' => {
    const type = c.account_type
    const manual = c.custom_fields?.manual_status
    if (type === 'lead') return 'potencial'
    if (type === 'customer') return manual === 'inactive' ? 'inactivo' : 'activo'
    return 'sin_clasificar'
  }

  const allCompanies = companies || []

  // Counts in one pass instead of 4 full scans
  const statusCounts = useMemo(() => {
    const counts = { todos: allCompanies.length, activo: 0, potencial: 0, inactivo: 0, sin_clasificar: 0 }
    for (const c of allCompanies) counts[getCompanyStatus(c)]++
    return counts
  }, [allCompanies])

  const filteredCompanies = useMemo(() => {
    const query = deferredCompanySearch.toLowerCase()
    return allCompanies.filter(company => {
      const matchesSearch = (
        company.name?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query)
      )
      const matchesStatus = filterStatus === 'todos' || getCompanyStatus(company) === filterStatus
      return matchesSearch && matchesStatus
    }).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es'))
  }, [allCompanies, deferredCompanySearch, filterStatus])

  const resetNewCompanyForm = () => {
    setNewCompany({
      account_type: '',
      customer_status: 'active',
      name: '', vat_number: '', codigo_cliente: '',
      industry: '', company_size: '', website: '', linkedin_url: '', annual_revenue: '',
      street: '', city: '', postal_code: '', province: '',
      contacto: '', contacto_2: '', contacto_3: '',
      phone: '', telefono_2: '', telefono_3: '',
      email: '', email_2: '', email_3: '', email_4: '', email_5: '',
      ultima_compra: '', forma_pago: '', dia_cobro: '',
      description: '',
    })
  }

  const handleCreateCompany = async () => {
    if (!workspaceId) return
    if (!newCompany.account_type) {
      toast.error('Tienes que elegir si va a Clientes Potenciales o a Clientes.')
      return
    }

    // Only keep custom fields with actual values
    const cf: Record<string, any> = {}
    if (newCompany.codigo_cliente) cf.codigo_cliente = newCompany.codigo_cliente
    if (newCompany.contacto) cf.contacto = newCompany.contacto
    if (newCompany.contacto_2) cf.contacto_2 = newCompany.contacto_2
    if (newCompany.contacto_3) cf.contacto_3 = newCompany.contacto_3
    if (newCompany.telefono_2) cf.telefono_2 = newCompany.telefono_2
    if (newCompany.telefono_3) cf.telefono_3 = newCompany.telefono_3
    if (newCompany.email_2) cf.email_2 = newCompany.email_2
    if (newCompany.email_3) cf.email_3 = newCompany.email_3
    if (newCompany.email_4) cf.email_4 = newCompany.email_4
    if (newCompany.email_5) cf.email_5 = newCompany.email_5
    if (newCompany.ultima_compra) cf.ultima_compra = newCompany.ultima_compra
    if (newCompany.forma_pago) cf.forma_pago = newCompany.forma_pago
    if (newCompany.dia_cobro) cf.dia_cobro = newCompany.dia_cobro
    // Si es Cliente y el usuario marcó "Inactivo", se guarda el estado manual
    if (newCompany.account_type === 'customer' && newCompany.customer_status === 'inactive') {
      cf.manual_status = 'inactive'
    }

    const result = await createCompany(workspaceId, {
      name: newCompany.name,
      vat_number: newCompany.vat_number || undefined,
      email: newCompany.email || undefined,
      phone: newCompany.phone || undefined,
      description: newCompany.description || undefined,
      industry: newCompany.industry || undefined,
      company_size: newCompany.company_size || undefined,
      website: newCompany.website || undefined,
      linkedin_url: newCompany.linkedin_url || undefined,
      annual_revenue: newCompany.annual_revenue ? parseFloat(newCompany.annual_revenue) : undefined,
      account_type: newCompany.account_type,
      billing_address: {
        street: newCompany.street || undefined,
        city: newCompany.city || undefined,
        postal_code: newCompany.postal_code || undefined,
        state: newCompany.province || undefined,
        country: 'España',
      },
      custom_fields: cf,
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(
      newCompany.account_type === 'lead'
        ? 'Empresa creada en Clientes Potenciales.'
        : newCompany.customer_status === 'inactive'
          ? 'Empresa creada en Clientes Inactivos.'
          : 'Empresa creada en Clientes Activos.'
    )
    refetchCompanies()
    setShowNewCompanyModal(false)
    resetNewCompanyForm()
  }

  // Helper to get contact count from Supabase aggregation
  const getContactCount = (company: any) => {
    if (company.contacts && Array.isArray(company.contacts) && company.contacts.length > 0) {
      return company.contacts[0]?.count ?? 0
    }
    return 0
  }

  // Helper to get deals for a company from allDeals
  const getCompanyDeals = (companyId: string) => {
    return (allDeals || []).filter((d: any) => d.company_id === companyId)
  }

  if (wsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Empresas</h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">{filteredCompanies.length} empresas totales</p>
        </div>
        <Button onClick={() => setShowNewCompanyModal(true)} className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nueva Empresa
        </Button>
      </div>

      {/* Search + filtro por status */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input placeholder="Buscar por nombre o industria..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'todos',          label: 'Todas',             count: statusCounts.todos,          cls: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' },
              { key: 'activo',         label: 'Cliente Activo',    count: statusCounts.activo,         cls: 'bg-green-600 text-white' },
              { key: 'potencial',      label: 'Cliente Potencial', count: statusCounts.potencial,      cls: 'bg-yellow-500 text-white' },
              { key: 'inactivo',       label: 'Cliente Inactivo',  count: statusCounts.inactivo,       cls: 'bg-amber-600 text-white' },
              { key: 'sin_clasificar', label: 'Sin clasificar',    count: statusCounts.sin_clasificar, cls: 'bg-gray-500 text-white' },
            ] as const).map(({ key, label, count, cls }) => {
              const active = filterStatus === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${active ? cls + ' shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
                >
                  {label}
                  <span className={`px-1.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredCompanies.map((company) => {
          const contactCount = getContactCount(company)
          const deals = getCompanyDeals(company.id)
          const totalDealValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)

          // Status badge: refleja dónde vive la empresa en el CRM
          const accountType = company.account_type
          const manualStatus = company.custom_fields?.manual_status
          let statusBadge: { label: string; className: string }
          if (accountType === 'lead') {
            statusBadge = { label: 'Cliente Potencial', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
          } else if (accountType === 'customer' && manualStatus === 'inactive') {
            statusBadge = { label: 'Cliente Inactivo', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
          } else if (accountType === 'customer') {
            statusBadge = { label: 'Cliente Activo', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
          } else {
            statusBadge = { label: 'Sin clasificar', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
          }

          return (
            <Card key={company.id} className="hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => setSelectedCompany(company)}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{company.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={`text-[10px] rounded-full ${statusBadge.className}`}>{statusBadge.label}</Badge>
                      {company.industry && (
                        <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">{company.industry}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                    {company.name[0]}
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.company_size && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Users className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span>{company.company_size} empleados</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3.5 w-3.5" />
                    <span>{contactCount} contacto{contactCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
                  </div>
                  {totalDealValue > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{formatCurrency(totalDealValue)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  {company.website && (
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}>
                      <Globe className="h-3 w-3" /> {company.website}
                    </a>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ml-auto">
                    Ver detalle <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredCompanies.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron empresas</p>
        </div>
      )}

      {/* Modal Nueva Empresa - Completo */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewCompanyModal(false)}>
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Nueva Empresa</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowNewCompanyModal(false); resetNewCompanyForm() }} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

              {/* SECCIÓN 1: ¿DÓNDE VA? */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> ¿Dónde se guarda? *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCompany({ ...newCompany, account_type: 'lead' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      newCompany.account_type === 'lead'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 bg-white dark:bg-gray-800/40'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" /> Cliente Potencial
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aparecerá en la sección "Clientes Potenciales".</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCompany({ ...newCompany, account_type: 'customer' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      newCompany.account_type === 'customer'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 bg-white dark:bg-gray-800/40'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Cliente
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aparecerá en Clientes (Activos o Inactivos).</p>
                  </button>
                </div>

                {/* Sub-opción: solo cuando se ha elegido "Cliente" */}
                {newCompany.account_type === 'customer' && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">¿En qué sección de Clientes lo guardamos?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCompany({ ...newCompany, customer_status: 'active' })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          newCompany.customer_status === 'active'
                            ? 'border-green-500 bg-green-100/60 dark:bg-green-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 bg-white dark:bg-gray-900/40'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> Cliente Activo
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">Cliente que te compra ahora.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCompany({ ...newCompany, customer_status: 'inactive' })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          newCompany.customer_status === 'inactive'
                            ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 bg-white dark:bg-gray-900/40'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Cliente Inactivo
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">Cliente histórico que ahora no compra.</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: DATOS BÁSICOS */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Datos Básicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Nombre de la Empresa *</label>
                    <Input value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Acme, S.L." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">CIF/NIF</label>
                    <Input value={newCompany.vat_number} onChange={(e) => setNewCompany({...newCompany, vat_number: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="B12345678" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Código Cliente</label>
                    <Input value={newCompany.codigo_cliente} onChange={(e) => setNewCompany({...newCompany, codigo_cliente: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="CLI-00123" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2.5: INFORMACIÓN ADICIONAL (todos opcionales) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Información adicional <span className="text-[10px] normal-case text-gray-400 font-normal">(opcional)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Sector / Industria</label>
                    <Input value={newCompany.industry} onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Cerrajería, carpintería metálica..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Tamaño (empleados)</label>
                    <select value={newCompany.company_size} onChange={(e) => setNewCompany({...newCompany, company_size: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="">Sin especificar</option>
                      <option value="1-10">1-10 empleados</option>
                      <option value="11-50">11-50 empleados</option>
                      <option value="51-200">51-200 empleados</option>
                      <option value="201-500">201-500 empleados</option>
                      <option value="501+">501+ empleados</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Sitio Web</label>
                    <Input value={newCompany.website} onChange={(e) => setNewCompany({...newCompany, website: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="www.ejemplo.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">LinkedIn</label>
                    <Input value={newCompany.linkedin_url} onChange={(e) => setNewCompany({...newCompany, linkedin_url: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="linkedin.com/company/..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Facturación Anual (€)</label>
                    <Input type="number" value={newCompany.annual_revenue} onChange={(e) => setNewCompany({...newCompany, annual_revenue: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Estimación aproximada" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: DIRECCIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Dirección
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Calle y número</label>
                    <Input value={newCompany.street} onChange={(e) => setNewCompany({...newCompany, street: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Calle Mayor, 123" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Ciudad</label>
                    <Input value={newCompany.city} onChange={(e) => setNewCompany({...newCompany, city: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Barcelona" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Código Postal</label>
                    <Input value={newCompany.postal_code} onChange={(e) => setNewCompany({...newCompany, postal_code: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="08001" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Provincia</label>
                    <Input value={newCompany.province} onChange={(e) => setNewCompany({...newCompany, province: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Barcelona" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: CONTACTOS (nombres, teléfonos, emails) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" /> Contactos, Teléfonos y Emails
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Persona de Contacto</label>
                    <Input value={newCompany.contacto} onChange={(e) => setNewCompany({...newCompany, contacto: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Nombre y apellido" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Teléfono</label>
                    <Input value={newCompany.phone} onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 900 000 000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Persona de Contacto 2</label>
                    <Input value={newCompany.contacto_2} onChange={(e) => setNewCompany({...newCompany, contacto_2: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Teléfono 2</label>
                    <Input value={newCompany.telefono_2} onChange={(e) => setNewCompany({...newCompany, telefono_2: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Persona de Contacto 3</label>
                    <Input value={newCompany.contacto_3} onChange={(e) => setNewCompany({...newCompany, contacto_3: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Teléfono 3</label>
                    <Input value={newCompany.telefono_3} onChange={(e) => setNewCompany({...newCompany, telefono_3: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email</label>
                    <Input type="email" value={newCompany.email} onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="info@empresa.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email 2</label>
                    <Input type="email" value={newCompany.email_2} onChange={(e) => setNewCompany({...newCompany, email_2: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email 3</label>
                    <Input type="email" value={newCompany.email_3} onChange={(e) => setNewCompany({...newCompany, email_3: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email 4</label>
                    <Input type="email" value={newCompany.email_4} onChange={(e) => setNewCompany({...newCompany, email_4: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email 5</label>
                    <Input type="email" value={newCompany.email_5} onChange={(e) => setNewCompany({...newCompany, email_5: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: FACTURACIÓN (solo útil para Clientes) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Facturación {newCompany.account_type === 'lead' && <span className="text-[10px] normal-case text-gray-400 font-normal">(opcional — aplica cuando es Cliente)</span>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Forma de Pago</label>
                    {(() => {
                      const isCustom = newCompany.forma_pago !== '' && !FORMA_PAGO_OPTIONS.includes(newCompany.forma_pago)
                      return (
                        <>
                          <select
                            value={isCustom ? FORMA_PAGO_CUSTOM_SENTINEL : newCompany.forma_pago}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v === FORMA_PAGO_CUSTOM_SENTINEL) setNewCompany({ ...newCompany, forma_pago: ' ' })
                              else setNewCompany({ ...newCompany, forma_pago: v })
                            }}
                            className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Seleccionar forma de pago</option>
                            {FORMA_PAGO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            <option value={FORMA_PAGO_CUSTOM_SENTINEL}>⚙️ Personalizar...</option>
                          </select>
                          {isCustom && (
                            <Input
                              autoFocus
                              value={newCompany.forma_pago === ' ' ? '' : newCompany.forma_pago}
                              onChange={(e) => setNewCompany({ ...newCompany, forma_pago: e.target.value })}
                              placeholder="Escribe la forma de pago concreta"
                              className="mt-2 rounded-xl dark:bg-gray-800/50 dark:border-indigo-600 dark:text-white"
                            />
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Día de Cobro</label>
                    <Input type="number" min={1} max={31} value={newCompany.dia_cobro} onChange={(e) => setNewCompany({...newCompany, dia_cobro: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Día del mes (1-31)" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Última Compra (fecha)</label>
                    <Input type="date" value={newCompany.ultima_compra} onChange={(e) => setNewCompany({...newCompany, ultima_compra: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: DESCRIPCIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Notas
                </h3>
                <textarea value={newCompany.description} onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                  className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white resize-none h-24"
                  placeholder="Notas internas, contexto, observaciones..." />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                <Button onClick={handleCreateCompany} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newCompany.name || !newCompany.account_type}>
                  Crear Empresa
                </Button>
                <Button variant="outline" onClick={() => { setShowNewCompanyModal(false); resetNewCompanyForm() }}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                  Cancelar
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalles Empresa (componente compartido) */}
      {selectedCompany && (
        <CompanyDetailModal
          companyId={selectedCompany.id}
          onClose={() => setSelectedCompany(null)}
          onChanged={() => refetchCompanies()}
          accentColor="blue"
          defaultBadge={{ label: 'Empresa', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }}
        />
      )}


    </div>
  )
}
