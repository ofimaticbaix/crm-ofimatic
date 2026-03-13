'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, Calendar, Clock, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompaniesWithStatus, type CompanyWithStatus, type CompaniesGrouped } from '@/lib/actions/clients'
import { useCachedData } from '@/lib/hooks/use-cached-data'

export default function ClientesActivosPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()

  // Cached data - shares cache with main clients page
  const { data, loading: dataLoading, error } = useCachedData<CompaniesGrouped>(
    `clients-status-${workspaceId}`,
    () => getCompaniesWithStatus(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const companies = data?.active || []

  // Overall loading - only block if no cached data
  const loading = wsLoading || (dataLoading && !data)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-400">Error al cargar clientes: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes Activos</h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">{companies.length} clientes con actividad reciente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="border-green-200 dark:border-green-800/40 hover:shadow-xl transition-all">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{company.name}</h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{company.industry}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[10px] flex-shrink-0">
                  Activo
                </Badge>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><Users className="h-3.5 w-3.5" /> Contactos</span>
                  <span className="text-gray-900 dark:text-white font-bold">{company.contact_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><DollarSign className="h-3.5 w-3.5" /> Valor deals</span>
                  <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(company.total_deal_value)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><Clock className="h-3.5 w-3.5" /> Dias sin contacto</span>
                  <span className="text-gray-900 dark:text-white font-bold">{company.days_since_activity ?? '?'}d</span>
                </div>
                {company.last_activity_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><Calendar className="h-3.5 w-3.5" /> Ultima actividad</span>
                    <span className="text-gray-900 dark:text-white font-bold text-xs">
                      {new Date(company.last_activity_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
              </div>
              {company.contacts.length > 0 && (
                <div className="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700/30">
                  {company.contacts.slice(0, 4).map((c) => (
                    <div key={c.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-medium" title={`${c.first_name} ${c.last_name}`}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                  ))}
                  {company.contacts.length > 4 && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">+{company.contacts.length - 4}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {companies.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No hay clientes activos sin atraso</p>
      )}
    </div>
  )
}
