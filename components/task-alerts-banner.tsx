'use client'

import Link from 'next/link'
import { AlertCircle, BellRing, X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { useTaskAlerts } from '@/lib/hooks/use-task-alerts'
import { markAllSeen, getLastSeen } from '@/lib/notifications'

const DISMISS_KEY = 'crm:task-alerts:banner-dismissed'

export function TaskAlertsBanner() {
  const { workspaceId } = useWorkspace()
  const { tasks, unseenCount } = useTaskAlerts(workspaceId)
  const [dismissed, setDismissed] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DISMISS_KEY)
      if (raw) setDismissed(raw)
    } catch {}
    // Escuchar evento de "marcado como visto" desde la campana
    const handler = () => setDismissed('seen')
    window.addEventListener('crm:notifications-seen', handler)
    return () => window.removeEventListener('crm:notifications-seen', handler)
  }, [])

  const overdue = tasks.filter(t => t.bucket === 'overdue')
  const in1h = tasks.filter(t => t.bucket === 'in1hour')
  const today = tasks.filter(t => t.bucket === 'today')

  const urgent = overdue.length + in1h.length
  const todayCount = today.length

  // No mostrar si nada urgente
  if (urgent === 0 && todayCount === 0) return null

  // Si el usuario marcó como vistas (click campana o X banner) → no mostrar hasta que haya nuevas
  if (unseenCount === 0) return null

  // Firma para saber si el usuario ya cerró este set concreto
  const sig = `${overdue.length}-${in1h.length}-${todayCount}`
  if (dismissed === sig || dismissed === 'seen') return null

  const isRed = urgent > 0
  const gradient = isRed
    ? 'from-red-500 to-orange-500'
    : 'from-amber-500 to-yellow-500'

  let title = ''
  let subtitle = ''
  if (overdue.length > 0) {
    title = `${overdue.length} ${overdue.length === 1 ? 'tarea vencida' : 'tareas vencidas'}`
    if (in1h.length > 0) subtitle = `+ ${in1h.length} en la próxima hora`
    else if (todayCount > 0) subtitle = `+ ${todayCount} para hoy`
  } else if (in1h.length > 0) {
    title = `${in1h.length} ${in1h.length === 1 ? 'tarea en 1 hora' : 'tareas en la próxima hora'}`
    if (todayCount > 0) subtitle = `+ ${todayCount} más para hoy`
  } else if (todayCount > 0) {
    title = `Tienes ${todayCount} ${todayCount === 1 ? 'tarea' : 'tareas'} para hoy`
    subtitle = 'No olvides revisarlas'
  }

  return (
    <div className={`bg-gradient-to-r ${gradient} text-white shadow-lg`}>
      <div className="px-4 md:px-8 py-2.5 flex items-center gap-3">
        <div className={`flex-shrink-0 ${isRed ? 'animate-pulse' : ''}`}>
          {isRed ? <AlertCircle className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          {subtitle && <p className="text-[11px] opacity-90 truncate">{subtitle}</p>}
        </div>
        <Link
          href="/tasks"
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg transition-colors"
        >
          Revisar <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={() => {
            setDismissed('seen')
            markAllSeen()
            try { sessionStorage.setItem(DISMISS_KEY, sig) } catch {}
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          title="Marcar como visto"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
