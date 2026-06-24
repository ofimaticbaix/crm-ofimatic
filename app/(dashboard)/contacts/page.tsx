'use client'

import { useState, useEffect, useDeferredValue } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Mail, Phone, Building2, X, Briefcase, Calendar, PhoneCall, MapPin, Loader2, Pencil, Trash2, User, Globe, Linkedin, CheckCircle, Link2, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getContacts, createContact, updateContact, deleteContact } from '@/lib/actions/contacts'
import { getCompanies } from '@/lib/actions/companies'
import { recreateContactsFromCompanies } from '@/lib/actions/client-detail'
import { getDeals } from '@/lib/actions/deals'
import { getActivities } from '@/lib/actions/activities'
import { useCachedData } from '@/lib/hooks/use-cached-data'
import { toast } from 'sonner'

type SortField = 'name' | 'company' | 'email' | 'phone' | 'lifecycle'
type SortDirection = 'asc' | 'desc' | null

export default function ContactsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [contactEditMode, setContactEditMode] = useState(false)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [linking, setLinking] = useState(false)
  const [linkResult, setLinkResult] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [newContact, setNewContact] = useState({
    // Personal data
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    jobTitle: '',
    department: '',
    linkedinUrl: '',
    // Company & Classification
    companyId: '',
    lifecycle: 'lead',
    leadSource: '',
    isDecisionMaker: false,
    // Preferences
    language: 'es',
    birthday: '',
    consentMarketing: false,
    notes: '',
  })

  // Cached data - loads instantly if cached
  const { data: contacts, loading: contactsLoading, refetch: refetchContacts } = useCachedData<any[]>(
    `contacts-${workspaceId}`,
    () => getContacts(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const { data: allDeals } = useCachedData<any[]>(
    `deals-${workspaceId}`,
    () => getDeals(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId, staleTime: 60000 }
  )

  const { data: allActivities } = useCachedData<any[]>(
    `activities-${workspaceId}`,
    () => getActivities(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId, staleTime: 60000 }
  )

  // Companies for dropdown
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [editCompanySearch, setEditCompanySearch] = useState('')
  const [showEditCompanyDropdown, setShowEditCompanyDropdown] = useState(false)

  // Overall loading - only block if no cached data
  const loading = wsLoading || (contactsLoading && !contacts)

  const deferredContactSearch = useDeferredValue(searchQuery)
  const filteredContacts = (contacts || []).filter(contact => {
    const query = deferredContactSearch.toLowerCase()
    return (
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.companies?.name?.toLowerCase().includes(query)
    )
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

  const LIFECYCLE_ORDER: Record<string, number> = { customer: 0, prospect: 1, lead: 2 }

  const sortedContacts = [...filteredContacts].sort((a: any, b: any) => {
    if (!sortField || !sortDirection) return 0
    let valA = ''
    let valB = ''
    if (sortField === 'name') { valA = `${a.first_name || ''} ${a.last_name || ''}`; valB = `${b.first_name || ''} ${b.last_name || ''}` }
    else if (sortField === 'company') { valA = a.companies?.name || ''; valB = b.companies?.name || '' }
    else if (sortField === 'email') { valA = a.email || ''; valB = b.email || '' }
    else if (sortField === 'phone') { valA = a.phone || ''; valB = b.phone || '' }
    else if (sortField === 'lifecycle') {
      const orderA = LIFECYCLE_ORDER[a.lifecycle_stage || ''] ?? 99
      const orderB = LIFECYCLE_ORDER[b.lifecycle_stage || ''] ?? 99
      return sortDirection === 'asc' ? orderA - orderB : orderB - orderA
    }
    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const selectedContact = selectedContactId ? (contacts || []).find(c => c.id === selectedContactId) : null

  const getLifecycleColor = (lifecycle: string) => {
    switch (lifecycle) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'lead': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLifecycleLabel = (lifecycle: string) => {
    switch (lifecycle) {
      case 'customer': return 'Cliente'
      case 'prospect': return 'Prospecto'
      case 'lead': return 'Lead'
      default: return lifecycle || 'Lead'
    }
  }

  // Load companies when modal opens
  useEffect(() => {
    if ((showNewContactModal || editingContact) && workspaceId) {
      getCompanies(workspaceId).then(res => {
        if (res.data) setAllCompanies(res.data)
      })
    }
  }, [showNewContactModal, editingContact, workspaceId])

  // Filter companies for dropdown (New contact form). Muestra hasta 10 sin filtro, o todas las que matcheen.
  const filteredCompaniesForDropdown = allCompanies
    .filter(c => !companySearchQuery || c.name?.toLowerCase().includes(companySearchQuery.toLowerCase()))
    .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es'))
    .slice(0, companySearchQuery ? 15 : 10)

  // Company search state for Edit form (separado del "new contact")
  const editingContactCompany = editingContact?.company_id
    ? allCompanies.find(c => c.id === editingContact.company_id)
    : null
  const editCompanyFiltered = allCompanies
    .filter(c => !editCompanySearch || c.name?.toLowerCase().includes(editCompanySearch.toLowerCase()))
    .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es'))
    .slice(0, editCompanySearch ? 15 : 10)

  const selectedCompanyForContact = newContact.companyId
    ? allCompanies.find(c => c.id === newContact.companyId)
    : null

  const resetNewContactForm = () => {
    setNewContact({
      firstName: '', lastName: '', email: '', phone: '', mobile: '', jobTitle: '', department: '',
      linkedinUrl: '', companyId: '', lifecycle: 'lead', leadSource: '', isDecisionMaker: false,
      language: 'es', birthday: '', consentMarketing: false, notes: '',
    })
    setCompanySearchQuery('')
  }

  const handleCreateContact = async () => {
    setCreating(true)
    const result = await createContact(workspaceId, {
      first_name: newContact.firstName,
      last_name: newContact.lastName,
      email: newContact.email,
      phone: newContact.phone,
      mobile: newContact.mobile || undefined,
      job_title: newContact.jobTitle || undefined,
      department: newContact.department || undefined,
      linkedin_url: newContact.linkedinUrl || undefined,
      company_id: newContact.companyId || null,
      lifecycle_stage: newContact.lifecycle,
      lead_source: newContact.leadSource || undefined,
      is_decision_maker: newContact.isDecisionMaker,
      language: newContact.language,
      birthday: newContact.birthday || undefined,
      consent_marketing: newContact.consentMarketing,
      notes: newContact.notes || undefined,
    })
    setCreating(false)
    if (!result.error) {
      setShowNewContactModal(false)
      resetNewContactForm()
      refetchContacts()
    } else {
      toast.error(result.error)
    }
  }

  const handleUpdateContact = async () => {
    setUpdating(true)
    const result = await updateContact(editingContact.id, {
      first_name: editingContact.first_name,
      last_name: editingContact.last_name,
      email: editingContact.email,
      phone: editingContact.phone,
      mobile: editingContact.mobile || undefined,
      job_title: editingContact.job_title,
      department: editingContact.department || undefined,
      linkedin_url: editingContact.linkedin_url || undefined,
      lifecycle_stage: editingContact.lifecycle_stage,
      lead_source: editingContact.lead_source || undefined,
      is_decision_maker: editingContact.is_decision_maker,
      language: editingContact.language,
      birthday: editingContact.birthday || undefined,
      consent_marketing: editingContact.consent_marketing,
      notes: editingContact.notes || undefined,
      company_id: editingContact.company_id || null,
    })
    setUpdating(false)
    if (!result.error) {
      setEditingContact(null)
      refetchContacts()
    }
  }

  const handleDeleteContact = async (id: string) => {
    setDeleting(true)
    const result = await deleteContact(id)
    setDeleting(false)
    if (!result.error) {
      setDeletingContactId(null)
      setSelectedContactId(null)
      setEditingContact(null)
      setContactEditMode(false)
      refetchContacts()
      toast.success('Contacto eliminado')
    } else {
      toast.error(result.error)
    }
  }

  // Get activities and deals for a specific contact
  const getContactActivities = (contactId: string) => (allActivities || []).filter(a => a.contact_id === contactId)
  const getContactDeals = (contactId: string) => (allDeals || []).filter(d =>
    d.deal_contacts?.some((dc: any) => dc.contact_id === contactId)
  )

  const handleRecreateContacts = async () => {
    setLinking(true)
    setLinkResult(null)
    const { created, deleted, error } = await recreateContactsFromCompanies(workspaceId)
    if (error) {
      setLinkResult(`Error: ${error}`)
    } else {
      setLinkResult(`${created} vinculados, ${deleted} ya tenían empresa`)
    }
    if (created > 0 || deleted > 0) {
      setTimeout(() => window.location.reload(), 2000)
    }
    setLinking(false)
  }

  // Count orphan contacts (no company)
  const orphanCount = (contacts || []).filter((c: any) => !c.company_id || c.company_id === '').length

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Contactos</h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">{sortedContacts.length} contactos totales</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecreateContacts}
            disabled={linking}
            className="gap-1.5 rounded-xl text-xs"
            title="Elimina contactos existentes y los recrea desde empresas"
          >
            {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Recrear contactos desde empresas
          </Button>
          <Button onClick={() => setShowNewContactModal(true)} className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-initial">
            <Plus className="h-4 w-4" />
            <span className="md:inline">Nuevo Contacto</span>
          </Button>
        </div>
      </div>

      {/* Link result notification */}
      {linkResult && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${linkResult.startsWith('Error') ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-green-500/10 border border-green-500/30 text-green-300'}`}>
          {linkResult.startsWith('Error') ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {linkResult}
          <button onClick={() => setLinkResult(null)} className="ml-auto text-gray-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar contactos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                      Contacto
                      {sortField === 'name' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => handleSort('company')} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                      Empresa
                      {sortField === 'company' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => handleSort('email')} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                      Email
                      {sortField === 'email' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => handleSort('phone')} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                      Teléfono
                      {sortField === 'phone' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => handleSort('lifecycle')} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                      Estado
                      {sortField === 'lifecycle' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[1%]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => setEditingContact(contact)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{contact.first_name} {contact.last_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{contact.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{contact.companies?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-blue-600 dark:text-blue-400">{contact.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{contact.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getLifecycleColor(contact.lifecycle_stage)} rounded-xl`}>
                        {getLifecycleLabel(contact.lifecycle_stage)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingContactId(contact.id) }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar contacto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {sortedContacts.map((contact) => (
              <div key={contact.id} className="p-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                onClick={() => setEditingContact(contact)}>
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0">
                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{contact.first_name} {contact.last_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.job_title}</div>
                    <Badge className={`${getLifecycleColor(contact.lifecycle_stage)} rounded-lg mt-1 text-[10px] px-1.5 py-0.5`}>
                      {getLifecycleLabel(contact.lifecycle_stage)}
                    </Badge>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingContactId(contact.id) }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs ml-12">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate">{contact.companies?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-blue-600 dark:text-blue-400 truncate">{contact.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedContacts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No hay contactos{searchQuery ? ' que coincidan con la búsqueda' : ' aún'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {(contacts || []).filter(c => c.lifecycle_stage === 'customer').length}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Clientes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {(contacts || []).filter(c => c.lifecycle_stage === 'prospect').length}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Prospectos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {(contacts || []).filter(c => c.lifecycle_stage === 'lead' || !c.lifecycle_stage).length}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Nuevo Contacto - Completo */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewContactModal(false)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b dark:border-gray-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white text-lg">Nuevo Contacto</CardTitle>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Rellena los datos de la persona</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowNewContactModal(false); resetNewContactForm() }} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Nombre *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input value={newContact.firstName} onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                      className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Nombre" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Apellido</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input value={newContact.lastName} onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                      className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Apellido" />
                  </div>
                </div>
              </div>

              {/* Empresa selector */}
              <div>
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Empresa</label>
                {selectedCompanyForContact ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {selectedCompanyForContact.name?.[0] || 'E'}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedCompanyForContact.name}</span>
                    </div>
                    <button onClick={() => setNewContact({...newContact, companyId: ''})} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      value={companySearchQuery}
                      onChange={(e) => { setCompanySearchQuery(e.target.value); setShowCompanyDropdown(true) }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 150)}
                      className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                      placeholder="Buscar empresa o haz click para ver la lista..."
                    />
                    {showCompanyDropdown && filteredCompaniesForDropdown.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                        {filteredCompaniesForDropdown.map(company => (
                          <button
                            key={company.id}
                            onClick={() => { setNewContact({...newContact, companyId: company.id}); setCompanySearchQuery(''); setShowCompanyDropdown(false) }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                              {company.name?.[0] || 'E'}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{company.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input value={newContact.jobTitle} onChange={(e) => setNewContact({...newContact, jobTitle: e.target.value})}
                    className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Ej: Director Comercial" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input type="email" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="email@empresa.com" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 600 000 000" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">LinkedIn</label>
                <div className="relative">
                  <Linkedin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input value={newContact.linkedinUrl} onChange={(e) => setNewContact({...newContact, linkedinUrl: e.target.value})}
                    className="rounded-xl text-sm h-9 pl-9 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="linkedin.com/in/nombre" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-1">Notas</label>
                <textarea value={newContact.notes} onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                  rows={2}
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas sobre este contacto..." />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={newContact.isDecisionMaker}
                  onChange={(e) => setNewContact({...newContact, isDecisionMaker: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                />
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Es decisor en la empresa</span>
                </div>
              </label>

              {/* BOTONES */}
              <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
                <Button onClick={handleCreateContact}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={!newContact.firstName || creating}>
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : <><Plus className="h-4 w-4 mr-2" /> Crear Contacto</>}
                </Button>
                <Button variant="outline" onClick={() => { setShowNewContactModal(false); resetNewContactForm() }}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalle Contacto */}
      {selectedContact && (() => {
        const contactActivities = getContactActivities(selectedContact.id)
        const contactDeals = getContactDeals(selectedContact.id)
        const company = selectedContact.companies

        const typeIcons: Record<string, string> = {
          'call': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          'email': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          'meeting': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          'note': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
          'task': 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
        }
        const typeLabels: Record<string, string> = {
          'call': 'Llamada', 'email': 'Email', 'meeting': 'Reunión', 'note': 'Nota', 'task': 'Tarea',
        }

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedContactId(null)}>
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {selectedContact.first_name?.[0]}{selectedContact.last_name?.[0]}
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white text-xl">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{selectedContact.job_title}</span>
                        <Badge className={`${getLifecycleColor(selectedContact.lifecycle_stage)} rounded-full text-xs`}>
                          {getLifecycleLabel(selectedContact.lifecycle_stage)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContactId(null)} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{contactDeals.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deals</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{contactActivities.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Actividades</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 truncate text-lg">
                      {company?.name || '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Empresa</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Información</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <a href={`mailto:${selectedContact.email}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {selectedContact.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <Phone className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedContact.phone || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company */}
                {company && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Empresa</h3>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {company.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{company.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{company.industry || ''}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deals */}
                {contactDeals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Oportunidades ({contactDeals.length})
                    </h3>
                    <div className="space-y-2">
                      {contactDeals.map((deal) => (
                        <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                          <Briefcase className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{deal.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{deal.stages?.name} · {deal.stages?.probability}%</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                            {formatCurrency(deal.value || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {contactActivities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Actividades ({contactActivities.length})
                    </h3>
                    <div className="space-y-2">
                      {contactActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${typeIcons[activity.type] || ''}`}>
                            {typeLabels[activity.type] || activity.type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">{activity.subject}</p>
                            {activity.outcome && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.outcome}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatRelativeTime(activity.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={() => { setEditingContact({...selectedContact}); setSelectedContactId(null) }}
                    className="flex-1 rounded-xl shadow-lg">
                    <Pencil className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button variant="outline" onClick={() => setDeletingContactId(selectedContact.id)}
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedContactId(null)}
                    className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })()}

      {/* Modal Detalle/Editar Contacto - Completo */}
      {editingContact && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setEditingContact(null); setContactEditMode(false); setEditCompanySearch(''); setShowEditCompanyDropdown(false) }}
        >
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">
                {contactEditMode ? 'Editar Contacto' : 'Detalle del Contacto'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setEditingContact(null); setContactEditMode(false) }} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <fieldset disabled={!contactEditMode} className={!contactEditMode ? 'opacity-90' : ''}>
              {/* DATOS PERSONALES */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" /> Datos Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Nombre *</label>
                    <Input value={editingContact.first_name || ''} onChange={(e) => setEditingContact({...editingContact, first_name: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Juan" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Apellidos *</label>
                    <Input value={editingContact.last_name || ''} onChange={(e) => setEditingContact({...editingContact, last_name: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Pérez García" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Email *</label>
                    <Input type="email" value={editingContact.email || ''} onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="juan@empresa.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Teléfono fijo</label>
                    <Input value={editingContact.phone || ''} onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 93 000 0000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Móvil</label>
                    <Input value={editingContact.mobile || ''} onChange={(e) => setEditingContact({...editingContact, mobile: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 600 000 000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Cargo</label>
                    <Input value={editingContact.job_title || ''} onChange={(e) => setEditingContact({...editingContact, job_title: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Director General" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Departamento</label>
                    <Input value={editingContact.department || ''} onChange={(e) => setEditingContact({...editingContact, department: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Ventas" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">LinkedIn</label>
                    <Input value={editingContact.linkedin_url || ''} onChange={(e) => setEditingContact({...editingContact, linkedin_url: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="linkedin.com/in/..." />
                  </div>
                </div>
              </div>

              {/* CLASIFICACIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Clasificación
                </h3>

                {/* Empresa selector */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Empresa</label>
                  {editingContactCompany ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {editingContactCompany.name?.[0] || 'E'}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">{editingContactCompany.name}</span>
                      </div>
                      <button onClick={() => { setEditingContact({ ...editingContact, company_id: null }); setEditCompanySearch('') }}
                        className="text-gray-400 hover:text-red-500 transition-colors" title="Quitar empresa">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={editCompanySearch}
                        onChange={(e) => { setEditCompanySearch(e.target.value); setShowEditCompanyDropdown(true) }}
                        onFocus={() => setShowEditCompanyDropdown(true)}
                        onBlur={() => setTimeout(() => setShowEditCompanyDropdown(false), 150)}
                        className="rounded-xl text-sm pl-10 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                        placeholder="Buscar empresa o haz click para ver la lista..."
                      />
                      {showEditCompanyDropdown && editCompanyFiltered.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
                          {editCompanyFiltered.map(company => (
                            <button
                              key={company.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEditingContact({ ...editingContact, company_id: company.id })
                                setEditCompanySearch('')
                                setShowEditCompanyDropdown(false)
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                                {company.name?.[0] || 'E'}
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white truncate">{company.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Estado *</label>
                    <select value={editingContact.lifecycle_stage || 'lead'} onChange={(e) => setEditingContact({...editingContact, lifecycle_stage: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospecto</option>
                      <option value="customer">Cliente</option>
                      <option value="evangelist">Evangelista</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Canal de origen</label>
                    <select value={editingContact.lead_source || ''} onChange={(e) => setEditingContact({...editingContact, lead_source: e.target.value})}
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
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingContact.is_decision_maker || false}
                        onChange={(e) => setEditingContact({...editingContact, is_decision_maker: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Es decisor
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* PREFERENCIAS */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Preferencias
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Idioma preferido</label>
                    <select value={editingContact.language || 'es'} onChange={(e) => setEditingContact({...editingContact, language: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <option value="es">Español</option>
                      <option value="ca">Catalán</option>
                      <option value="en">Inglés</option>
                      <option value="fr">Francés</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Cumpleaños</label>
                    <Input type="date" value={editingContact.birthday || ''} onChange={(e) => setEditingContact({...editingContact, birthday: e.target.value})}
                      className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingContact.consent_marketing || false}
                        onChange={(e) => setEditingContact({...editingContact, consent_marketing: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Acepta comunicaciones de marketing (RGPD)</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Notas</label>
                    <textarea value={editingContact.notes || ''} onChange={(e) => setEditingContact({...editingContact, notes: e.target.value})}
                      className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white resize-none h-20"
                      placeholder="Notas adicionales..." />
                  </div>
                </div>
              </div>
              </fieldset>

              {/* BOTONES */}
              <div className="flex gap-3 pt-4 border-t dark:border-gray-700 flex-wrap">
                {contactEditMode ? (
                  <>
                    <Button onClick={async () => { await handleUpdateContact(); setContactEditMode(false) }} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                      disabled={!editingContact.first_name || !editingContact.last_name || !editingContact.email || updating}>
                      {updating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : 'Guardar Cambios'}
                    </Button>
                    <Button variant="outline" onClick={() => setContactEditMode(false)}
                      className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                      Cancelar edición
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setContactEditMode(true)} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all">
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button variant="outline" onClick={() => setDeletingContactId(editingContact.id)}
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingContact(null)}
                      className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                      Cerrar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Eliminar Contacto */}
      {deletingContactId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeletingContactId(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Eliminar Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">¿Estás seguro de que quieres eliminar este contacto? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <Button onClick={() => handleDeleteContact(deletingContactId)} disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl">
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
                <Button variant="outline" onClick={() => setDeletingContactId(null)}
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
