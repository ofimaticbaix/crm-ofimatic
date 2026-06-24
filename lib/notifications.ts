'use client'

// Abstracción de notificaciones: web hoy, Capacitor cuando llegue la APK.
// La API pública permanece igual; solo el "driver" cambia según entorno.

export type NotifyOptions = {
  title: string
  body: string
  tag?: string           // ID único para evitar duplicados
  scheduledAt?: Date     // Solo usado cuando haya plugin Capacitor
}

// Detecta si estamos en Capacitor nativo (lo será tras envolver con APK)
function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap: any = (window as any).Capacitor
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())
}

// Pide permiso al usuario
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined') return 'default'

  // Capacitor: pide permiso vía plugin
  if (isCapacitorNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const res = await LocalNotifications.requestPermissions()
      return res.display === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }

  // Web API
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  try {
    const res = await Notification.requestPermission()
    return res as any
  } catch {
    return 'denied'
  }
}

export function hasNotificationPermission(): boolean {
  if (typeof window === 'undefined') return false
  if (isCapacitorNative()) return true
  if (!('Notification' in window)) return false
  return Notification.permission === 'granted'
}

// Hash simple de string a int (para IDs de LocalNotifications en Android)
function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

// Dispara una notificación. Auto-detecta entorno.
export async function notify(opts: NotifyOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // APK (Capacitor): plugin nativo
  if (isCapacitorNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [{
          id: hashId(opts.tag || opts.title + opts.body),
          title: opts.title,
          body: opts.body,
          schedule: opts.scheduledAt ? { at: opts.scheduledAt } : undefined,
          smallIcon: 'ic_notification',
        }]
      })
      return true
    } catch (e) {
      console.warn('Capacitor notification failed, falling back to web:', e)
    }
  }

  // Web API
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      icon: '/images/logo.png',
      badge: '/images/logo.png',
    })
    setTimeout(() => { try { n.close() } catch {} }, 8000)
    return true
  } catch {
    return false
  }
}

// Sonido de alerta (beep corto generado con Web Audio API, no requiere archivo)
export function playAlertSound() {
  if (typeof window === 'undefined') return
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    o.connect(g); g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.4)
  } catch {}
}

// LocalStorage helper: IDs de tareas ya notificadas (para no spamear)
const KEY_NOTIFIED = 'crm:task-alerts:notified'
const KEY_LAST_SEEN = 'crm:task-alerts:last-seen'
const KEY_HISTORY = 'crm:task-alerts:history'

// Timestamp de última vez que el usuario vio las notificaciones (click en campana o X banner)
export function getLastSeen(): number {
  if (typeof window === 'undefined') return 0
  try {
    const v = localStorage.getItem(KEY_LAST_SEEN)
    return v ? parseInt(v, 10) : 0
  } catch { return 0 }
}

export function markAllSeen() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY_LAST_SEEN, String(Date.now()))
    // Emitir evento para que otros componentes reaccionen
    window.dispatchEvent(new Event('crm:notifications-seen'))
  } catch {}
}

// Historial de notificaciones disparadas (para mostrar en el dropdown)
export interface NotificationHistoryItem {
  id: string
  title: string
  body: string
  type: 'error' | 'warning' | 'info'
  timestamp: number
}

export function getHistory(): NotificationHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const v = localStorage.getItem(KEY_HISTORY)
    return v ? JSON.parse(v) : []
  } catch { return [] }
}

export function addToHistory(item: Omit<NotificationHistoryItem, 'timestamp'>) {
  if (typeof window === 'undefined') return
  try {
    const hist = getHistory()
    // No duplicar (mismo id en últimos 5 minutos)
    const now = Date.now()
    const exists = hist.find(h => h.id === item.id && (now - h.timestamp) < 5 * 60 * 1000)
    if (exists) return
    hist.unshift({ ...item, timestamp: now })
    // Limit a 50
    const trimmed = hist.slice(0, 50)
    localStorage.setItem(KEY_HISTORY, JSON.stringify(trimmed))
    window.dispatchEvent(new Event('crm:notification-added'))
  } catch {}
}

export function clearHistory() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY_HISTORY)
    window.dispatchEvent(new Event('crm:notification-added'))
  } catch {}
}

export function getNotifiedIds(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY_NOTIFIED)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function markNotified(key: string) {
  if (typeof window === 'undefined') return
  try {
    const map = getNotifiedIds()
    map[key] = Date.now()
    // Limpiar entradas mayores a 7 días para no hacer crecer infinito
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    for (const k of Object.keys(map)) if (map[k] < weekAgo) delete map[k]
    localStorage.setItem(KEY_NOTIFIED, JSON.stringify(map))
  } catch {}
}
