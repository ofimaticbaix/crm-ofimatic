import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Users, Building2, Target, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { calculatePipelineMetrics, mockTasks, mockDeals, mockActivities, getDealsWithRelations } from '@/lib/mock-data'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function DashboardPage() {
  const metrics = calculatePipelineMetrics()
  const upcomingTasks = mockTasks.filter(t => !t.isCompleted).slice(0, 5)
  const recentActivity = mockActivities.slice(0, 5)
  const closingThisWeek = getDealsWithRelations().filter(d => {
    const closeDate = new Date(d.expectedCloseDate)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return closeDate >= today && closeDate <= nextWeek
  })

  const overdueTasks = mockTasks.filter(t => !t.isCompleted && new Date(t.dueDate) < new Date())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">👋</span>
            Hola, Alex
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Esto es lo que está pasando hoy</p>
        </div>
      </div>

      {/* KPI Cards - Más visuales y simples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                +12%
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ventas Totales</p>
            <div className="text-3xl font-bold text-white">{formatCurrency(metrics.totalValue)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {mockDeals.length} activos
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Previsión</p>
            <div className="text-3xl font-bold text-white">{formatCurrency(metrics.weightedValue)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                +5%
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Éxito de Ventas</p>
            <div className="text-3xl font-bold text-white">{metrics.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              {overdueTasks.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  {overdueTasks.length} vencidas
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tareas Pendientes</p>
            <div className="text-3xl font-bold text-white">{upcomingTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  Tus Tareas
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">Ver todas →</Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">¡Todo listo! No tienes tareas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map((task) => {
                    const deal = mockDeals.find(d => d.id === task.dealId)
                    const isOverdue = new Date(task.dueDate) < new Date()

                    return (
                      <div key={task.id} className="flex items-center gap-3 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-800/30 transition-all group">
                        <input type="checkbox" className="h-5 w-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white truncate">{task.title}</span>
                            {task.priority === 'high' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                ⚠️ Urgente
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                Vencida
                              </span>
                            )}
                          </div>
                          {deal && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{deal.name}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{task.dueDate}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals closing this week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Próximos Cierres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {closingThisWeek.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No hay ventas cerrando esta semana</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closingThisWeek.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 border border-transparent hover:border-green-200/50 dark:hover:border-green-800/30 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{deal.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{deal.company?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(deal.value)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{deal.expectedCloseDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card className="border-t-4 border-t-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <span className="text-2xl">✨</span>
                Recomendaciones IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border border-red-200/50 dark:border-red-800/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200">¡Atención necesaria!</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">3 ventas sin actividad en 7+ días</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10 border border-yellow-200/50 dark:border-yellow-800/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Recordatorio</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">2 seguimientos importantes pendientes</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border border-green-200/50 dark:border-green-800/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-200">¡Buen trabajo!</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">Ventas creciendo +12% este mes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3 relative">
                    {index !== recentActivity.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-px bg-gradient-to-b from-blue-200 to-transparent dark:from-blue-800" />
                    )}
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400 mt-1 ring-4 ring-white dark:ring-gray-800 z-10" />
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium text-white">{activity.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
