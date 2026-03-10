'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Globe, Users, X } from 'lucide-react'
import { mockCompanies } from '@/lib/mock-data'

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    size: '',
    website: ''
  })

  const filteredCompanies = mockCompanies.filter(company => {
    const query = searchQuery.toLowerCase()
    return (
      company.name.toLowerCase().includes(query) ||
      company.industry?.toLowerCase().includes(query)
    )
  })

  const handleCreateCompany = () => {
    alert(`Empresa creada: ${newCompany.name}`)
    setShowNewCompanyModal(false)
    setNewCompany({
      name: '',
      industry: '',
      size: '',
      website: ''
    })
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Empresas</h1>
          <p className="text-xs md:text-sm text-white mt-1">{filteredCompanies.length} empresas totales</p>
        </div>
        <Button
          onClick={() => setShowNewCompanyModal(true)}
          className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Buscar empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="p-4 md:p-6">
              {/* Company Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white mb-2">
                    {company.name}
                  </h3>
                  <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">
                    {company.industry}
                  </Badge>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {company.name[0]}
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span>{company.size} empleados</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <a href={`https://${company.website}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="ghost" size="sm" className="w-full rounded-xl dark:text-gray-300 dark:hover:bg-gray-800/50">
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Nueva Empresa */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nueva Empresa</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewCompanyModal(false)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Nombre de la Empresa *
                  </label>
                  <Input
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Industria *
                  </label>
                  <Input
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Tecnología"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Tamaño (empleados) *
                  </label>
                  <Input
                    value={newCompany.size}
                    onChange={(e) => setNewCompany({...newCompany, size: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="50-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Sitio Web
                  </label>
                  <Input
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({...newCompany, website: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="ejemplo.com"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateCompany}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newCompany.name || !newCompany.industry || !newCompany.size}
                >
                  Crear Empresa
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewCompanyModal(false)}
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
