'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, Calendar, Clock, AlertTriangle, Loader2, CalendarCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompaniesWithStatus, type CompanyWithStatus, type CompaniesGrouped } from '@/lib/actions/clients'
import { useCachedData } from '@/lib/hooks/use-cached-data'

export default function ClientesInactivosPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()

  // Cached data - shares cache with main clients page
  const { data, loading: dataLoading, error } = useCachedData<CompaniesGrouped>(
    `clients-status-${workspaceId}`,
    () => getCompaniesWithStatus(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const companies = data?.overdue || []

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
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-500" /> Clientes Inactivos
        </h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">{companies.length} clientes sin contacto en mas de 7 dias</p>
      </div>

      {companies.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Accion requerida</p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Estos clientes llevan mas de 7 dias sin actividad. Contacta con ellos lo antes posible.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="border-amber-300 dark:border-amber-700/50 hover:shadow-xl transition-all bg-amber-50/5">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{company.name}</h3>
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
                  <span className="text-gray-900 dark:text-white font-bold">{company.contact_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium"><DollarSign className="h-3.5 w-3.5" /> Valor deals</span>
                  <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(company.total_deal_value)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Dias sin contacto</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{company.days_since_activity ?? '?'}d</span>
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
                <div className="flex items-center gap-1 pt-2 border-t border-amber-200 dark:border-amber-700/30">
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
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No hay clientes inactivos. Todos estan al dia.</p>
      )}
    </div>
  )
}
