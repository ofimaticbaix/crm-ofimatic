'use client'

import { useEffect, useRef, useState } from 'react'
import { getTasks } from '@/lib/actions/tasks'
import { notify, hasNotificationPermission, getNotifiedIds, markNotified, playAlertSound, addToHistory, getLastSeen, getHistory } from '@/lib/notifications'
import { toast } from 'sonner'

export interface UpcomingTask {
  id: string
  subject: string
  description?: string | null
  due_date?: string | null
  scheduled_at?: string | null
  company_name?: string | null
  contact_name?: string | null
  minutesUntil: number | null  // null si no hay fecha
  bucket: 'overdue' | 'in1hour' | 'today' | 'tomorrow' | 'thisweek' | 'later'
}

// Extrae la fecha efectiva de una tarea (scheduled_at > due_date)
function getEffectiveDate(task: any): Date | null {
  const raw = task.scheduled_at || task.due_date
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function getBucket(minsUntil: number | null): UpcomingTask['bucket'] {
  if (minsUntil === null) return 'later'
  if (minsUntil < 0) return 'overdue'
  if (minsUntil <= 60) return 'in1hour'
  if (minsUntil <= 60 * 24) return 'today'
  if (minsUntil <= 60 * 48) return 'tomorrow'
  if (minsUntil <= 60 * 24 * 7) return 'thisweek'
  return 'later'
}

export function useTaskAlerts(workspaceId: string | null | undefined) {
  const [tasks, setTasks] = useState<UpcomingTask[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = async () => {
    if (!workspaceId) return
    try {
      // Pedir TODAS las tareas (no solo pending) para saber qué existe
      const [pendingRes, allRes] = await Promise.all([
        getTasks(workspaceId, { onlyPending: true }),
        getTasks(workspaceId),
      ])
      const res = pendingRes
      if (!res.data) { setTasks([]); return }

      // Purgar historial + toasts + notified-ids de tareas que ya no existen
      try {
        const existingIds = new Set((allRes.data || []).map((t: any) => t.id))
        const hist = getHistory()
        const removedKeys: string[] = []
        const filtered = hist.filter(h => {
          const taskId = h.id.split(':')[0]
          if (/^[0-9a-f-]{36}$/i.test(taskId) && !existingIds.has(taskId)) {
            removedKeys.push(h.id)
            return false
          }
          return true
        })
        if (filtered.length !== hist.length) {
          localStorage.setItem('crm:task-alerts:history', JSON.stringify(filtered))
          window.dispatchEvent(new Event('crm:notification-added'))
        }
        // Cerrar toasts (sonner) cuyos tags correspondan a tareas eliminadas
        for (const k of removedKeys) {
          try { toast.dismiss(k) } catch {}
        }
        // Limpiar notified-ids de tareas eliminadas (para que no vuelvan a dispararse)
        try {
          const notifKey = 'crm:task-alerts:notified'
          const notifRaw = localStorage.getItem(notifKey)
          if (notifRaw) {
            const obj = JSON.parse(notifRaw)
            let changed = false
            for (const k of Object.keys(obj)) {
              const taskId = k.split(':')[0]
              if (/^[0-9a-f-]{36}$/i.test(taskId) && !existingIds.has(taskId)) {
                delete obj[k]
                changed = true
              }
            }
            if (changed) localStorage.setItem(notifKey, JSON.stringify(obj))
          }
        } catch {}
      } catch {}

      const now = Date.now()
      const enriched: UpcomingTask[] = (res.data as any[]).map((t: any) => {
        const date = getEffectiveDate(t)
        const minsUntil = date ? Math.round((date.getTime() - now) / 60000) : null
        return {
          id: t.id,
          subject: t.subject || 'Tarea',
          description: t.description,
          due_date: t.due_date,
          scheduled_at: t.scheduled_at,
          company_name: t.companies?.name || null,
          contact_name: t.contacts ? `${t.contacts.first_name || ''} ${t.contacts.last_name || ''}`.trim() : null,
          minutesUntil: minsUntil,
          bucket: getBucket(minsUntil),
        }
      })

      // Ordenar por urgencia (más cercanas o vencidas primero)
      enriched.sort((a, b) => {
        if (a.minutesUntil === null && b.minutesUntil === null) return 0
        if (a.minutesUntil === null) return 1
        if (b.minutesUntil === null) return -1
        return a.minutesUntil - b.minutesUntil
      })

      setTasks(enriched)

      // Disparar notificaciones (siempre toast dentro de la app + nativa si hay permiso)
      const canNative = hasNotificationPermission()
      const notified = getNotifiedIds()

      const fireAlert = (title: string, body: string, key: string, variant: 'error' | 'warning' | 'info') => {
        if (notified[key]) return
        const opts = {
          id: key,   // ID único para poder cerrarlo luego si la tarea se borra
          description: body,
          duration: Infinity,
          action: { label: 'Ver tareas', onClick: () => { window.location.href = '/tasks' } },
        }
        if (variant === 'error') toast.error(title, opts)
        else if (variant === 'warning') toast.warning(title, opts)
        else toast.info(title, opts)
        // Notificación nativa del sistema
        if (canNative) notify({ title, body, tag: key })
        // Sonido
        playAlertSound()
        markNotified(key)
        // Historial
        addToHistory({ id: key, title, body, type: variant })
      }

      for (const t of enriched) {
        if (t.minutesUntil === null) continue
        const subject = `${t.subject}${t.company_name ? ` · ${t.company_name}` : ''}`

        // 24h antes
        if (t.minutesUntil >= 60 * 23.5 && t.minutesUntil <= 60 * 24.5) {
          fireAlert('⏰ Tarea mañana', subject, `${t.id}:day-before`, 'info')
        }
        // 1h antes
        if (t.minutesUntil >= 55 && t.minutesUntil <= 65) {
          fireAlert('🔔 Tarea en 1 hora', subject, `${t.id}:hour-before`, 'warning')
        }
        // Vencida
        if (t.minutesUntil < 0 && t.minutesUntil > -60) {
          fireAlert('⚠️ Tarea vencida', subject, `${t.id}:overdue`, 'error')
        }
      }
    } catch (err) {
      console.error('useTaskAlerts error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!workspaceId) return
    refresh()
    // Revisar cada 60 segundos
    intervalRef.current = setInterval(refresh, 60 * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const pendingCount = tasks.filter(t => t.bucket === 'overdue' || t.bucket === 'in1hour' || t.bucket === 'today' || t.bucket === 'tomorrow').length
  const overdueCount = tasks.filter(t => t.bucket === 'overdue').length

  // unseenCount: tareas urgentes que han cambiado de estado DESPUÉS del último "visto"
  // El estado se basa en el historial (cada alerta disparada queda registrada con timestamp).
  // Si el usuario ya hizo click en la campana después de la última alerta, no hay nuevos.
  const [unseenCount, setUnseenCount] = useState(0)
  useEffect(() => {
    const recompute = () => {
      const lastSeen = getLastSeen()
      // Tareas urgentes que tuvieron alerta después de lastSeen
      // Simplificación: contamos las tareas overdue o in1hour (que el user aún no ha abordado)
      // que hayan tenido alerta reciente
      const urgentNow = tasks.filter(t => t.bucket === 'overdue' || t.bucket === 'in1hour').length
      if (lastSeen === 0) {
        setUnseenCount(urgentNow)
      } else {
        // Si el usuario ya vio la campana y no hay nuevas alertas desde entonces, 0
        const { getHistory } = require('@/lib/notifications') as typeof import('@/lib/notifications')
        const hist = getHistory()
        const newSinceSeen = hist.filter((h: any) => h.timestamp > lastSeen).length
        setUnseenCount(newSinceSeen > 0 ? urgentNow : 0)
      }
    }
    recompute()
    const handler = () => recompute()
    window.addEventListener('crm:notifications-seen', handler)
    window.addEventListener('crm:notification-added', handler)
    return () => {
      window.removeEventListener('crm:notifications-seen', handler)
      window.removeEventListener('crm:notification-added', handler)
    }
  }, [tasks])

  return { tasks, loading, pendingCount, overdueCount, unseenCount, refresh }
}
