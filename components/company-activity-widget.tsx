'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PhoneCall, Users as UsersIcon, Mail, StickyNote, CalendarClock, Plus, CheckCircle2, Loader2, Trash2, Pencil, Save, FileText } from 'lucide-react'
import { getActivities, createActivity, logContact } from '@/lib/actions/activities'
import { deleteTask, updateTask } from '@/lib/actions/tasks'
import { toast } from 'sonner'

interface Activity {
  id: string
  type: string
  subject: string | null
  description: string | null
  is_completed: boolean
  completed_at: string | null
  scheduled_at: string | null
  due_date: string | null
  created_at: string
}

interface Props {
  workspaceId: string
  companyId: string
  accentColor?: 'green' | 'orange' | 'blue'
}

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  call:        { icon: PhoneCall,   label: 'Llamada',     color: 'text-green-500' },
  meeting:     { icon: UsersIcon,   label: 'Reunión',     color: 'text-purple-500' },
  email:       { icon: Mail,        label: 'Email',       color: 'text-blue-500' },
  note:        { icon: StickyNote,  label: 'Nota',        color: 'text-amber-500' },
  presupuesto: { icon: FileText,    label: 'Presupuesto', color: 'text-indigo-500' },
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  const absMin = Math.abs(Math.floor(diff / 60000))
  const sign = diff < 0 ? -1 : 1
  if (absMin < 60) return sign < 0 ? `hace ${absMin} min` : `en ${absMin} min`
  const absH = Math.floor(absMin / 60)
  if (absH < 24) return sign < 0 ? `hace ${absH} h` : `en ${absH} h`
  const absD = Math.floor(absH / 24)
  if (absD < 30) return sign < 0 ? `hace ${absD} ${absD === 1 ? 'día' : 'días'}` : `en ${absD} ${absD === 1 ? 'día' : 'días'}`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CompanyActivityWidget({ workspaceId, companyId, accentColor = 'blue' }: Props) {
  const [lastAction, setLastAction] = useState<Activity | null>(null)
  const [nextAction, setNextAction] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  // editingId=null → create mode, otherwise edit mode for that task id
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingKind, setEditingKind] = useState<'last' | 'next' | null>(null)
  const [form, setForm] = useState<{ type: string; subject: string; date: string; time: string }>({
    type: 'call',
    subject: '',
    date: '',
    time: '',
  })

  const load = async () => {
    if (!companyId || !workspaceId) return
    setLoading(true)
    const { data } = await getActivities(workspaceId, { companyId })
    const acts = (data || []) as Activity[]
    const completed = acts
      .filter(a => a.is_completed && a.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    const upcoming = acts
      .filter(a => !a.is_completed && (a.scheduled_at || a.due_date))
      .sort((a, b) => {
        const da = new Date(a.scheduled_at || a.due_date!).getTime()
        const db = new Date(b.scheduled_at || b.due_date!).getTime()
        return da - db
      })
    setLastAction(completed[0] || null)
    setNextAction(upcoming[0] || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [companyId, workspaceId])

  const resetForm = () => {
    setForm({ type: 'call', subject: '', date: '', time: '' })
    setShowForm(false)
    setEditingId(null)
    setEditingKind(null)
  }

  const saveTask = async () => {
    if (!form.date) { toast.error('Indica una fecha'); return }
    setSaving(true)
    try {
      const scheduledAt = form.time && form.date ? `${form.date}T${form.time}:00` : null

      if (editingId) {
        // Edit existing task
        const updateInput: any = {
          type: form.type as any,
          subject: form.subject || (editingKind === 'next' ? 'Próxima tarea' : 'Tarea'),
        }
        // Only update dates on scheduled ("next") tasks — completed ones keep their completed_at
        if (editingKind === 'next') {
          updateInput.due_date = form.date
          updateInput.scheduled_at = scheduledAt
        }
        const res = await updateTask(editingId, updateInput)
        if (res.error) throw new Error(res.error)
        toast.success('Tarea actualizada')
      } else if (editingKind === 'last') {
        // Register a task that already happened — completed at the chosen date
        const completedAt = scheduledAt || `${form.date}T12:00:00`
        const res = await logContact(workspaceId, {
          type: form.type as any,
          subject: form.subject || 'Tarea realizada',
          company_id: companyId,
          completed_at: completedAt,
        })
        if (res.error) throw new Error(res.error)
        toast.success('Tarea realizada registrada')
      } else {
        // Create new scheduled task ("programar próxima")
        await createActivity(workspaceId, {
          type: form.type as any,
          subject: form.subject || 'Próxima tarea',
          company_id: companyId,
          due_date: form.date,
          scheduled_at: scheduledAt || undefined,
        })
        toast.success('Próxima tarea programada')
      }
      resetForm()
      await load()
    } catch (e: any) {
      toast.error(`Error: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (kind: 'last' | 'next', task: Activity) => {
    const baseDate = task.scheduled_at || task.due_date || ''
    let date = ''
    let time = ''
    if (baseDate) {
      const d = new Date(baseDate)
      if (!isNaN(d.getTime())) {
        date = d.toISOString().slice(0, 10)
        if (task.scheduled_at) {
          time = baseDate.slice(11, 16)
        }
      }
    }
    setEditingId(task.id)
    setEditingKind(kind)
    setForm({
      type: task.type || 'call',
      subject: (task.subject && task.subject !== 'Próxima tarea') ? task.subject : (task.description || ''),
      date,
      time,
    })
    setShowForm(true)
  }

  const deleteTaskConfirm = async (task: Activity, label: string) => {
    if (!confirm(`¿Eliminar ${label}?`)) return
    const res = await deleteTask(task.id)
    if (res.error) { toast.error(res.error); return }
    toast.success('Tarea eliminada')
    await load()
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    )
  }

  const lastMeta = lastAction ? (TYPE_META[lastAction.type] || TYPE_META.note) : null
  const nextMeta = nextAction ? (TYPE_META[nextAction.type] || TYPE_META.note) : null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-gray-50 to-gray-50/50 dark:from-gray-800/40 dark:to-gray-800/20 p-4">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <CalendarClock className="h-3.5 w-3.5" /> Actividad
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Última tarea */}
        <div className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Última tarea</span>
            </div>
            {lastAction && (
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit('last', lastAction)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteTaskConfirm(lastAction, 'esta tarea completada')} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {lastAction && lastMeta ? (
            <div>
              <div className="flex items-center gap-2">
                <lastMeta.icon className={`h-4 w-4 ${lastMeta.color}`} />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{lastMeta.label}</span>
                <span className="text-[11px] text-gray-500">· {relativeTime(lastAction.completed_at!)}</span>
              </div>
              {lastAction.subject && lastAction.subject !== 'Llamada' && lastAction.subject !== 'Reunión' && lastAction.subject !== 'Email' && lastAction.subject !== 'Nota' && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">{lastAction.subject}</p>
              )}
              {lastAction.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">{lastAction.description}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Sin contactos registrados</p>
          )}
          {!showForm && (
            <button
              onClick={() => {
                setEditingKind('last')
                setEditingId(null)
                setForm({ type: 'call', subject: '', date: new Date().toISOString().slice(0, 10), time: '' })
                setShowForm(true)
              }}
              className="w-full text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 mt-2"
            >
              <Plus className="h-3.5 w-3.5" /> Registrar tarea realizada
            </button>
          )}
        </div>

        {/* Próxima tarea */}
        <div className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Próxima tarea</span>
            </div>
            {nextAction && (
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit('next', nextAction)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteTaskConfirm(nextAction, 'la próxima tarea programada')} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {nextAction && nextMeta ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <nextMeta.icon className={`h-4 w-4 ${nextMeta.color}`} />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{nextMeta.label}</span>
                <span className="text-[11px] text-gray-500">· {relativeTime(nextAction.scheduled_at || nextAction.due_date!)}</span>
              </div>
              {nextAction.subject && nextAction.subject !== 'Próxima tarea' && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">{nextAction.subject}</p>
              )}
              {nextAction.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{nextAction.description}</p>
              )}
            </div>
          ) : !showForm ? (
            <button
              onClick={() => { setEditingKind('next'); setShowForm(true) }}
              className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Programar próxima tarea
            </button>
          ) : null}
        </div>
      </div>

      {/* Formulario crear/editar */}
      {showForm && (() => {
        const isEdit = !!editingId
        // Show date inputs when scheduling a future task or registering a past one.
        // For edits of completed tasks, the original completion date stays.
        const showDateFields = editingKind === 'next' || (editingKind === 'last' && !isEdit)
        const formTitle = isEdit
          ? (editingKind === 'last' ? 'Editar tarea completada' : 'Editar próxima tarea')
          : (editingKind === 'last' ? 'Registrar tarea realizada' : 'Programar próxima tarea')
        return (
        <div className="mt-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 space-y-2">
          <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">{formTitle}</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-9 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2"
            >
              <option value="call">📞 Llamada</option>
              <option value="meeting">👥 Reunión</option>
              <option value="email">✉️ Email</option>
              <option value="note">📝 Nota / Tarea</option>
            </select>
            {showDateFields ? (
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-9 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2"
              />
            ) : (
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Descripción"
                className="h-9 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2"
              />
            )}
          </div>
          {showDateFields && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="Hora (opcional)"
                className="h-9 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2"
              />
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Descripción (opcional)"
                className="h-9 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={saveTask} disabled={saving || (showDateFields && !form.date)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : (isEdit ? <Save className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />)}
              {isEdit ? 'Guardar' : (editingKind === 'last' ? 'Registrar' : 'Programar')}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm} className="h-8 text-xs">
              Cancelar
            </Button>
          </div>
          {!isEdit && editingKind === 'next' && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Recibirás una notificación 24h y 1h antes.
            </p>
          )}
        </div>
        )
      })()}
    </div>
  )
}
