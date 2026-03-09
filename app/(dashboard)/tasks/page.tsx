import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Plus, Calendar } from 'lucide-react'
import { mockTasks, mockDeals } from '@/lib/mock-data'

export default function TasksPage() {
  const allTasks = mockTasks
  const pendingTasks = allTasks.filter(t => !t.isCompleted)
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < new Date())
  const todayTasks = pendingTasks.filter(t => {
    const today = new Date().toDateString()
    return new Date(t.dueDate).toDateString() === today
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-500 mt-1">
            {pendingTasks.length} pendientes • {overdueTasks.length} vencidas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{todayTasks.length}</div>
            <p className="text-sm text-gray-500 mt-1">Tareas Hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-sm text-gray-500 mt-1">Vencidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{pendingTasks.length}</div>
            <p className="text-sm text-gray-500 mt-1">Total Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-900">Tareas Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map((task) => {
                const deal = mockDeals.find(d => d.id === task.dealId)
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{task.title}</span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                      {deal && (
                        <p className="text-sm text-gray-500 mt-1">{deal.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Vencida</Badge>
                      <span className="text-xs text-gray-500">{task.dueDate}</span>
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
          <CardTitle>Tareas de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayTasks.map((task) => {
              const deal = mockDeals.find(d => d.id === task.dealId)
              return (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{task.title}</span>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
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

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Tareas</CardTitle>
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
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{task.title}</span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                      {deal && (
                        <p className="text-sm text-gray-500 mt-1">{deal.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {task.dueDate}
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
