'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Building2, Target, CheckCircle2, Clock, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl md:text-3xl">👋</span>
            Hola, Alex
          </h1>
          <p className="text-xs md:text-sm text-white mt-1">Esto es lo que está pasando hoy</p>
        </div>
      </div>

      {/* KPI Cards - Más visuales y simples */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                +12%
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1">Ventas</p>
            <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white truncate">{formatCurrency(metrics.totalValue)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Target className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {mockDeals.length}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1">Previsión</p>
            <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white truncate">{formatCurrency(metrics.weightedValue)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                +5%
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1">Éxito</p>
            <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white">{metrics.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              {overdueTasks.length > 0 && (
                <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  {overdueTasks.length}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1">Tareas</p>
            <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white">{upcomingTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  Tus Tareas
                </CardTitle>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">Ver todas →</Button>
                </Link>
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
                            <span className="font-medium text-gray-900 dark:text-white truncate">{task.title}</span>
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
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{deal.name}</div>
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
        <div className="space-y-4 md:space-y-6">
          {/* Mini Calendar */}
          <MiniCalendar tasks={mockTasks} />

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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.subject}</p>
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

/* ─── Mini Calendar Component ─── */

function MiniCalendar({ tasks }: { tasks: typeof mockTasks }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expanded, setExpanded] = useState(false)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1 // Lunes = 0

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  // Días con tareas pendientes
  const taskDays = new Set(
    tasks
      .filter(t => !t.isCompleted)
      .map(t => {
        const d = new Date(t.dueDate)
        if (d.getMonth() === month && d.getFullYear() === year) return d.getDate()
        return null
      })
      .filter(Boolean)
  )

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

  const calendarGrid = (compact: boolean) => (
    <>
      {/* Day headers */}
      <div className={`grid grid-cols-7 mb-1 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {dayNames.map(d => (
          <div key={d} className={`text-center font-medium text-gray-500 dark:text-gray-400 ${compact ? 'text-[10px]' : 'text-xs py-1'}`}>
            {d}
          </div>
        ))}
      </div>
      {/* Days */}
      <div className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const hasTask = taskDays.has(day)
          return (
            <div
              key={day}
              className={`
                relative flex items-center justify-center rounded-lg transition-all
                ${compact ? 'h-7 w-7 text-xs mx-auto' : 'h-9 w-9 text-sm mx-auto'}
                ${isToday(day)
                  ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
            >
              {day}
              {hasTask && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-400 ${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'}`} />
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  // Tareas del día seleccionado (hoy por defecto en expanded)
  const todayTasks = tasks.filter(t => {
    const d = new Date(t.dueDate)
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })

  return (
    <>
      {/* Mini version in sidebar */}
      <Card
        className="cursor-pointer hover:shadow-xl transition-all"
        onClick={() => setExpanded(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-500" />
              Calendario
            </CardTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); prevMonth() }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize min-w-[100px] text-center">
                {monthName}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); nextMonth() }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-3">
          {calendarGrid(true)}
        </CardContent>
      </Card>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <Card
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Calendario
                </CardTitle>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                  {monthName}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {calendarGrid(false)}

              {/* Tasks for today */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Tareas de hoy
                </h4>
                {todayTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Sin tareas para hoy</p>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
