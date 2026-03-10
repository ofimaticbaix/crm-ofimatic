'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, DollarSign, Calendar, Lock, AlertTriangle, Clock } from 'lucide-react'
import { getActiveCompanies, getClosedCompanies, getOverdueCompanies, getContactsByCompany, getDealsByCompany, getActivitiesByCompany, getDaysSinceLastActivity } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'

export default function ClientsPage() {
  const activeCompanies = getActiveCompanies()
  const closedCompanies = getClosedCompanies()
  const overdueCompanies = getOverdueCompanies(7)
  // Activos sin atraso
  const healthyCompanies = activeCompanies.filter(c => !overdueCompanies.find(o => o.id === c.id))

  const getCompanyData = (companyId: string) => {
    const contacts = getContactsByCompany(companyId)
    const deals = getDealsByCompany(companyId)
    const activities = getActivitiesByCompany(companyId)
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
    const lastActivity = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const daysSinceContact = getDaysSinceLastActivity(companyId)
    return { contacts, deals, totalValue, lastActivity, daysSinceContact }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
        <p className="text-xs md:text-sm text-white mt-1">
          {healthyCompanies.length} activos · {overdueCompanies.length} atrasados · {closedCompanies.length} cerrados
        </p>
      </div>

      {/* Notificación Clientes Atrasados */}
      {overdueCompanies.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-200">
              {overdueCompanies.length} cliente{overdueCompanies.length > 1 ? 's' : ''} sin contacto reciente
            </p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              {overdueCompanies.map(c => c.name).join(', ')} — llevan mas de 7 dias sin actividad registrada.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">{healthyCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Activos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-amber-500">{overdueCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Atrasados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-500 dark:text-gray-400">{closedCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Cerrados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{activeCompanies.length + closedCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Activos */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Clientes Activos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {healthyCompanies.map((company) => {
            const { contacts, totalValue, lastActivity, daysSinceContact } = getCompanyData(company.id)
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                        <Clock className="h-3.5 w-3.5" /> Dias sin contacto
                      </span>
                      <span className="text-gray-900 dark:text-white font-bold">{daysSinceContact}d</span>
                    </div>
                    {lastActivity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <Calendar className="h-3.5 w-3.5" /> Última actividad
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold text-xs">
                          {new Date(lastActivity.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>

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
          {healthyCompanies.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full text-center py-6">Todos los clientes activos tienen atraso</p>
          )}
        </div>
      </div>

      {/* Clientes Atrasados */}
      {overdueCompanies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Clientes Atrasados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {overdueCompanies.map((company) => {
              const { contacts, totalValue, lastActivity, daysSinceContact } = getCompanyData(company.id)
              return (
                <Card key={company.id} className="border-amber-300 dark:border-amber-700/50 hover:shadow-xl transition-all bg-amber-50/5">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                          {company.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">{company.name}</h3>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{company.industry}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-[10px] flex-shrink-0">
                        Atrasado
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
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Dias sin contacto
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{daysSinceContact}d</span>
                      </div>
                      {lastActivity && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                            <Calendar className="h-3.5 w-3.5" /> Última actividad
                          </span>
                          <span className="text-gray-900 dark:text-white font-bold text-xs">
                            {new Date(lastActivity.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {contacts.length > 0 && (
                      <div className="flex items-center gap-1 pt-2 border-t border-amber-700/30">
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
      )}

      {/* Clientes Cerrados */}
      {closedCompanies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-400" /> Clientes Cerrados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {closedCompanies.map((company) => {
              const { contacts, totalValue, daysSinceContact } = getCompanyData(company.id)
              return (
                <Card key={company.id} className="border-gray-300 dark:border-gray-700 opacity-70 hover:opacity-100 hover:shadow-xl transition-all">
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
                        Cerrado
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
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <Clock className="h-3.5 w-3.5" /> Dias sin contacto
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">{daysSinceContact}d</span>
                      </div>
                    </div>
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
