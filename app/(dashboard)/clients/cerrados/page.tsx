'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, Clock, Lock, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompaniesWithStatus, type CompanyWithStatus } from '@/lib/actions/clients'

export default function ClientesCerradosPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [companies, setCompanies] = useState<CompanyWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (wsLoading || !workspaceId) return
    setLoading(true)
    getCompaniesWithStatus(workspaceId)
      .then(res => {
        if (res.error) setError(res.error)
        else setCompanies(res.data?.closed || [])
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [workspaceId, wsLoading])

  if (wsLoading || loading) {
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
          <Lock className="h-7 w-7 text-gray-500 dark:text-gray-400" /> Clientes Cerrados
        </h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">{companies.length} clientes cerrados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="border-gray-300 dark:border-gray-700 opacity-70 hover:opacity-100 hover:shadow-xl transition-all">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{company.name}</h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{company.industry}</p>
                  </div>
                </div>
                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full text-[10px] flex-shrink-0">
                  Cerrado
                </Badge>
              </div>
              <div className="space-y-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {companies.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No hay clientes cerrados</p>
      )}
    </div>
  )
}
