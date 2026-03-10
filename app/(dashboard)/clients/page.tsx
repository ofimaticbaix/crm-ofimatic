'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, DollarSign, Calendar, RefreshCw } from 'lucide-react'
import { getActiveCompanies, getInactiveCompanies, getContactsByCompany, getDealsByCompany, getActivitiesByCompany } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'

export default function ClientsPage() {
  const activeCompanies = getActiveCompanies()
  const inactiveCompanies = getInactiveCompanies()

  const getCompanyData = (companyId: string) => {
    const contacts = getContactsByCompany(companyId)
    const deals = getDealsByCompany(companyId)
    const activities = getActivitiesByCompany(companyId)
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
    const lastActivity = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    return { contacts, deals, totalValue, lastActivity }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
        <p className="text-xs md:text-sm text-white mt-1">
          {activeCompanies.length} activos · {inactiveCompanies.length} inactivos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">{activeCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Activos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-500 dark:text-gray-400">{inactiveCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Inactivos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{activeCompanies.length + inactiveCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Clients */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Clientes Activos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {activeCompanies.map((company) => {
            const { contacts, deals, totalValue, lastActivity } = getCompanyData(company.id)
            return (
              <Card key={company.id} className="border-green-200 dark:border-green-800/40 hover:shadow-xl transition-all">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                        {company.name[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{company.name}</h3>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{company.industry}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[10px] flex-shrink-0">
                      Activo
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                        <Users className="h-3.5 w-3.5" />
                        Contactos
                      </span>
                      <span className="text-gray-900 dark:text-white font-bold">{contacts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        Valor deals
                      </span>
                      <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(totalValue)}</span>
                    </div>
                    {lastActivity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          Última actividad
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold text-xs">
                          {new Date(lastActivity.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mini avatars */}
                  {contacts.length > 0 && (
                    <div className="flex items-center gap-1 pt-2 border-t border-gray-700/30">
                      {contacts.slice(0, 4).map((c) => (
                        <div key={c.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-medium" title={`${c.firstName} ${c.lastName}`}>
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                      ))}
                      {contacts.length > 4 && (
                        <span className="text-xs text-gray-400 ml-1">+{contacts.length - 4}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Inactive Clients */}
      {inactiveCompanies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Clientes Inactivos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {inactiveCompanies.map((company) => {
              const { contacts, totalValue } = getCompanyData(company.id)
              return (
                <Card key={company.id} className="border-gray-300 dark:border-gray-700 opacity-80 hover:opacity-100 hover:shadow-xl transition-all">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                          {company.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">{company.name}</h3>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{company.industry}</p>
                        </div>
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full text-[10px] flex-shrink-0">
                        Inactivo
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <Users className="h-3.5 w-3.5" /> Contactos
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">{contacts.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <DollarSign className="h-3.5 w-3.5" /> Valor deals
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(totalValue)}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/50 gap-2"
                      onClick={() => alert(`Reactivar ${company.name} - Próximamente`)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reactivar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
