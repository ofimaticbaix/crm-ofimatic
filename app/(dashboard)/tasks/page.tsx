'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, Plus, Calendar, X, ChevronLeft, ChevronRight, List, CalendarDays, Building2, User, Clock, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getTasks, createTask, toggleTaskComplete } from '@/lib/actions/tasks'
import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import { getDeals } from '@/lib/actions/deals'

// Type for a task (activity) from Supabase with relations
interface Task {
  id: string
  subject: string
  type: string
  due_date: string | null
  scheduled_at: string | null
  is_completed: boolean
  completed_at: string | null
  metadata: Record<string, any> | null
  contact_id: string | null
  company_id: string | null
  deal_id: string | null
  workspace_id: string
  contacts: { id: string; first_name: string; last_name: string } | null
  companies: { id: string; name: string } | null
  deals: { id: string; name: string } | null
}

export default function TasksPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario')
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    dealId: '',
    companyId: '',
    contactId: '',
    type: 'task'
  })

  // Data state
  const [tasks, setTasks] = useState<Task[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const [tasksRes, companiesRes, contactsRes, dealsRes] = await Promise.all([
        getTasks(workspaceId),
        getCompanies(workspaceId),
        getContacts(workspaceId),
        getDeals(workspaceId),
      ])
      if (tasksRes.data) setTasks(tasksRes.data as Task[])
      if (companiesRes.data) setCompanies(companiesRes.data)
      if (contactsRes.data) setContacts(contactsRes.data)
      if (dealsRes.data) setDeals(dealsRes.data)
    } catch (err) {
      console.error('Error loading tasks data:', err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (!wsLoading && workspaceId) {
      loadData()
    }
  }, [wsLoading, workspaceId, loadData])

  const allTasks = tasks
  const pendingTasks = allTasks.filter(t => !t.is_completed)
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date(new Date().toISOString().split('T')[0]))
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTasks = pendingTasks.filter(t => t.due_date === todayStr)

  const filteredContactsForNewTask = newTask.companyId
    ? contacts.filter(c => c.company_id === newTask.companyId)
    : contacts

  const handleCreateTask = async () => {
    if (!workspaceId || !newTask.title || !newTask.dueDate) return
    setCreating(true)
    try {
      const result = await createTask(workspaceId, {
        subject: newTask.title,
        type: newTask.type as any,
        due_date: newTask.dueDate,
        scheduled_at: newTask.dueTime ? `${newTask.dueDate}T${newTask.dueTime}:00` : undefined,
        contact_id: newTask.contactId || null,
        company_id: newTask.companyId || null,
        deal_id: newTask.dealId || null,
        metadata: {
          priority: newTask.priority,
          dueTime: newTask.dueTime || undefined,
        },
      })
      if (result.error) {
        console.error('Error creating task:', result.error)
      } else {
        setShowNewTaskModal(false)
        setNewTask({ title: '', dueDate: '', dueTime: '', priority: 'medium', dealId: '', companyId: '', contactId: '', type: 'task' })
        await loadData()
      }
    } catch (err) {
      console.error('Error creating task:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    try {
      const result = await toggleTaskComplete(taskId)
      if (!result.error) {
        await loadData()
      }
    } catch (err) {
      console.error('Error toggling task:', err)
    }
  }

  const getPriorityFromTask = (task: Task): string => {
    return task.metadata?.priority || 'medium'
  }

  const getDueTimeFromTask = (task: Task): string | null => {
    if (task.metadata?.dueTime) return task.metadata.dueTime
    if (task.scheduled_at) {
      const time = new Date(task.scheduled_at)
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
    }
    return null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'task': 'Tarea', 'call': 'Llamada', 'meeting': 'Reunion', 'email': 'Email', 'note': 'Nota'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'task': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'call': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'email': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'meeting': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'note': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    }
    return colors[type] || ''
  }

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday start
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false })
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      days.push({ date: date.toISOString().split('T')[0], day: d, isCurrentMonth: true })
    }
    // Next month fill
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d)
      days.push({ date: date.toISOString().split('T')[0], day: d, isCurrentMonth: false })
    }
    return days
  }, [currentMonth])

  const tasksByDateMap = useMemo(() => {
    const map: Record<string, Task[]> = {}
    allTasks.forEach(t => {
      const date = t.due_date
      if (!date) return
      if (!map[date]) map[date] = []
      map[date].push(t)
    })
    return map
  }, [allTasks])

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const navigateMonth = (dir: number) => {
    setCurrentMonth(prev => {
      let m = prev.month + dir
      let y = prev.year
      if (m < 0) { m = 11; y-- }
      if (m > 11) { m = 0; y++ }
      return { year: y, month: m }
    })
  }

  const selectedDateTasks = selectedDate ? (tasksByDateMap[selectedDate] || []) : []

  const TaskRow = ({ task }: { task: Task }) => {
    const priority = getPriorityFromTask(task)
    const dueTime = getDueTimeFromTask(task)

    return (
      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
        <button onClick={() => handleToggleComplete(task.id)} className="mt-0.5 flex-shrink-0">
          {task.is_completed
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${task.is_completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{task.subject}</span>
            <Badge className={`${getPriorityColor(priority)} rounded-xl text-[10px]`}>
              {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
            </Badge>
            <Badge className={`${getTypeColor(task.type)} rounded-xl text-[10px]`}>
              {getTypeLabel(task.type)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {task.deals && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{task.deals.name}</span>
            )}
            {task.companies && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Building2 className="h-3 w-3" /> {task.companies.name}
              </span>
            )}
            {task.contacts && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <User className="h-3 w-3" /> {task.contacts.first_name} {task.contacts.last_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          {dueTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {dueTime}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {task.due_date}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (wsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Tareas</h1>
          <p className="text-xs md:text-sm text-white mt-1">
            {pendingTasks.length} pendientes · {overdueTasks.length} vencidas
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Toggle Vista */}
          <div className="flex rounded-xl bg-white/10 dark:bg-gray-800/60 p-1 gap-1 backdrop-blur-sm">
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-white text-gray-900 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setViewMode('lista')}
            >
              <List className="h-4 w-4" /> Lista
            </button>
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'calendario'
                  ? 'bg-white dark:bg-white text-gray-900 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setViewMode('calendario')}
            >
              <CalendarDays className="h-4 w-4" /> Calendario
            </button>
          </div>
          <Button
            onClick={() => setShowNewTaskModal(true)}
            className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" /> Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{todayTasks.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Hoy</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Vencidas</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{pendingTasks.length}</div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Vista Lista */}
      {viewMode === 'lista' && (
        <>
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <Card className="border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-200">Tareas Vencidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {overdueTasks.map((task) => <TaskRow key={task.id} task={task} />)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Tareas de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length > 0 ? (
                <div className="space-y-1">
                  {todayTasks.map((task) => <TaskRow key={task.id} task={task} />)}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No hay tareas para hoy</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Proximas Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {pendingTasks
                  .filter(t => t.due_date && new Date(t.due_date) > new Date())
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .map((task) => <TaskRow key={task.id} task={task} />)}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista Calendario */}
      {viewMode === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-white capitalize">{monthLabel}</CardTitle>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                {calendarDays.map((day, i) => {
                  const dayTasks = tasksByDateMap[day.date] || []
                  const isToday = day.date === todayStr
                  const isSelected = day.date === selectedDate
                  return (
                    <div
                      key={i}
                      className={`min-h-[70px] md:min-h-[80px] p-1.5 cursor-pointer transition-colors ${
                        day.isCurrentMonth
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50 dark:bg-gray-900/50'
                      } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'ring-2 ring-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                          : day.isCurrentMonth
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.day}
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        {dayTasks.slice(0, 3).map(t => (
                          <div key={t.id} className={`w-2 h-2 rounded-full ${getPriorityDot(getPriorityFromTask(t))}`}
                            title={t.subject} />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[9px] text-gray-400">+{dayTasks.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day Detail Panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">
                  {selectedDate
                    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Selecciona un dia'}
                </CardTitle>
                {selectedDate && (
                  <Button size="sm" className="rounded-xl gap-1 text-xs"
                    onClick={() => { setNewTask({...newTask, dueDate: selectedDate}); setShowNewTaskModal(true) }}>
                    <Plus className="h-3 w-3" /> Agregar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateTasks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateTasks.map(task => {
                      const priority = getPriorityFromTask(task)
                      const dueTime = getDueTimeFromTask(task)
                      return (
                        <div key={task.id} className="p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityDot(priority)}`} />
                            <Badge className={`${getTypeColor(task.type)} rounded-xl text-[10px]`}>
                              {getTypeLabel(task.type)}
                            </Badge>
                            {dueTime && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" /> {dueTime}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{task.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {task.companies && (
                              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                <Building2 className="h-2.5 w-2.5" /> {task.companies.name}
                              </span>
                            )}
                            {task.contacts && (
                              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                <User className="h-2.5 w-2.5" /> {task.contacts.first_name} {task.contacts.last_name}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Sin tareas para este dia</p>
                )
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Haz click en un dia del calendario</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nueva Tarea */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nueva Tarea</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNewTaskModal(false)} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white block mb-2">Titulo de la Tarea *</label>
                  <Input value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Ej: Llamar a cliente para seguimiento" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Tipo *</label>
                  <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
                    <option value="task">Tarea</option>
                    <option value="call">Llamada</option>
                    <option value="meeting">Reunion</option>
                    <option value="email">Email</option>
                    <option value="note">Nota</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Prioridad *</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Fecha *</label>
                  <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Hora</label>
                  <Input type="time" value={newTask.dueTime} onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Empresa</label>
                  <select value={newTask.companyId}
                    onChange={(e) => setNewTask({...newTask, companyId: e.target.value, contactId: ''})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
                    <option value="">Sin empresa</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">Contacto</label>
                  <select value={newTask.contactId}
                    onChange={(e) => setNewTask({...newTask, contactId: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
                    <option value="">Sin contacto</option>
                    {filteredContactsForNewTask.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white block mb-2">Oportunidad Asociada</label>
                  <select value={newTask.dealId} onChange={(e) => setNewTask({...newTask, dealId: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white">
                    <option value="">Sin oportunidad asociada</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>{deal.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleCreateTask} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newTask.title || !newTask.dueDate || creating}>
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : 'Crear Tarea'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewTaskModal(false)}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
