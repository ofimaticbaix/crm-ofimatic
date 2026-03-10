'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Mail, Phone, Building2, X, Briefcase, Calendar, PhoneCall, MapPin } from 'lucide-react'
import { getContactsWithCompany, getActivitiesByContact, getDealsByContact, getCompanyById, stages } from '@/lib/mock-data'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [followUpFilter, setFollowUpFilter] = useState<'todos' | 'llamar' | 'visitar'>('todos')
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    lifecycle: 'lead'
  })
  const contacts = getContactsWithCompany()

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase()
    return (
      contact.firstName?.toLowerCase().includes(query) ||
      contact.lastName?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.company?.name.toLowerCase().includes(query)
    )
  })

  const selectedContact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null

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
      default: return lifecycle
    }
  }

  const handleCreateContact = () => {
    alert(`Contacto creado: ${newContact.firstName} ${newContact.lastName}`)
    setShowNewContactModal(false)
    setNewContact({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', lifecycle: 'lead' })
  }

  const getStageName = (stageId: string) => stages.find(s => s.id === stageId)?.name || stageId

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Contactos</h1>
          <p className="text-xs md:text-sm text-white mt-1">{filteredContacts.length} contactos totales</p>
        </div>
        <Button
          onClick={() => setShowNewContactModal(true)}
          className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="md:inline">Nuevo Contacto</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Buscar contactos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 sm:flex-none rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">Filtros</Button>
              <Button variant="outline" className="flex-1 sm:flex-none rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">Exportar</Button>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => { setSelectedContactId(contact.id); setFollowUpFilter('todos') }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{contact.firstName} {contact.lastName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{contact.jobTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{contact.company?.name || '-'}</span>
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
                        <span className="text-sm text-gray-900 dark:text-gray-100">{contact.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getLifecycleColor(contact.lifecycle)} rounded-xl`}>
                        {getLifecycleLabel(contact.lifecycle)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                onClick={() => { setSelectedContactId(contact.id); setFollowUpFilter('todos') }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0">
                    {contact.firstName?.[0]}{contact.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{contact.firstName} {contact.lastName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.jobTitle}</div>
                    <Badge className={`${getLifecycleColor(contact.lifecycle)} rounded-lg mt-1 text-[10px] px-1.5 py-0.5`}>
                      {getLifecycleLabel(contact.lifecycle)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs ml-12">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate">{contact.company?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-blue-600 dark:text-blue-400 truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate">{contact.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {contacts.filter(c => c.lifecycle === 'customer').length}
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Clientes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {contacts.filter(c => c.lifecycle === 'prospect').length}
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Prospectos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {contacts.filter(c => c.lifecycle === 'lead').length}
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Nuevo Contacto */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nuevo Contacto</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNewContactModal(false)} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Nombre *</label>
                  <Input value={newContact.firstName} onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Juan" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Apellido *</label>
                  <Input value={newContact.lastName} onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Pérez" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Email *</label>
                  <Input type="email" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="juan@empresa.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Teléfono</label>
                  <Input value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="+34 600 000 000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Cargo</label>
                  <Input value={newContact.jobTitle} onChange={(e) => setNewContact({...newContact, jobTitle: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Director General" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Estado</label>
                  <select value={newContact.lifecycle} onChange={(e) => setNewContact({...newContact, lifecycle: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospecto</option>
                    <option value="customer">Cliente</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleCreateContact} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newContact.firstName || !newContact.lastName || !newContact.email}>
                  Crear Contacto
                </Button>
                <Button variant="outline" onClick={() => setShowNewContactModal(false)}
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
        const activities = getActivitiesByContact(selectedContact.id)
        const deals = getDealsByContact(selectedContact.id)
        const company = selectedContact.company

        const filteredActivities = followUpFilter === 'todos'
          ? activities
          : activities.filter(a => a.followUpType === followUpFilter)

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

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">
                        {selectedContact.firstName} {selectedContact.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400">{selectedContact.jobTitle}</span>
                        <Badge className={`${getLifecycleColor(selectedContact.lifecycle)} rounded-full text-xs`}>
                          {getLifecycleLabel(selectedContact.lifecycle)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContactId(null)} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{deals.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deals</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activities.length}</p>
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
                {/* Filtro Seguimiento */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Seguimiento
                  </h3>
                  <div className="flex gap-2">
                    {(['todos', 'llamar', 'visitar'] as const).map((filter) => (
                      <Button
                        key={filter}
                        variant={followUpFilter === filter ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl gap-1.5"
                        onClick={() => setFollowUpFilter(filter)}
                      >
                        {filter === 'llamar' && <PhoneCall className="h-3.5 w-3.5" />}
                        {filter === 'visitar' && <MapPin className="h-3.5 w-3.5" />}
                        {filter === 'todos' ? 'Todos' : filter === 'llamar' ? 'Llamar' : 'Visitar'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Contacto Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Información
                  </h3>
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
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedContact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Empresa Asociada */}
                {company && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Empresa
                    </h3>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {company.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{company.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{company.industry} · {company.size} empleados</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deals */}
                {deals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Oportunidades ({deals.length})
                    </h3>
                    <div className="space-y-2">
                      {deals.map((deal) => (
                        <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                          <Briefcase className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{deal.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{getStageName(deal.stage)} · {deal.probability}%</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                            {formatCurrency(deal.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actividades filtradas */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Actividades ({filteredActivities.length})
                  </h3>
                  {filteredActivities.length > 0 ? (
                    <div className="space-y-2">
                      {filteredActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${typeIcons[activity.type] || ''}`}>
                            {typeLabels[activity.type] || activity.type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">{activity.subject}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.outcome}</p>
                            {activity.followUpType && (
                              <Badge className="mt-1 text-[10px] rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {activity.followUpType === 'llamar' ? 'Llamar' : 'Visitar'}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No hay actividades {followUpFilter !== 'todos' ? `de tipo "${followUpFilter}"` : ''}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button className="flex-1 rounded-xl" onClick={() => alert('Editar contacto - Próximamente')}>
                    Editar Contacto
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
    </div>
  )
}
