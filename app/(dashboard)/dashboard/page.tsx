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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Buenos días, Alex 👋
        </h1>
        <p className="text-gray-500 mt-1">Aquí está tu resumen de ventas de hoy</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Forecast Ponderado</CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.weightedValue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {mockDeals.length} deals activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasa de Conversión</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.conversionRate}%</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +5% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tareas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{upcomingTasks.length}</div>
            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {overdueTasks.length} vencidas
            </p>
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
                <CardTitle>Mis Tareas de Hoy</CardTitle>
                <Button variant="ghost" size="sm">Ver todas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const deal = mockDeals.find(d => d.id === task.dealId)
                  const isOverdue = new Date(task.dueDate) < new Date()

                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{task.title}</span>
                          {task.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">Alta</Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Vencida</Badge>
                          )}
                        </div>
                        {deal && (
                          <p className="text-sm text-gray-500 mt-1">{deal.name}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{task.dueDate}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Deals closing this week */}
          <Card>
            <CardHeader>
              <CardTitle>Deals que Cierran Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {closingThisWeek.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{deal.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{deal.company?.name}</span>
                        <Badge variant="outline" className="text-xs">{deal.stageName}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(deal.value)}</div>
                      <div className="text-xs text-gray-500">{deal.expectedCloseDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                Insights AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">3 deals en riesgo</p>
                      <p className="text-xs text-red-700 mt-1">Sin actividad en 7+ días</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">2 follow-ups pendientes</p>
                      <p className="text-xs text-yellow-700 mt-1">High-value deals necesitan atención</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Pipeline trending up</p>
                      <p className="text-xs text-green-700 mt-1">+12% vs mes pasado</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
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
