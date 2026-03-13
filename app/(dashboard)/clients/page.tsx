'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, Calendar, Lock, AlertTriangle, Clock, Loader2, CalendarCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompaniesWithStatus, type CompaniesGrouped, type CompanyWithStatus } from '@/lib/actions/clients'
import { useCachedData } from '@/lib/hooks/use-cached-data'

export default function ClientsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()

  // Cached data - loads instantly if cached
  const { data, loading: dataLoading, error } = useCachedData<CompaniesGrouped>(
    `clients-status-${workspaceId}`,
    () => getCompaniesWithStatus(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

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

  const activeCompanies = data?.active || []
  const overdueCompanies = data?.overdue || []
  const closedCompanies = data?.closed || []
  const total = activeCompanies.length + overdueCompanies.length + closedCompanies.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">
          {activeCompanies.length} activos · {overdueCompanies.length} atrasados · {closedCompanies.length} cerrados
        </p>
      </div>

      {/* Notificacion Clientes Atrasados */}
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
            <div className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">{activeCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Activos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-amber-500">{overdueCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Atrasados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-500 dark:text-gray-400">{closedCompanies.length}</div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Cerrados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{total}</div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Activos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Clientes Activos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {activeCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} variant="active" />
          ))}
          {activeCompanies.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 col-span-full text-center py-6">No hay clientes activos</p>
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
            {overdueCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} variant="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Clientes Cerrados */}
      {closedCompanies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Clientes Cerrados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {closedCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} variant="closed" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company, variant }: { company: CompanyWithStatus; variant: 'active' | 'overdue' | 'closed' }) {
  const gradientMap = {
    active: 'from-green-500 to-emerald-600',
    overdue: 'from-amber-500 to-orange-600',
    closed: 'from-gray-400 to-gray-500',
  }
  const borderMap = {
    active: 'border-green-200 dark:border-green-800/40',
    overdue: 'border-amber-300 dark:border-amber-700/50 bg-amber-50/5',
    closed: 'border-gray-300 dark:border-gray-700 opacity-70 hover:opacity-100',
  }
  const badgeMap = {
    active: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Activo' },
    overdue: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Atrasado' },
    closed: { className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Cerrado' },
  }
  const borderTMap = {
    active: 'border-gray-200 dark:border-gray-700/30',
    overdue: 'border-amber-200 dark:border-amber-700/30',
    closed: 'border-gray-200 dark:border-gray-700/30',
  }

  return (
    <Card className={`${borderMap[variant]} hover:shadow-xl transition-all`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradientMap[variant]} flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
              {company.name[0]}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{company.name}</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{company.industry}</p>
            </div>
          </div>
          <Badge className={`${badgeMap[variant].className} rounded-full text-[10px] flex-shrink-0`}>
            {badgeMap[variant].label}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
              <Users className="h-3.5 w-3.5" /> Contactos
            </span>
            <span className="text-gray-900 dark:text-white font-bold">{company.contact_count}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
              <DollarSign className="h-3.5 w-3.5" /> Valor deals
            </span>
            <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(company.total_deal_value)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            {variant === 'overdue' ? (
              <>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Dias sin contacto
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{company.days_since_activity ?? '?'}d</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                  <Clock className="h-3.5 w-3.5" /> Dias sin contacto
                </span>
                <span className="text-gray-900 dark:text-white font-bold">{company.days_since_activity ?? '?'}d</span>
              </>
            )}
          </div>
          {company.next_activity_date && variant === 'active' && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                <CalendarCheck className="h-3.5 w-3.5" /> Proxima actividad
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold text-xs">
                {new Date(company.next_activity_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
          {company.last_activity_date && variant !== 'closed' && !company.next_activity_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <Calendar className="h-3.5 w-3.5" /> Ultima actividad
              </span>
              <span className="text-gray-900 dark:text-white font-bold text-xs">
                {new Date(company.last_activity_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
        </div>

        {company.contacts.length > 0 && variant !== 'closed' && (
          <div className={`flex items-center gap-1 pt-2 border-t ${borderTMap[variant]}`}>
            {company.contacts.slice(0, 4).map((c) => (
              <div key={c.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-medium" title={`${c.first_name} ${c.last_name}`}>
                {c.first_name[0]}{c.last_name[0]}
              </div>
            ))}
            {company.contacts.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">+{company.contacts.length - 4}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
