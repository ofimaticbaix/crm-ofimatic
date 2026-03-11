'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Building2, Target, CheckCircle2, Clock, Calendar, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', time: '09:00', priority: 'medium' as 'high' | 'medium' | 'low' })

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  // Map: day number -> tasks for that day
  const tasksByDay = new Map<number, typeof tasks>()
  tasks.forEach(t => {
    const d = new Date(t.dueDate)
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate()
      if (!tasksByDay.has(day)) tasksByDay.set(day, [])
      tasksByDay.get(day)!.push(t)
    }
  })

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null) }
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null) }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isSelected = (day: number) => selectedDay === day

  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

  // Tareas del día seleccionado (o hoy si no hay selección)
  const activeDay = selectedDay ?? (month === today.getMonth() && year === today.getFullYear() ? today.getDate() : 1)
  const activeDayTasks = tasksByDay.get(activeDay) ?? []
  const activeDayDate = new Date(year, month, activeDay)
  const activeDayLabel = activeDayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleDayClick = (day: number, openExpanded: boolean) => {
    setSelectedDay(day)
    if (openExpanded) setExpanded(true)
  }

  const handleCreateTask = () => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(activeDay).padStart(2, '0')}`
    alert(`Tarea creada: "${newTask.title}" para ${dateStr} a las ${newTask.time} (prioridad: ${newTask.priority})`)
    setNewTask({ title: '', time: '09:00', priority: 'medium' })
    setShowNewTask(false)
  }

  const priorityLabel: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }
  const typeIcons: Record<string, string> = { llamada: '📞', reunion: '🤝', tarea: '📋', visita: '🏢', email: '📧' }

  const calendarGrid = (compact: boolean) => (
    <>
      <div className={`grid grid-cols-7 mb-1 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {dayNames.map(d => (
          <div key={d} className={`text-center font-medium text-gray-500 dark:text-gray-400 ${compact ? 'text-[10px]' : 'text-xs py-1'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayTasks = tasksByDay.get(day) ?? []
          const hasPending = dayTasks.some(t => !t.isCompleted)
          const hasHighPriority = dayTasks.some(t => !t.isCompleted && t.priority === 'high')
          return (
            <button
              key={day}
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDayClick(day, !expanded) }}
              className={`
                relative flex items-center justify-center rounded-lg transition-all
                ${compact ? 'h-7 w-7 text-xs mx-auto' : 'h-9 w-9 text-sm mx-auto cursor-pointer'}
                ${isSelected(day) && !isToday(day)
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-300 dark:ring-blue-700'
                  : isToday(day)
                    ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
            >
              {day}
              {hasPending && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full ${hasHighPriority ? 'bg-red-500' : 'bg-orange-400'} ${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'}`} />
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <>
      {/* Mini version in sidebar */}
      <Card className="hover:shadow-xl transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => setExpanded(true)}>
              <Calendar className="h-4 w-4 text-blue-500" />
              Calendario
            </CardTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize min-w-[100px] text-center">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4"
          onClick={() => { setExpanded(false); setShowNewTask(false) }}
        >
          <Card
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Calendario
                </CardTitle>
                <button
                  onClick={() => { setExpanded(false); setShowNewTask(false) }}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                  {monthName}
                </span>
                <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {calendarGrid(false)}

              {/* Tasks for selected day */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase capitalize">
                    {activeDayLabel}
                  </h4>
                  <button
                    onClick={() => setShowNewTask(!showNewTask)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva tarea
                  </button>
                </div>

                {/* New task form */}
                {showNewTask && (
                  <div className="mb-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 space-y-2">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Nombre de la tarea..."
                      className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newTask.time}
                        onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'high' | 'medium' | 'low' })}
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baja</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateTask}
                        disabled={!newTask.title.trim()}
                        className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Crear tarea
                      </button>
                      <button
                        onClick={() => { setShowNewTask(false); setNewTask({ title: '', time: '09:00', priority: 'medium' }) }}
                        className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Task list */}
                {activeDayTasks.length === 0 && !showNewTask ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Sin tareas para este día</p>
                    <button
                      onClick={() => setShowNewTask(true)}
                      className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                    >
                      + Añadir una tarea
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeDayTasks
                      .sort((a, b) => (a.dueTime ?? '').localeCompare(b.dueTime ?? ''))
                      .map(task => (
                      <div key={task.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${task.isCompleted ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          readOnly
                          className="mt-0.5 h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {task.dueTime && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {task.dueTime}
                              </span>
                            )}
                            <span className="text-xs">{typeIcons[task.type] ?? '📋'}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              task.priority === 'high'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : task.priority === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>
                              {priorityLabel[task.priority]}
                            </span>
                          </div>
                        </div>
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
