'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Globe, Users } from 'lucide-react'
import { mockCompanies } from '@/lib/mock-data'

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCompanies = mockCompanies.filter(company => {
    const query = searchQuery.toLowerCase()
    return (
      company.name.toLowerCase().includes(query) ||
      company.industry?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Empresas</h1>
          <p className="text-xs md:text-sm text-white mt-1">{filteredCompanies.length} empresas totales</p>
        </div>
        <Button className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
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
    </div>
  )
}
