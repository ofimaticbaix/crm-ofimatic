'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Mail, Phone, Building2, X } from 'lucide-react'
import { getContactsWithCompany } from '@/lib/mock-data'

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewContactModal, setShowNewContactModal] = useState(false)
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

  const getLifecycleColor = (lifecycle: string) => {
    switch (lifecycle) {
      case 'customer':
        return 'bg-green-100 text-green-800'
      case 'prospect':
        return 'bg-blue-100 text-blue-800'
      case 'lead':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLifecycleLabel = (lifecycle: string) => {
    switch (lifecycle) {
      case 'customer':
        return 'Cliente'
      case 'prospect':
        return 'Prospecto'
      case 'lead':
        return 'Lead'
      default:
        return lifecycle
    }
  }

  const handleCreateContact = () => {
    // En producción, aquí harías una llamada al backend
    alert(`Contacto creado: ${newContact.firstName} ${newContact.lastName}`)
    setShowNewContactModal(false)
    setNewContact({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      lifecycle: 'lead'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contactos</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{filteredContacts.length} contactos totales</p>
        </div>
        <Button
          onClick={() => setShowNewContactModal(true)}
          className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
              />
            </div>
            <Button variant="outline" className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">Filtros</Button>
            <Button variant="outline" className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">Exportar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {contact.firstName} {contact.lastName}
                          </div>
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
                        <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          {contact.email}
                        </a>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <Button variant="ghost" size="sm" className="rounded-xl">Ver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {contacts.filter(c => c.lifecycle === 'customer').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Clientes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {contacts.filter(c => c.lifecycle === 'prospect').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Prospectos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {contacts.filter(c => c.lifecycle === 'lead').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Nuevo Contacto */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nuevo Contacto</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewContactModal(false)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Nombre *
                  </label>
                  <Input
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Apellido *
                  </label>
                  <Input
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Pérez"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="juan@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Teléfono
                  </label>
                  <Input
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Cargo
                  </label>
                  <Input
                    value={newContact.jobTitle}
                    onChange={(e) => setNewContact({...newContact, jobTitle: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Director General"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Estado
                  </label>
                  <select
                    value={newContact.lifecycle}
                    onChange={(e) => setNewContact({...newContact, lifecycle: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospecto</option>
                    <option value="customer">Cliente</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateContact}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newContact.firstName || !newContact.lastName || !newContact.email}
                >
                  Crear Contacto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewContactModal(false)}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
                >
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
