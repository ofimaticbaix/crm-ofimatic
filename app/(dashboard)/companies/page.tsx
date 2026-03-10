'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Plus, Globe, Users, X, Building2, TrendingUp,
  Mail, Phone, MapPin, User, Briefcase, DollarSign,
  Calendar, ChevronRight, PhoneCall, PlusCircle
} from 'lucide-react'
import { mockCompanies, mockContacts, getContactsByCompany, getDealsByCompany, getActivitiesByCompany, getContactById, stages } from '@/lib/mock-data'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<typeof mockCompanies[0] | null>(null)
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
  const [newCompany, setNewCompany] = useState({
    name: '', industry: '', size: '', website: '', canal: '', email: '', phone: '', address: ''
  })

  const filteredCompanies = mockCompanies.filter(company => {
    const query = searchQuery.toLowerCase()
    return (
      company.name.toLowerCase().includes(query) ||
      company.industry?.toLowerCase().includes(query) ||
      company.email?.toLowerCase().includes(query)
    )
  })

  const handleCreateCompany = () => {
    alert(`Empresa creada: ${newCompany.name}`)
    setShowNewCompanyModal(false)
    setNewCompany({ name: '', industry: '', size: '', website: '', canal: '', email: '', phone: '', address: '' })
  }

  const handleCreateActivity = () => {
    alert(`Actividad registrada: ${newActivity.subject}`)
    setShowNewActivityModal(false)
    setNewActivity({ type: 'call', subject: '', contactId: '', followUpType: '', date: '', time: '', notes: '' })
  }

  const getCanalLabel = (canal: string) => {
    const canales: Record<string, string> = {
      'web': 'Página Web', 'referido': 'Referido', 'email': 'Email Marketing',
      'social': 'Redes Sociales', 'llamada': 'Llamada Fría', 'evento': 'Evento/Feria',
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

  const getStageName = (stageId: string) => stages.find(s => s.id === stageId)?.name || stageId

  const getDealStatusColor = (stage: string) => {
    const colors: Record<string, string> = {
      'prospecting': 'bg-gray-400', 'qualification': 'bg-blue-400',
      'proposal': 'bg-yellow-400', 'negotiation': 'bg-orange-400', 'closed_won': 'bg-green-400',
    }
    return colors[stage] || 'bg-gray-400'
  }

  const getCompanyCardData = (company: typeof mockCompanies[0]) => {
    const contacts = getContactsByCompany(company.id)
    const deals = getDealsByCompany(company.id)
    const totalDealValue = deals.reduce((sum, d) => sum + d.value, 0)
    const primaryContact = contacts[0] || null
    return { contacts, deals, totalDealValue, primaryContact }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Empresas</h1>
          <p className="text-xs md:text-sm text-white mt-1">{filteredCompanies.length} empresas totales</p>
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
            <Input placeholder="Buscar por nombre, industria o email..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredCompanies.map((company) => {
          const { contacts, deals, totalDealValue, primaryContact } = getCompanyCardData(company)
          return (
            <Card key={company.id} className="hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => { setSelectedCompany(company); setFollowUpFilter('todos') }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-white mb-1 truncate">{company.name}</h3>
                    <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">{company.industry}</Badge>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                    {company.name[0]}
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{company.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{company.size} empleados</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3.5 w-3.5" />
                    <span>{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</span>
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

                {primaryContact && (
                  <div className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {primaryContact.firstName[0]}{primaryContact.lastName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {primaryContact.firstName} {primaryContact.lastName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {primaryContact.jobTitle} · {primaryContact.email}
                        </p>
                      </div>
                      {getLifecycleBadge(primaryContact.lifecycle)}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  {company.website && (
                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer"
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

      {/* Modal Nueva Empresa */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nueva Empresa</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNewCompanyModal(false)} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Nombre de la Empresa *</label>
                  <Input value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Acme Corporation" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Industria *</label>
                  <Input value={newCompany.industry} onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Tecnología" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Email</label>
                  <Input value={newCompany.email} onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="info@empresa.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Teléfono</label>
                  <Input value={newCompany.phone} onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 900 000 000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Tamaño (empleados) *</label>
                  <Input value={newCompany.size} onChange={(e) => setNewCompany({...newCompany, size: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="50-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Sitio Web</label>
                  <Input value={newCompany.website} onChange={(e) => setNewCompany({...newCompany, website: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="ejemplo.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Dirección</label>
                  <Input value={newCompany.address} onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Calle, Ciudad" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Canal *</label>
                  <select value={newCompany.canal} onChange={(e) => setNewCompany({...newCompany, canal: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
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
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleCreateCompany} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newCompany.name || !newCompany.industry || !newCompany.size || !newCompany.canal}>
                  Crear Empresa
                </Button>
                <Button variant="outline" onClick={() => setShowNewCompanyModal(false)}
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
        const contacts = getContactsByCompany(selectedCompany.id)
        const deals = getDealsByCompany(selectedCompany.id)
        const activities = getActivitiesByCompany(selectedCompany.id)
        const totalDealValue = deals.reduce((sum, d) => sum + d.value, 0)
        const openDeals = deals.filter(d => d.status === 'open')

        const filteredActivities = followUpFilter === 'todos'
          ? activities
          : activities.filter(a => a.followUpType === followUpFilter)

        const pendingActivities = filteredActivities.filter(a => a.status === 'pendiente')
        const completedActivities = filteredActivities.filter(a => a.status === 'completada')
        const cancelledActivities = filteredActivities.filter(a => a.status === 'cancelada')

        const typeIcons: Record<string, string> = {
          'call': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          'email': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          'meeting': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          'note': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
          'visit': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        }
        const typeLabels: Record<string, string> = {
          'call': 'Llamada', 'email': 'Email', 'meeting': 'Reunión', 'note': 'Nota', 'visit': 'Visita',
        }

        const ActivityCard = ({ activity }: { activity: typeof activities[0] }) => {
          const contact = getContactById(activity.contactId)
          return (
            <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-start gap-2 mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-medium flex-shrink-0 ${typeIcons[activity.type] || ''}`}>
                  {typeLabels[activity.type] || activity.type}
                </span>
                {activity.followUpType && (
                  <Badge className="text-[10px] rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0">
                    {activity.followUpType === 'llamar' ? 'Llamar' : 'Visitar'}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.subject}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(activity.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las{' '}
                {new Date(activity.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.outcome}</p>
              {contact && (
                <p className="text-[11px] text-gray-400 mt-1">
                  {contact.firstName} {contact.lastName}
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
                      <CardTitle className="text-white text-xl">{selectedCompany.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">{selectedCompany.industry}</Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{selectedCompany.size} empleados</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)} className="rounded-xl">
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
                {/* Información de Contacto */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <a href={`mailto:${selectedCompany.email}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {selectedCompany.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <Phone className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                        <a href={`tel:${selectedCompany.phone}`} className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                          {selectedCompany.phone}
                        </a>
                      </div>
                    </div>
                    {selectedCompany.website && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                        <Globe className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sitio Web</p>
                          <a href={`https://${selectedCompany.website}`} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {selectedCompany.website}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dirección</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCompany.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <TrendingUp className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Canal de Adquisición</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{getCanalLabel(selectedCompany.canal)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personas de Contacto */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Personas de Contacto ({contacts.length})
                  </h3>
                  {contacts.length > 0 ? (
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.firstName} {contact.lastName}</p>
                              {getLifecycleBadge(contact.lifecycle)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{contact.jobTitle}</p>
                          </div>
                          <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-0">
                            <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[180px]">
                              {contact.email}
                            </a>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</span>
                          </div>
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
                      {deals.map((deal) => (
                        <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getDealStatusColor(deal.stage)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{deal.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{getStageName(deal.stage)}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{deal.probability}% prob.</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(deal.value)}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(deal.expectedCloseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                            </div>
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
                        {pendingActivities.map(a => <ActivityCard key={a.id} activity={a} />)}
                        {pendingActivities.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">Sin actividades</p>
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
                        {completedActivities.map(a => <ActivityCard key={a.id} activity={a} />)}
                        {completedActivities.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">Sin actividades</p>
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
                        {cancelledActivities.map(a => <ActivityCard key={a.id} activity={a} />)}
                        {cancelledActivities.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">Sin actividades</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button className="flex-1 rounded-xl" onClick={() => alert('Editar empresa - Próximamente')}>
                    Editar Empresa
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedCompany(null)}
                    className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mini-Modal Registrar Actividad */}
            {showNewActivityModal && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowNewActivityModal(false)}>
                <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-white text-base">Registrar Actividad</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewActivityModal(false)} className="rounded-xl">
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">Tipo *</label>
                        <select value={newActivity.type} onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-gray-800/50 border border-gray-700 text-white">
                          <option value="call">Llamada</option>
                          <option value="email">Email</option>
                          <option value="meeting">Reunión</option>
                          <option value="visit">Visita</option>
                          <option value="note">Nota</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">Seguimiento</label>
                        <select value={newActivity.followUpType} onChange={(e) => setNewActivity({...newActivity, followUpType: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-gray-800/50 border border-gray-700 text-white">
                          <option value="">Ninguno</option>
                          <option value="llamar">Llamar</option>
                          <option value="visitar">Visitar</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-400 block mb-1">Asunto *</label>
                        <Input value={newActivity.subject} onChange={(e) => setNewActivity({...newActivity, subject: e.target.value})}
                          className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Descripción breve" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">Contacto</label>
                        <select value={newActivity.contactId} onChange={(e) => setNewActivity({...newActivity, contactId: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-gray-800/50 border border-gray-700 text-white">
                          <option value="">Seleccionar</option>
                          {contacts.map(c => (
                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-gray-400 block mb-1">Fecha</label>
                          <Input type="date" value={newActivity.date} onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                            className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                        </div>
                        <div className="w-24">
                          <label className="text-xs font-medium text-gray-400 block mb-1">Hora</label>
                          <Input type="time" value={newActivity.time} onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                            className="rounded-xl text-sm dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-400 block mb-1">Notas</label>
                        <textarea value={newActivity.notes} onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                          className="w-full rounded-xl px-3 py-2 text-sm bg-gray-800/50 border border-gray-700 text-white resize-none h-16"
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
    </div>
  )
}
