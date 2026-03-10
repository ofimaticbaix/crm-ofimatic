'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { getOverdueCompanies, getContactsByCompany, getDealsByCompany, getActivitiesByCompany, getDaysSinceLastActivity } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'

export default function ClientesInactivosPage() {
  const overdueCompanies = getOverdueCompanies(7)

  const getCompanyData = (companyId: string) => {
    const contacts = getContactsByCompany(companyId)
    const deals = getDealsByCompany(companyId)
    const activities = getActivitiesByCompany(companyId)
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
    const lastActivity = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const daysSinceContact = getDaysSinceLastActivity(companyId)
    return { contacts, totalValue, lastActivity, daysSinceContact }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-500" /> Clientes Inactivos
        </h1>
        <p className="text-xs md:text-sm text-white mt-1">{overdueCompanies.length} clientes sin contacto en más de 7 días</p>
      </div>

      {overdueCompanies.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Acción requerida</p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Estos clientes llevan más de 7 días sin actividad. Contacta con ellos lo antes posible.
            </p>
          </div>
        </div>
      )}

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
                    Inactivo
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><Users className="h-3.5 w-3.5" /> Contactos</span>
                    <span className="text-gray-900 dark:text-white font-bold">{contacts.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><DollarSign className="h-3.5 w-3.5" /> Valor deals</span>
                    <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(totalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Dias sin contacto</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{daysSinceContact}d</span>
                  </div>
                  {lastActivity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><Calendar className="h-3.5 w-3.5" /> Última actividad</span>
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
                    {contacts.length > 4 && <span className="text-xs text-gray-400 ml-1">+{contacts.length - 4}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {overdueCompanies.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No hay clientes inactivos. Todos están al día.</p>
      )}
    </div>
  )
}
