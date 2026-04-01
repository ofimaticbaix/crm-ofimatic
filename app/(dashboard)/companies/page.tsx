'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Plus, Globe, Users, X, Building2, TrendingUp,
  Mail, Phone, MapPin, User, Briefcase, DollarSign,
  Calendar, ChevronRight, PhoneCall, PlusCircle, Loader2, Pencil, Trash2,
  Link2, Unlink
} from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } from '@/lib/actions/companies'
import { getDeals } from '@/lib/actions/deals'
import { getActivities, createActivity } from '@/lib/actions/activities'
import { getContacts, createContact } from '@/lib/actions/contacts'
import { useCachedData } from '@/lib/hooks/use-cached-data'
import { linkContactToCompany, unlinkContactFromCompany } from '@/lib/actions/client-detail'

export default function CompaniesPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [followUpFilter, setFollowUpFilter] = useState<'todos' | 'llamar' | 'visitar'>('todos')
  const [showNewActivityModal, setShowNewActivityModal] = useState(false)
  const [newActivity, setNewActivity] = useState({
    type: 'call',
    subject: '',
    contactId: '',
    followUpType: '',
    date: '',
    time: '',
    notes: ''
  })
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const [inlineEditData, setInlineEditData] = useState<any>(null)
  const [inlineSaving, setInlineSaving] = useState(false)
  const [showNewContactInline, setShowNewContactInline] = useState(false)
  const [newContactInline, setNewContactInline] = useState({ first_name: '', last_name: '', job_title: '', email: '', phone: '' })
  const [creatingContactInline, setCreatingContactInline] = useState(false)
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null)
  const [updatingCompany, setUpdatingCompany] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState(false)
  const [newCompany, setNewCompany] = useState({
    // Basic data
    name: '',
    vat_number: '',
    industry: '',
    company_size: '',
    website: '',
    email: '',
    phone: '',
    linkedin_url: '',
    description: '',
    // Address
    street: '',
    city: '',
    postal_code: '',
    province: '',
    country: 'España',
    // Classification
    account_type: 'prospect' as const,
    account_status: 'active' as const,
    canal: '',
    annual_revenue: '',
  })

  // Contact selector state
  const [allContacts, setAllContacts] = useState<any[]>([])
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [showInlineContactForm, setShowInlineContactForm] = useState(false)
  const [newInlineContact, setNewInlineContact] = useState({
    first_name: '', last_name: '', email: '', job_title: ''
  })
  const [creatingContact, setCreatingContact] = useState(false)

  // Cached data - loads instantly if cached
  const { data: companies, loading: companiesLoading, refetch: refetchCompanies } = useCachedData<any[]>(
    `companies-${workspaceId}`,
    () => getCompanies(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const { data: allDeals } = useCachedData<any[]>(
    `deals-${workspaceId}`,
    () => getDeals(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId, staleTime: 60000 }
  )

  // Overall loading - only block if no cached data
  const loading = wsLoading || (companiesLoading && !companies)

  // Detail modal data
  const [detailContacts, setDetailContacts] = useState<any[]>([])
  const [detailDeals, setDetailDeals] = useState<any[]>([])
  const [detailActivities, setDetailActivities] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Load detail data when a company is selected
  useEffect(() => {
    if (!selectedCompany || !workspaceId) return
    const loadDetail = async () => {
      setDetailLoading(true)
      const [companyRes, activitiesRes] = await Promise.all([
        getCompany(selectedCompany.id),
        getActivities(workspaceId, { companyId: selectedCompany.id }),
      ])
      if (companyRes.data?.contacts) setDetailContacts(companyRes.data.contacts)
      else setDetailContacts([])
      if (activitiesRes.data) setDetailActivities(activitiesRes.data)
      else setDetailActivities([])
      // Filter deals by company_id
      setDetailDeals((allDeals || []).filter((d: any) => d.company_id === selectedCompany.id))
      setDetailLoading(false)
    }
    loadDetail()
  }, [selectedCompany, workspaceId, allDeals])

  const filteredCompanies = (companies || []).filter(company => {
    const query = searchQuery.toLowerCase()
    return (
      company.name?.toLowerCase().includes(query) ||
      company.industry?.toLowerCase().includes(query)
    )
  }).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es'))

  // Load contacts when modal opens
  useEffect(() => {
    if (showNewCompanyModal && workspaceId) {
      getContacts(workspaceId).then(res => {
        if (res.data) setAllContacts(res.data)
      })
    }
  }, [showNewCompanyModal, workspaceId])

  // Filter contacts for dropdown
  const filteredContactsForDropdown = allContacts.filter(c => {
    if (!contactSearchQuery) return true
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    return fullName.includes(contactSearchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(contactSearchQuery.toLowerCase())
  }).filter(c => !selectedContacts.find(sc => sc.id === c.id)).slice(0, 5)

  const handleAddExistingContact = (contact: any) => {
    setSelectedContacts([...selectedContacts, contact])
    setContactSearchQuery('')
    setShowContactDropdown(false)
  }

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId))
  }

  const handleCreateInlineContact = async () => {
    if (!workspaceId) return
    setCreatingContact(true)
    const result = await createContact(workspaceId, {
      first_name: newInlineContact.first_name,
      last_name: newInlineContact.last_name,
      email: newInlineContact.email,
      job_title: newInlineContact.job_title,
    })
    setCreatingContact(false)
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    if (result.data) {
      setSelectedContacts([...selectedContacts, result.data])
      setAllContacts([result.data, ...allContacts])
    }
    setShowInlineContactForm(false)
    setNewInlineContact({ first_name: '', last_name: '', email: '', job_title: '' })
  }

  const resetNewCompanyForm = () => {
    setNewCompany({
      name: '', vat_number: '', industry: '', company_size: '', website: '', email: '', phone: '',
      linkedin_url: '', description: '', street: '', city: '', postal_code: '', province: '',
      country: 'España', account_type: 'prospect', account_status: 'active', canal: '', annual_revenue: '',
    })
    setSelectedContacts([])
    setContactSearchQuery('')
    setShowInlineContactForm(false)
  }

  const handleCreateCompany = async () => {
    if (!workspaceId) return
    const result = await createCompany(workspaceId, {
      name: newCompany.name,
      vat_number: newCompany.vat_number || undefined,
      industry: newCompany.industry || undefined,
      company_size: newCompany.company_size || undefined,
      website: newCompany.website || undefined,
      email: newCompany.email || undefined,
      phone: newCompany.phone || undefined,
      linkedin_url: newCompany.linkedin_url || undefined,
      description: newCompany.description || undefined,
      account_type: newCompany.account_type,
      account_status: newCompany.account_status,
      annual_revenue: newCompany.annual_revenue ? parseFloat(newCompany.annual_revenue) : undefined,
      billing_address: {
        street: newCompany.street || undefined,
        city: newCompany.city || undefined,
        postal_code: newCompany.postal_code || undefined,
        province: newCompany.province || undefined,
        country: newCompany.country || undefined,
      },
      custom_fields: {
        ...(newCompany.canal ? { canal: newCompany.canal } : {}),
      },
    })
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    // Update contacts to associate with this company
    if (result.data && selectedContacts.length > 0) {
      const { updateContact } = await import('@/lib/actions/contacts')
      for (const contact of selectedContacts) {
        await updateContact(contact.id, { company_id: result.data.id })
      }
    }
    // Reload companies
    refetchCompanies()
    setShowNewCompanyModal(false)
    resetNewCompanyForm()
  }

  const handleCreateActivity = async () => {
    if (!workspaceId || !selectedCompany) return
    const scheduledAt = newActivity.date && newActivity.time
      ? `${newActivity.date}T${newActivity.time}:00`
      : newActivity.date ? `${newActivity.date}T00:00:00` : undefined
    const result = await createActivity(workspaceId, {
      type: newActivity.type as any,
      subject: newActivity.subject || undefined,
      description: newActivity.notes || undefined,
      scheduled_at: scheduledAt,
      contact_id: newActivity.contactId || null,
      company_id: selectedCompany.id,
      metadata: newActivity.followUpType ? { follow_up_type: newActivity.followUpType } : undefined,
    })
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    // Reload activities for this company
    const activitiesRes = await getActivities(workspaceId, { companyId: selectedCompany.id })
    if (activitiesRes.data) setDetailActivities(activitiesRes.data)
    setShowNewActivityModal(false)
    setNewActivity({ type: 'call', subject: '', contactId: '', followUpType: '', date: '', time: '', notes: '' })
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return
    setUpdatingCompany(true)
    const result = await updateCompany(editingCompany.id, {
      name: editingCompany.name,
      vat_number: editingCompany.vat_number || undefined,
      industry: editingCompany.industry || undefined,
      company_size: editingCompany.company_size || undefined,
      website: editingCompany.website || undefined,
      email: editingCompany.email || undefined,
      phone: editingCompany.phone || undefined,
      linkedin_url: editingCompany.linkedin_url || undefined,
      description: editingCompany.description || undefined,
      billing_address: editingCompany.billing_address || undefined,
      account_type: editingCompany.account_type || undefined,
      account_status: editingCompany.account_status || undefined,
      annual_revenue: editingCompany.annual_revenue || undefined,
      custom_fields: editingCompany.custom_fields || undefined,
    })
    setUpdatingCompany(false)
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    setEditingCompany(null)
    refetchCompanies()
  }

  const handleDeleteCompany = async (id: string) => {
    setDeletingCompany(true)
    const result = await deleteCompany(id)
    setDeletingCompany(false)
    if (!result.error) {
      setDeletingCompanyId(null)
      setSelectedCompany(null)
      refetchCompanies()
    }
  }

  const getCanalLabel = (canal: string) => {
    const canales: Record<string, string> = {
      'web': 'Pagina Web', 'referido': 'Referido', 'email': 'Email Marketing',
      'social': 'Redes Sociales', 'llamada': 'Llamada Fria', 'evento': 'Evento/Feria',
      'publicidad': 'Publicidad Online', 'otro': 'Otro'
    }
    return canales[canal] || canal
  }

  const getLifecycleBadge = (lifecycle: string) => {
    const styles: Record<string, string> = {
      'customer': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'prospect': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'lead': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    }
    const labels: Record<string, string> = { 'customer': 'Cliente', 'prospect': 'Prospecto', 'lead': 'Lead' }
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[lifecycle] || ''}`}>
        {labels[lifecycle] || lifecycle}
      </span>
    )
  }

  const getDealStatusColor = (stage: any) => {
    if (!stage) return 'bg-gray-400'
    if (stage.is_closed_won) return 'bg-green-400'
    if (stage.is_closed_lost) return 'bg-red-400'
    const pos = stage.position || 0
    if (pos <= 1) return 'bg-gray-400'
    if (pos === 2) return 'bg-blue-400'
    if (pos === 3) return 'bg-yellow-400'
    return 'bg-orange-400'
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

  // Extract custom fields helpers
  const getCustomField = (company: any, field: string) => {
    return company.custom_fields?.[field] || ''
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

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input placeholder="Buscar por nombre o industria..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredCompanies.map((company) => {
          const contactCount = getContactCount(company)
          const deals = getCompanyDeals(company.id)
          const totalDealValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
          return (
            <Card key={company.id} className="hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => { setSelectedCompany(company); setFollowUpFilter('todos') }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{company.name}</h3>
                    {company.industry && (
                      <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">{company.industry}</Badge>
                    )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Nueva Empresa</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowNewCompanyModal(false); resetNewCompanyForm() }} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

              {/* SECCIÓN 1: DATOS BÁSICOS */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Datos Básicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Nombre de la Empresa *</label>
                    <Input value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Acme Corporation" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">CIF/NIF</label>
                    <Input value={newCompany.vat_number} onChange={(e) => setNewCompany({...newCompany, vat_number: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="B12345678" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Industria</label>
                    <Input value={newCompany.industry} onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Tecnología, Construcción, etc." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Tamaño (empleados)</label>
                    <select value={newCompany.company_size} onChange={(e) => setNewCompany({...newCompany, company_size: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="">Seleccionar tamaño</option>
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
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email</label>
                    <Input type="email" value={newCompany.email} onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="info@empresa.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Teléfono</label>
                    <Input value={newCompany.phone} onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 900 000 000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">LinkedIn</label>
                    <Input value={newCompany.linkedin_url} onChange={(e) => setNewCompany({...newCompany, linkedin_url: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="linkedin.com/company/..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Descripción</label>
                    <textarea value={newCompany.description} onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white resize-none h-20"
                      placeholder="Breve descripción de la empresa..." />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DIRECCIÓN */}
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
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">País</label>
                    <Input value={newCompany.country} onChange={(e) => setNewCompany({...newCompany, country: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="España" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: PERSONAS DE CONTACTO */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Personas de Contacto
                </h3>

                {/* Buscador de contactos existentes */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={contactSearchQuery}
                    onChange={(e) => { setContactSearchQuery(e.target.value); setShowContactDropdown(true) }}
                    onFocus={() => setShowContactDropdown(true)}
                    className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Buscar contacto existente..."
                  />
                  {showContactDropdown && contactSearchQuery && filteredContactsForDropdown.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filteredContactsForDropdown.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => handleAddExistingContact(contact)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {(contact.first_name?.[0] || '')}{(contact.last_name?.[0] || '')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.first_name} {contact.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contactos seleccionados */}
                {selectedContacts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contactos asociados:</p>
                    {selectedContacts.map(contact => (
                      <div key={contact.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                            {(contact.first_name?.[0] || '')}{(contact.last_name?.[0] || '')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.first_name} {contact.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{contact.job_title || contact.email}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveContact(contact.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón y formulario inline para nuevo contacto */}
                {!showInlineContactForm ? (
                  <Button variant="outline" size="sm" onClick={() => setShowInlineContactForm(true)} className="rounded-xl gap-2">
                    <PlusCircle className="h-4 w-4" /> Añadir nuevo contacto
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={newInlineContact.first_name}
                        onChange={(e) => setNewInlineContact({...newInlineContact, first_name: e.target.value})}
                        className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="Nombre *"
                      />
                      <Input
                        value={newInlineContact.last_name}
                        onChange={(e) => setNewInlineContact({...newInlineContact, last_name: e.target.value})}
                        className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="Apellidos *"
                      />
                      <Input
                        type="email"
                        value={newInlineContact.email}
                        onChange={(e) => setNewInlineContact({...newInlineContact, email: e.target.value})}
                        className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="Email *"
                      />
                      <Input
                        value={newInlineContact.job_title}
                        onChange={(e) => setNewInlineContact({...newInlineContact, job_title: e.target.value})}
                        className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="Cargo"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setShowInlineContactForm(false); setNewInlineContact({ first_name: '', last_name: '', email: '', job_title: '' }) }} className="rounded-xl text-sm">
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleCreateInlineContact} disabled={!newInlineContact.first_name || !newInlineContact.last_name || !newInlineContact.email || creatingContact} className="rounded-xl text-sm">
                        {creatingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Añadir'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 4: CLASIFICACIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Clasificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Tipo de Cuenta *</label>
                    <select value={newCompany.account_type} onChange={(e) => setNewCompany({...newCompany, account_type: e.target.value as any})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospecto</option>
                      <option value="customer">Cliente</option>
                      <option value="partner">Partner</option>
                      <option value="supplier">Proveedor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Estado *</label>
                    <select value={newCompany.account_status} onChange={(e) => setNewCompany({...newCompany, account_status: e.target.value as any})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="negotiating">En negociación</option>
                      <option value="churned">Perdido</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Canal de Captación</label>
                    <select value={newCompany.canal} onChange={(e) => setNewCompany({...newCompany, canal: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="">Seleccionar canal</option>
                      <option value="web">Página Web</option>
                      <option value="referido">Referido</option>
                      <option value="email">Email Marketing</option>
                      <option value="social">Redes Sociales</option>
                      <option value="llamada">Llamada Fría</option>
                      <option value="evento">Evento/Feria</option>
                      <option value="publicidad">Publicidad Online</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Facturación Anual (€)</label>
                    <Input type="number" value={newCompany.annual_revenue} onChange={(e) => setNewCompany({...newCompany, annual_revenue: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="100000" />
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                <Button onClick={handleCreateCompany} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newCompany.name}>
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

      {/* Modal Detalles Empresa */}
      {selectedCompany && (() => {
        const contacts = detailContacts
        const deals = detailDeals
        const activities = detailActivities
        const totalDealValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
        const openDeals = deals.filter((d: any) => d.status === 'open')

        // Filter activities by follow-up type stored in metadata
        const filteredActivities = followUpFilter === 'todos'
          ? activities
          : activities.filter((a: any) => a.metadata?.follow_up_type === followUpFilter)

        const pendingActivities = filteredActivities.filter((a: any) => !a.is_completed && !a.completed_at)
        const completedActivities = filteredActivities.filter((a: any) => a.is_completed || a.completed_at)
        const cancelledActivities: any[] = [] // Supabase activities don't have a cancelled status by default

        const typeIcons: Record<string, string> = {
          'call': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          'email': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          'meeting': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          'note': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
          'visit': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
          'task': 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
        }
        const typeLabels: Record<string, string> = {
          'call': 'Llamada', 'email': 'Email', 'meeting': 'Reunion', 'note': 'Nota', 'visit': 'Visita', 'task': 'Tarea',
        }

        const ActivityCard = ({ activity }: { activity: any }) => {
          const contact = activity.contacts
          return (
            <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-start gap-2 mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-medium flex-shrink-0 ${typeIcons[activity.type] || ''}`}>
                  {typeLabels[activity.type] || activity.type}
                </span>
                {activity.metadata?.follow_up_type && (
                  <Badge className="text-[10px] rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0">
                    {activity.metadata.follow_up_type === 'llamar' ? 'Llamar' : 'Visitar'}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.subject}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(activity.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las{' '}
                {new Date(activity.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {activity.outcome && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.outcome}</p>
              )}
              {activity.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.description}</p>
              )}
              {contact && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {contact.first_name} {contact.last_name}
                </p>
              )}
            </div>
          )
        }

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {selectedCompany.name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white text-xl">{selectedCompany.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedCompany.industry && (
                          <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">{selectedCompany.industry}</Badge>
                        )}
                        {selectedCompany.company_size && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{selectedCompany.company_size} empleados</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCompany(null); setIsInlineEditing(false); setInlineEditData(null) }} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{contacts.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contactos</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{openDeals.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deals Abiertos</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalDealValue)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    {/* Informacion de Contacto */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Informacion de Contacto
                        </h3>
                        {!isInlineEditing && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            const cf = selectedCompany.custom_fields || {}
                            setInlineEditData({
                              name: selectedCompany.name || '',
                              vat_number: selectedCompany.vat_number || '',
                              phone: selectedCompany.phone || '',
                              email: selectedCompany.email || '',
                              website: selectedCompany.website || '',
                              industry: selectedCompany.industry || '',
                              company_size: selectedCompany.company_size || '',
                              description: selectedCompany.description || '',
                              linkedin_url: selectedCompany.linkedin_url || '',
                              street: selectedCompany.billing_address?.street || '',
                              city: selectedCompany.billing_address?.city || '',
                              postal_code: selectedCompany.billing_address?.postal_code || '',
                              province: selectedCompany.billing_address?.state || '',
                              country: selectedCompany.billing_address?.country || 'España',
                              contacto: cf.contacto || '',
                              telefono_2: cf.telefono_2 || '',
                              ultima_compra: cf.ultima_compra || '',
                              forma_pago: cf.forma_pago || '',
                              email_2: cf.email_2 || '',
                              email_3: cf.email_3 || '',
                              email_4: cf.email_4 || '',
                              email_5: cf.email_5 || '',
                              account_type: selectedCompany.account_type || 'prospect',
                              account_status: selectedCompany.account_status || 'active',
                              annual_revenue: selectedCompany.annual_revenue || '',
                              canal: cf.canal || '',
                            })
                            setIsInlineEditing(true)
                          }} className="text-xs text-gray-400 hover:text-white">
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                          </Button>
                        )}
                      </div>
                      {(() => {
                        const cf = selectedCompany.custom_fields || {}
                        const ed = inlineEditData
                        const editing = isInlineEditing && ed

                        const InfoField = ({ icon: Icon, iconColor, label, value, href, external, editKey }: { icon: any; iconColor: string; label: string; value: string | null | undefined; href?: string; external?: boolean; editKey?: string }) => (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                            <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                              {editing && editKey ? (
                                <Input
                                  value={ed[editKey] || ''}
                                  onChange={(e) => setInlineEditData({ ...ed, [editKey]: e.target.value })}
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoField icon={Building2} iconColor="text-blue-500" label="Razon Social" value={selectedCompany.name} editKey="name" />
                            <InfoField icon={MapPin} iconColor="text-red-500" label="Direccion" value={selectedCompany.billing_address?.street} editKey="street" />
                            <InfoField icon={MapPin} iconColor="text-red-400" label="C.P." value={selectedCompany.billing_address?.postal_code} editKey="postal_code" />
                            <InfoField icon={MapPin} iconColor="text-orange-500" label="Poblacion" value={selectedCompany.billing_address?.city} editKey="city" />
                            <InfoField icon={MapPin} iconColor="text-amber-500" label="Provincia" value={selectedCompany.billing_address?.state} editKey="province" />
                            <InfoField icon={Building2} iconColor="text-purple-500" label="CIF/NIF" value={selectedCompany.vat_number} editKey="vat_number" />
                            <InfoField icon={User} iconColor="text-cyan-500" label="Persona de Contacto" value={cf.contacto} editKey="contacto" />
                            <InfoField icon={Phone} iconColor="text-green-500" label="Telefono" value={selectedCompany.phone} href={!editing && selectedCompany.phone ? `tel:${selectedCompany.phone}` : undefined} editKey="phone" />
                            <InfoField icon={Phone} iconColor="text-green-400" label="Movil" value={cf.telefono_2} href={!editing && cf.telefono_2 ? `tel:${cf.telefono_2}` : undefined} editKey="telefono_2" />
                            <InfoField icon={Calendar} iconColor="text-amber-500" label="F. Ultima Compra" value={cf.ultima_compra} editKey="ultima_compra" />
                            <InfoField icon={DollarSign} iconColor="text-green-500" label="Forma de Pago" value={cf.forma_pago} editKey="forma_pago" />
                            <InfoField icon={Mail} iconColor="text-blue-500" label="Email" value={selectedCompany.email} href={!editing && selectedCompany.email ? `mailto:${selectedCompany.email}` : undefined} editKey="email" />
                            <InfoField icon={Mail} iconColor="text-blue-400" label="Email 2" value={cf.email_2} href={!editing && cf.email_2 ? `mailto:${cf.email_2}` : undefined} editKey="email_2" />
                            <InfoField icon={Mail} iconColor="text-blue-300" label="Email 3" value={cf.email_3} href={!editing && cf.email_3 ? `mailto:${cf.email_3}` : undefined} editKey="email_3" />
                            <InfoField icon={Mail} iconColor="text-blue-300" label="Email 4" value={cf.email_4} editKey="email_4" />
                            <InfoField icon={Mail} iconColor="text-blue-300" label="Email 5" value={cf.email_5} editKey="email_5" />
                            <InfoField icon={Globe} iconColor="text-indigo-500" label="Sitio Web" value={selectedCompany.website}
                              href={!editing && selectedCompany.website ? (selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`) : undefined} external editKey="website" />
                            <InfoField icon={TrendingUp} iconColor="text-orange-500" label="Canal de Adquisicion" value={getCanalLabel(getCustomField(selectedCompany, 'canal'))} editKey="canal" />
                          </div>
                        )
                      })()}
                    </div>

                    {/* Personas de Contacto */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Personas de Contacto ({contacts.length})
                        </h3>
                        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs" onClick={async () => {
                          if (!workspaceId) return
                          const res = await getContacts(workspaceId)
                          const available = (res.data || []).filter((c: any) => c.company_id !== selectedCompany.id)
                          setAllContacts(available)
                          setShowContactDropdown(!showContactDropdown)
                        }}>
                          <Plus className="h-3 w-3" /> Anadir Contacto
                        </Button>
                      </div>

                      {/* Contact picker dropdown */}
                      {showContactDropdown && (
                        <div className="mb-3 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800/90 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Seleccionar contacto existente</span>
                            <button onClick={() => { setShowContactDropdown(false); setShowNewContactInline(false) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Input
                            placeholder="Buscar por nombre o email..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                            autoFocus
                          />
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {(() => {
                              const filtered = allContacts.filter((c: any) =>
                                !contactSearchQuery ||
                                `${c.first_name} ${c.last_name}`.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                                c.email?.toLowerCase().includes(contactSearchQuery.toLowerCase())
                              )
                              return filtered.length === 0 ? (
                                <p className="text-xs text-gray-500 py-2 text-center">
                                  {allContacts.length === 0 ? 'No hay contactos disponibles' : 'Sin resultados'}
                                </p>
                              ) : filtered.slice(0, 10).map((c: any) => (
                                <button
                                  key={c.id}
                                  onClick={async () => {
                                    const { error } = await linkContactToCompany(c.id, selectedCompany.id)
                                    if (!error) {
                                      const compRes = await getCompany(selectedCompany.id)
                                      if (compRes.data) setDetailContacts(compRes.data.contacts || [])
                                      setAllContacts(prev => prev.filter(x => x.id !== c.id))
                                      refetchCompanies()
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-left transition-colors"
                                >
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                                    {(c.first_name?.[0] || '')}{(c.last_name?.[0] || '')}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-900 dark:text-white truncate">{c.first_name} {c.last_name}</p>
                                    {c.email && <p className="text-[10px] text-gray-500 truncate">{c.email}</p>}
                                  </div>
                                  <Link2 className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                </button>
                              ))
                            })()}
                          </div>

                          {/* Separador + Crear nuevo */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                            {!showNewContactInline ? (
                              <button
                                onClick={() => setShowNewContactInline(true)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-left transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                                  <Plus className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Crear nuevo contacto</span>
                              </button>
                            ) : (
                              <div className="space-y-2 pt-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Nuevo contacto</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Nombre *"
                                    value={newContactInline.first_name}
                                    onChange={(e) => setNewContactInline({ ...newContactInline, first_name: e.target.value })}
                                    className="rounded-lg text-xs h-8 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                                  />
                                  <Input
                                    placeholder="Apellido"
                                    value={newContactInline.last_name}
                                    onChange={(e) => setNewContactInline({ ...newContactInline, last_name: e.target.value })}
                                    className="rounded-lg text-xs h-8 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                                <Input
                                  placeholder="Cargo"
                                  value={newContactInline.job_title}
                                  onChange={(e) => setNewContactInline({ ...newContactInline, job_title: e.target.value })}
                                  className="rounded-lg text-xs h-8 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                                />
                                <Input
                                  placeholder="Email"
                                  type="email"
                                  value={newContactInline.email}
                                  onChange={(e) => setNewContactInline({ ...newContactInline, email: e.target.value })}
                                  className="rounded-lg text-xs h-8 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                                />
                                <Input
                                  placeholder="Teléfono"
                                  value={newContactInline.phone}
                                  onChange={(e) => setNewContactInline({ ...newContactInline, phone: e.target.value })}
                                  className="rounded-lg text-xs h-8 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1 rounded-lg text-xs h-8 bg-green-600 hover:bg-green-700"
                                    disabled={!newContactInline.first_name || creatingContactInline}
                                    onClick={async () => {
                                      if (!workspaceId) return
                                      setCreatingContactInline(true)
                                      const { data: created } = await createContact(workspaceId, {
                                        first_name: newContactInline.first_name,
                                        last_name: newContactInline.last_name || undefined,
                                        job_title: newContactInline.job_title || undefined,
                                        email: newContactInline.email || undefined,
                                        phone: newContactInline.phone || undefined,
                                        company_id: selectedCompany.id,
                                      })
                                      if (created) {
                                        const compRes = await getCompany(selectedCompany.id)
                                        if (compRes.data) setDetailContacts(compRes.data.contacts || [])
                                        refetchCompanies()
                                      }
                                      setNewContactInline({ first_name: '', last_name: '', job_title: '', email: '', phone: '' })
                                      setShowNewContactInline(false)
                                      setCreatingContactInline(false)
                                    }}
                                  >
                                    {creatingContactInline ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Crear'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg text-xs h-8 dark:border-gray-700 dark:text-gray-300"
                                    onClick={() => {
                                      setShowNewContactInline(false)
                                      setNewContactInline({ first_name: '', last_name: '', job_title: '', email: '', phone: '' })
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {contacts.length > 0 ? (
                        <div className="space-y-2">
                          {contacts.map((contact: any) => (
                            <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors group">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {(contact.first_name?.[0] || '')}{(contact.last_name?.[0] || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.first_name} {contact.last_name}</p>
                                  {contact.lifecycle_stage && getLifecycleBadge(contact.lifecycle_stage)}
                                </div>
                                {contact.job_title && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{contact.job_title}</p>
                                )}
                              </div>
                              <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-0">
                                {contact.email && (
                                  <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[180px]">
                                    {contact.email}
                                  </a>
                                )}
                              </div>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  if (!confirm('¿Desvincular este contacto de la empresa?')) return
                                  const { error } = await unlinkContactFromCompany(contact.id)
                                  if (!error) {
                                    const compRes = await getCompany(selectedCompany.id)
                                    if (compRes.data) setDetailContacts(compRes.data.contacts || [])
                                    refetchCompanies()
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-1"
                                title="Desvincular contacto"
                              >
                                <Unlink className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No hay contactos asociados</p>
                      )}
                    </div>

                    {/* Deals / Oportunidades */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Oportunidades ({deals.length})
                      </h3>
                      {deals.length > 0 ? (
                        <div className="space-y-2">
                          {deals.map((deal: any) => (
                            <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getDealStatusColor(deal.stages)}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{deal.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{deal.stages?.name || 'Sin etapa'}</span>
                                  {deal.stages?.probability != null && (
                                    <>
                                      <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{deal.stages.probability}% prob.</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(deal.value || 0)}</p>
                                {deal.expected_close_date && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(deal.expected_close_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No hay oportunidades activas</p>
                      )}
                    </div>

                    {/* Actividades Kanban */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actividades ({filteredActivities.length})
                        </h3>
                        <Button size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowNewActivityModal(true)}>
                          <PlusCircle className="h-3.5 w-3.5" /> Registrar Actividad
                        </Button>
                      </div>

                      {/* Filtro Seguimiento */}
                      <div className="flex gap-2 mb-4">
                        {(['todos', 'llamar', 'visitar'] as const).map((filter) => (
                          <Button
                            key={filter}
                            variant={followUpFilter === filter ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-xl gap-1.5 text-xs"
                            onClick={() => setFollowUpFilter(filter)}
                          >
                            {filter === 'llamar' && <PhoneCall className="h-3 w-3" />}
                            {filter === 'visitar' && <MapPin className="h-3 w-3" />}
                            {filter === 'todos' ? 'Todos' : filter === 'llamar' ? 'Llamar' : 'Visitar'}
                          </Button>
                        ))}
                      </div>

                      {/* Kanban 3 columnas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Pendiente */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Pendiente ({pendingActivities.length})</span>
                          </div>
                          <div className="space-y-2 min-h-[60px]">
                            {pendingActivities.map((a: any) => <ActivityCard key={a.id} activity={a} />)}
                            {pendingActivities.length === 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Sin actividades</p>
                            )}
                          </div>
                        </div>

                        {/* Completada */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Completada ({completedActivities.length})</span>
                          </div>
                          <div className="space-y-2 min-h-[60px]">
                            {completedActivities.map((a: any) => <ActivityCard key={a.id} activity={a} />)}
                            {completedActivities.length === 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Sin actividades</p>
                            )}
                          </div>
                        </div>

                        {/* Cancelada */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cancelada ({cancelledActivities.length})</span>
                          </div>
                          <div className="space-y-2 min-h-[60px]">
                            {cancelledActivities.map((a: any) => <ActivityCard key={a.id} activity={a} />)}
                            {cancelledActivities.length === 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Sin actividades</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {isInlineEditing ? (
                        <>
                          <Button onClick={async () => {
                            if (!inlineEditData) return
                            setInlineSaving(true)
                            const cf = { ...(selectedCompany.custom_fields || {}) }
                            cf.contacto = inlineEditData.contacto || undefined
                            cf.telefono_2 = inlineEditData.telefono_2 || undefined
                            cf.ultima_compra = inlineEditData.ultima_compra || undefined
                            cf.forma_pago = inlineEditData.forma_pago || undefined
                            cf.email_2 = inlineEditData.email_2 || undefined
                            cf.email_3 = inlineEditData.email_3 || undefined
                            cf.email_4 = inlineEditData.email_4 || undefined
                            cf.email_5 = inlineEditData.email_5 || undefined
                            cf.canal = inlineEditData.canal || undefined
                            for (const k of Object.keys(cf)) { if (cf[k] === undefined) delete cf[k] }
                            await updateCompany(selectedCompany.id, {
                              name: inlineEditData.name,
                              vat_number: inlineEditData.vat_number || undefined,
                              phone: inlineEditData.phone || undefined,
                              email: inlineEditData.email || undefined,
                              website: inlineEditData.website || undefined,
                              industry: inlineEditData.industry || undefined,
                              company_size: inlineEditData.company_size || undefined,
                              description: inlineEditData.description || undefined,
                              linkedin_url: inlineEditData.linkedin_url || undefined,
                              annual_revenue: inlineEditData.annual_revenue ? parseFloat(inlineEditData.annual_revenue) : undefined,
                              account_type: inlineEditData.account_type,
                              account_status: inlineEditData.account_status,
                              billing_address: {
                                street: inlineEditData.street || undefined,
                                city: inlineEditData.city || undefined,
                                postal_code: inlineEditData.postal_code || undefined,
                                state: inlineEditData.province || undefined,
                                country: inlineEditData.country || undefined,
                              },
                              custom_fields: cf,
                            })
                            setInlineSaving(false)
                            setIsInlineEditing(false)
                            setInlineEditData(null)
                            setSelectedCompany(null)
                            refetchCompanies()
                          }} className="flex-1 rounded-xl shadow-lg bg-green-600 hover:bg-green-700" disabled={inlineSaving}>
                            {inlineSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                            {inlineSaving ? 'Guardando...' : 'Guardar'}
                          </Button>
                          <Button variant="outline" onClick={() => { setIsInlineEditing(false); setInlineEditData(null) }}
                            className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => {
                            const cf = selectedCompany.custom_fields || {}
                            setInlineEditData({
                              name: selectedCompany.name || '',
                              vat_number: selectedCompany.vat_number || '',
                              phone: selectedCompany.phone || '',
                              email: selectedCompany.email || '',
                              website: selectedCompany.website || '',
                              industry: selectedCompany.industry || '',
                              company_size: selectedCompany.company_size || '',
                              description: selectedCompany.description || '',
                              linkedin_url: selectedCompany.linkedin_url || '',
                              street: selectedCompany.billing_address?.street || '',
                              city: selectedCompany.billing_address?.city || '',
                              postal_code: selectedCompany.billing_address?.postal_code || '',
                              province: selectedCompany.billing_address?.state || '',
                              country: selectedCompany.billing_address?.country || 'España',
                              contacto: cf.contacto || '',
                              telefono_2: cf.telefono_2 || '',
                              ultima_compra: cf.ultima_compra || '',
                              forma_pago: cf.forma_pago || '',
                              email_2: cf.email_2 || '',
                              email_3: cf.email_3 || '',
                              email_4: cf.email_4 || '',
                              email_5: cf.email_5 || '',
                              account_type: selectedCompany.account_type || 'prospect',
                              account_status: selectedCompany.account_status || 'active',
                              annual_revenue: selectedCompany.annual_revenue || '',
                              canal: cf.canal || '',
                            })
                            setIsInlineEditing(true)
                          }} className="flex-1 rounded-xl shadow-lg">
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </Button>
                          <Button variant="outline" onClick={() => setDeletingCompanyId(selectedCompany.id)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedCompany(null)}
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

            {/* Mini-Modal Registrar Actividad */}
            {showNewActivityModal && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowNewActivityModal(false)}>
                <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-gray-900 dark:text-white text-base">Registrar Actividad</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewActivityModal(false)} className="rounded-xl">
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tipo *</label>
                        <select value={newActivity.type} onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                          <option value="call">Llamada</option>
                          <option value="email">Email</option>
                          <option value="meeting">Reunion</option>
                          <option value="visit">Visita</option>
                          <option value="note">Nota</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Seguimiento</label>
                        <select value={newActivity.followUpType} onChange={(e) => setNewActivity({...newActivity, followUpType: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                          <option value="">Ninguno</option>
                          <option value="llamar">Llamar</option>
                          <option value="visitar">Visitar</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Asunto *</label>
                        <Input value={newActivity.subject} onChange={(e) => setNewActivity({...newActivity, subject: e.target.value})}
                          className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Descripcion breve" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Contacto</label>
                        <select value={newActivity.contactId} onChange={(e) => setNewActivity({...newActivity, contactId: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                          <option value="">Seleccionar</option>
                          {contacts.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Fecha</label>
                          <Input type="date" value={newActivity.date} onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                            className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                        </div>
                        <div className="w-24">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Hora</label>
                          <Input type="time" value={newActivity.time} onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                            className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notas</label>
                        <textarea value={newActivity.notes} onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white resize-none h-16"
                          placeholder="Notas adicionales..." />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleCreateActivity} className="flex-1 rounded-xl text-sm"
                        disabled={!newActivity.subject}>
                        Registrar
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewActivityModal(false)}
                        className="rounded-xl text-sm dark:border-gray-700 dark:text-gray-300">
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )
      })()}

      {/* Modal Editar Empresa - Completo */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Editar Empresa</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingCompany(null)} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* DATOS BÁSICOS */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Datos Básicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Nombre *</label>
                    <Input value={editingCompany.name || ''} onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Acme Corporation" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">CIF/NIF</label>
                    <Input value={editingCompany.vat_number || ''} onChange={(e) => setEditingCompany({...editingCompany, vat_number: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="B12345678" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Industria</label>
                    <Input value={editingCompany.industry || ''} onChange={(e) => setEditingCompany({...editingCompany, industry: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Tecnología" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Tamaño (empleados)</label>
                    <select value={editingCompany.company_size || ''} onChange={(e) => setEditingCompany({...editingCompany, company_size: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="">Seleccionar</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="501+">501+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Sitio Web</label>
                    <Input value={editingCompany.website || ''} onChange={(e) => setEditingCompany({...editingCompany, website: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="www.ejemplo.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email</label>
                    <Input type="email" value={editingCompany.email || ''} onChange={(e) => setEditingCompany({...editingCompany, email: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="info@empresa.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Teléfono</label>
                    <Input value={editingCompany.phone || ''} onChange={(e) => setEditingCompany({...editingCompany, phone: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 900 000 000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">LinkedIn</label>
                    <Input value={editingCompany.linkedin_url || ''} onChange={(e) => setEditingCompany({...editingCompany, linkedin_url: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="linkedin.com/company/..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Descripción</label>
                    <textarea value={editingCompany.description || ''} onChange={(e) => setEditingCompany({...editingCompany, description: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white resize-none h-20"
                      placeholder="Descripción de la empresa..." />
                  </div>
                </div>
              </div>

              {/* DIRECCIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Dirección (necesaria para mapa)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Calle y número</label>
                    <Input value={editingCompany.billing_address?.street || ''} onChange={(e) => setEditingCompany({...editingCompany, billing_address: {...(editingCompany.billing_address || {}), street: e.target.value}})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Carrer de la Indústria, 45" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Ciudad</label>
                    <Input value={editingCompany.billing_address?.city || ''} onChange={(e) => setEditingCompany({...editingCompany, billing_address: {...(editingCompany.billing_address || {}), city: e.target.value}})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Barcelona" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Código Postal</label>
                    <Input value={editingCompany.billing_address?.postal_code || ''} onChange={(e) => setEditingCompany({...editingCompany, billing_address: {...(editingCompany.billing_address || {}), postal_code: e.target.value}})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="08001" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Provincia</label>
                    <Input value={editingCompany.billing_address?.province || ''} onChange={(e) => setEditingCompany({...editingCompany, billing_address: {...(editingCompany.billing_address || {}), province: e.target.value}})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Barcelona" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">País</label>
                    <Input value={editingCompany.billing_address?.country || 'España'} onChange={(e) => setEditingCompany({...editingCompany, billing_address: {...(editingCompany.billing_address || {}), country: e.target.value}})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="España" />
                  </div>
                </div>
              </div>

              {/* CLASIFICACIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Clasificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Tipo de Cuenta</label>
                    <select value={editingCompany.account_type || 'prospect'} onChange={(e) => setEditingCompany({...editingCompany, account_type: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospecto</option>
                      <option value="customer">Cliente</option>
                      <option value="partner">Partner</option>
                      <option value="supplier">Proveedor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Estado</label>
                    <select value={editingCompany.account_status || 'active'} onChange={(e) => setEditingCompany({...editingCompany, account_status: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="negotiating">En negociación</option>
                      <option value="churned">Perdido</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Facturación Anual (€)</label>
                    <Input type="number" value={editingCompany.annual_revenue || ''} onChange={(e) => setEditingCompany({...editingCompany, annual_revenue: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="100000" />
                  </div>
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                <Button onClick={handleUpdateCompany} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!editingCompany.name || updatingCompany}>
                  {updatingCompany ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button variant="outline" onClick={() => setEditingCompany(null)}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Eliminar Empresa */}
      {deletingCompanyId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Eliminar Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <Button onClick={() => handleDeleteCompany(deletingCompanyId)} disabled={deletingCompany}
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl">
                  {deletingCompany ? 'Eliminando...' : 'Eliminar'}
                </Button>
                <Button variant="outline" onClick={() => setDeletingCompanyId(null)}
                  className="flex-1 rounded-xl dark:border-gray-700 dark:text-gray-300">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
