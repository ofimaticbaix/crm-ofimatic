'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, Users, Building2, DollarSign, Target, CheckSquare,
  Clock, BarChart3, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getFullMetrics, type FullMetrics } from '@/lib/actions/metrics'

const emptyMetrics: FullMetrics = {
  pipeline: { totalValue: 0, weightedValue: 0, avgDealSize: 0, conversionRate: 0, dealsByStage: [] },
  contacts: { total: 0, byLifecycle: { customer: 0, prospect: 0, lead: 0 } },
  companies: { total: 0, active: 0, inactive: 0 },
  activities: { total: 0, byType: { call: 0, email: 0, meeting: 0, task: 0, note: 0 } },
  tasks: { total: 0, pending: 0, overdue: 0, completed: 0, highPriority: 0, byType: {} },
}

export default function MetricsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [metrics, setMetrics] = useState<FullMetrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    async function loadMetrics() {
      setLoading(true)
      try {
        const res = await getFullMetrics(workspaceId)
        if (res.data) setMetrics(res.data)
      } catch (err) {
        console.error('Metrics load error:', err)
      }
      setLoading(false)
    }
    loadMetrics()
  }, [workspaceId])

  if (wsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const { pipeline, contacts, companies, activities, tasks } = metrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="h-8 w-8" /> Métricas Rápidas
        </h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">Vista general de rendimiento del CRM</p>
      </div>

      {/* KPI Cards Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(pipeline.totalValue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pipeline Total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(pipeline.weightedValue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pipeline Ponderado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(pipeline.avgDealSize)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ticket Medio</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{pipeline.conversionRate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasa de Conversión</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: Clientes + Contactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado Clientes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Estado de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Activos</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{companies.active}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Inactivos</span>
                  <span className="text-[10px] text-gray-400 ml-2">+7 días sin actividad</span>
                </div>
              </div>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{companies.inactive}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total empresas</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{companies.total}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contactos por Lifecycle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Contactos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Clientes</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{contacts.byLifecycle.customer}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Prospectos</span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{contacts.byLifecycle.prospect}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Leads</span>
              </div>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{contacts.byLifecycle.lead}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total contactos</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{contacts.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila 3: Pipeline por Etapa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 dark:text-white text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Pipeline por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipeline.dealsByStage.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay deals en el pipeline</p>
            ) : (
              pipeline.dealsByStage.map(stage => {
                const maxValue = Math.max(...pipeline.dealsByStage.map(s => s.value))
                const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
                return (
                  <div key={stage.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.name}</span>
                        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] rounded-full">
                          {stage.count} deal{stage.count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(stage.value)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fila 4: Tareas + Actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tareas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Resumen de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tasks.pending}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Pendientes</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{tasks.overdue}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Vencidas</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tasks.highPriority}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Alta Prioridad</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Por tipo</p>
              {Object.entries(tasks.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300 capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividades */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Resumen de Actividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{activities.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Actividades</p>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Por tipo</p>
              {[
                { key: 'call', label: 'Llamadas', color: 'text-green-500' },
                { key: 'email', label: 'Emails', color: 'text-blue-500' },
                { key: 'meeting', label: 'Reuniones', color: 'text-purple-500' },
                { key: 'task', label: 'Tareas', color: 'text-orange-500' },
                { key: 'note', label: 'Notas', color: 'text-yellow-500' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{label}</span>
                  <span className={`font-bold ${color}`}>{activities.byType[key as keyof typeof activities.byType]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
