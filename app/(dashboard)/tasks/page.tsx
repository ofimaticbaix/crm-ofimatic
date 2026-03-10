'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, Plus, Calendar, X } from 'lucide-react'
import { mockTasks, mockDeals } from '@/lib/mock-data'

export default function TasksPage() {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    priority: 'medium',
    dealId: ''
  })
  const allTasks = mockTasks
  const pendingTasks = allTasks.filter(t => !t.isCompleted)
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < new Date())
  const todayTasks = pendingTasks.filter(t => {
    const today = new Date().toDateString()
    return new Date(t.dueDate).toDateString() === today
  })

  const handleCreateTask = () => {
    const priorityText = newTask.priority === 'high' ? 'Alta' : newTask.priority === 'medium' ? 'Media' : 'Baja'
    alert(`Tarea creada: ${newTask.title} - Prioridad: ${priorityText}`)
    setShowNewTaskModal(false)
    setNewTask({
      title: '',
      dueDate: '',
      priority: 'medium',
      dealId: ''
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Tareas</h1>
          <p className="text-xs md:text-sm text-white mt-1">
            {pendingTasks.length} pendientes • {overdueTasks.length} vencidas
          </p>
        </div>
        <Button
          onClick={() => setShowNewTaskModal(true)}
          className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </Button>
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

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-200">Tareas Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map((task) => {
                const deal = mockDeals.find(d => d.id === task.dealId)
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-xl">
                    <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                        <Badge className={`${getPriorityColor(task.priority)} rounded-xl`}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                      {deal && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deal.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs rounded-xl">Vencida</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{task.dueDate}</span>
                    </div>
                  </div>
                )
              })}
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
          <div className="space-y-3">
            {todayTasks.map((task) => {
              const deal = mockDeals.find(d => d.id === task.dealId)
              return (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                      <Badge className={`${getPriorityColor(task.priority)} rounded-xl`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                    </div>
                    {deal && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deal.name}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{task.dueDate}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Próximas Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingTasks
              .filter(t => {
                const today = new Date()
                const taskDate = new Date(t.dueDate)
                return taskDate > today
              })
              .map((task) => {
                const deal = mockDeals.find(d => d.id === task.dealId)
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                        <Badge className={`${getPriorityColor(task.priority)} rounded-xl`}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                      {deal && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deal.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {task.dueDate}
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Nueva Tarea */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nueva Tarea</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTaskModal(false)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white block mb-2">
                    Título de la Tarea *
                  </label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Ej: Llamar a cliente para seguimiento"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Prioridad *
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white block mb-2">
                    Oportunidad Asociada (Opcional)
                  </label>
                  <select
                    value={newTask.dealId}
                    onChange={(e) => setNewTask({...newTask, dealId: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white"
                  >
                    <option value="">Sin oportunidad asociada</option>
                    {mockDeals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateTask}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newTask.title || !newTask.dueDate}
                >
                  Crear Tarea
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewTaskModal(false)}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
                >
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
