'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { Bell, BellRing, AlertCircle, Clock, Calendar, CheckCircle2, Trash2, History } from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { useTaskAlerts } from '@/lib/hooks/use-task-alerts'
import { requestNotificationPermission, markAllSeen, getHistory, clearHistory, type NotificationHistoryItem } from '@/lib/notifications'

function formatRelativeTaskTime(minsUntil: number | null): string {
  if (minsUntil === null) return 'Sin fecha'
  if (minsUntil < -60 * 24) {
    const days = Math.ceil(-minsUntil / (60 * 24))
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  }
  if (minsUntil < 0) {
    const hours = Math.ceil(-minsUntil / 60)
    return `Hace ${hours} h`
  }
  if (minsUntil < 60) return `En ${minsUntil} min`
  if (minsUntil < 60 * 24) {
    const hours = Math.floor(minsUntil / 60)
    return `En ${hours} h`
  }
  const days = Math.floor(minsUntil / (60 * 24))
  return `En ${days} ${days === 1 ? 'día' : 'días'}`
}

function bucketStyles(bucket: string) {
  switch (bucket) {
    case 'overdue':   return { icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',     label: 'Vencida' }
    case 'in1hour':   return { icon: BellRing,    color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'En 1h' }
    case 'today':     return { icon: Clock,       color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  label: 'Hoy' }
    case 'tomorrow':  return { icon: Calendar,    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    label: 'Mañana' }
    case 'thisweek':  return { icon: Calendar,    color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20',label: 'Esta semana' }
    default:          return { icon: Calendar,    color: 'text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-800/50',    label: 'Más adelante' }
  }
}

export function NotificationsBell() {
  const { workspaceId } = useWorkspace()
  const { tasks, unseenCount, overdueCount } = useTaskAlerts(workspaceId)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default')
  const [history, setHistory] = useState<NotificationHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes')
  const btnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission as any)
    }
    setHistory(getHistory())
    const handler = () => setHistory(getHistory())
    window.addEventListener('crm:notification-added', handler)
    return () => window.removeEventListener('crm:notification-added', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!btnRef.current?.contains(target) && !target.closest('[data-notifications-menu]')) {
        setOpen(false)
      }
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [open])

  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(true)
    // Marcar como vistas al abrir (desaparece badge y animación)
    markAllSeen()
  }

  const askPermission = async () => {
    const res = await requestNotificationPermission()
    setPermission(res)
  }

  // Solo mostrar las próximas 15 tareas en el dropdown
  const visible = tasks.slice(0, 15)

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`relative p-2 rounded-xl transition-colors ${
          unseenCount > 0 && overdueCount > 0
            ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
            : unseenCount > 0
              ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800/30'
        }`}
        title={unseenCount > 0 ? `${unseenCount} ${unseenCount === 1 ? 'notificación nueva' : 'notificaciones nuevas'}` : 'Notificaciones'}
      >
        {unseenCount > 0 && overdueCount > 0 && (
          <span className="absolute inset-0 rounded-xl ring-2 ring-red-500 animate-ping opacity-40" />
        )}
        {unseenCount > 0 && overdueCount > 0 ? (
          <BellRing className="h-5 w-5 text-red-500 dark:text-red-400 animate-[wiggle_1s_ease-in-out_infinite]" style={{ transformOrigin: '50% 0%' }} />
        ) : unseenCount > 0 ? (
          <BellRing className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        ) : (
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1 shadow-lg ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {mounted && open && menuPos && createPortal(
        <div
          data-notifications-menu
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 100 }}
          className="w-[340px] max-w-[calc(100vw-16px)] max-h-[70vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" /> Notificaciones
            </h3>
            <Link href="/tasks" onClick={() => setOpen(false)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === 'pendientes'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Bell className="h-3.5 w-3.5 inline mr-1" /> Pendientes ({visible.length})
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === 'historial'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <History className="h-3.5 w-3.5 inline mr-1" /> Historial ({history.length})
            </button>
          </div>

          {permission !== 'granted' && activeTab === 'pendientes' && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                Activa las notificaciones del navegador para recibir avisos antes de cada tarea.
              </p>
              <button
                onClick={askPermission}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Activar notificaciones
              </button>
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {activeTab === 'pendientes' ? (
              visible.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  No tienes tareas pendientes. ¡Todo al día!
                </div>
              ) : (
                visible.map((t) => {
                  const s = bucketStyles(t.bucket)
                  const Icon = s.icon
                  return (
                    <Link
                      key={t.id}
                      href="/tasks"
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${s.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${s.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.subject}</p>
                        {(t.company_name || t.contact_name) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {t.company_name || t.contact_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                          <span className="text-[10px] text-gray-400">·</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatRelativeTaskTime(t.minutesUntil)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )
            ) : (
              /* Historial */
              <>
                {history.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <History className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    Aún no hay historial de notificaciones.
                  </div>
                ) : (
                  <>
                    {history.map((h, idx) => {
                      const typeColor = h.type === 'error' ? 'text-red-500' : h.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                      const typeBg = h.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' : h.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
                      const diff = Date.now() - h.timestamp
                      const rel = diff < 60000 ? 'hace un momento'
                        : diff < 3600000 ? `hace ${Math.floor(diff/60000)} min`
                        : diff < 86400000 ? `hace ${Math.floor(diff/3600000)} h`
                        : `hace ${Math.floor(diff/86400000)} días`
                      return (
                        <div key={idx} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${typeBg}`}>
                          <Bell className={`h-5 w-5 ${typeColor} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{h.title}</p>
                            {h.body && <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{h.body}</p>}
                            <span className="text-[10px] text-gray-400 mt-1 inline-block">{rel}</span>
                          </div>
                        </div>
                      )
                    })}
                    <button
                      onClick={() => { clearHistory(); setHistory([]) }}
                      className="w-full px-4 py-3 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Borrar historial
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
