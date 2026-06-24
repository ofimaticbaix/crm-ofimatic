'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { History, Search, Download, PhoneCall, Users as UsersIcon, Mail, StickyNote, CheckCircle2, Loader2, Printer, Building2, Trash2, MapPin, Pencil, Check, X } from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getActivities, updateActivity } from '@/lib/actions/activities'
import { deleteTask } from '@/lib/actions/tasks'
import { useCachedData } from '@/lib/hooks/use-cached-data'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const TYPE_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  call:    { icon: PhoneCall,   label: 'Llamada',  color: 'text-green-500',  bg: 'bg-green-100 dark:bg-green-900/30' },
  meeting: { icon: UsersIcon,   label: 'Reunión',  color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  email:   { icon: Mail,        label: 'Email',    color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
  note:    { icon: StickyNote,  label: 'Nota',     color: 'text-amber-500',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  task:    { icon: CheckCircle2,label: 'Tarea',    color: 'text-gray-500',   bg: 'bg-gray-100 dark:bg-gray-800' },
}

export default function TaskHistoryPage() {
  const { workspaceId, workspaceName, loading: wsLoading } = useWorkspace()
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number | 'all'>(now.getMonth())
  const [search, setSearch] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const { data: activities, loading, refetch } = useCachedData<any[]>(
    `activities-completed-${workspaceId}`,
    () => getActivities(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [editingDateValue, setEditingDateValue] = useState('')
  const [savingDateId, setSavingDateId] = useState<string | null>(null)

  // Realtime: cualquier alta/edición/borrado de actividades dispara refetch.
  // Sin esto, el "Top empresas" no se actualizaba al añadir o borrar tareas
  // desde otras pantallas.
  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null
    const channel = supabase
      .channel(`activities-history-${workspaceId}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'activities', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => refetch(), 300)
        },
      )
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [workspaceId, refetch])

  // Convierte un ISO a "YYYY-MM-DDTHH:mm" (formato que acepta <input type="datetime-local">).
  const isoToLocalInput = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleSaveDate = async (id: string) => {
    if (!editingDateValue) return
    setSavingDateId(id)
    // datetime-local viene en local sin zona — lo convertimos a ISO (UTC)
    const isoNew = new Date(editingDateValue).toISOString()
    const r = await updateActivity(id, { completed_at: isoNew })
    setSavingDateId(null)
    if (r.error) {
      toast.error(`No se pudo guardar: ${r.error}`)
      return
    }
    toast.success('Fecha actualizada')
    setEditingDateId(null)
    setEditingDateValue('')
    refetch()
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea del historial? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    const res = await deleteTask(id)
    setDeletingId(null)
    if (res.error) {
      toast.error(`No se pudo eliminar: ${res.error}`)
      return
    }
    toast.success('Tarea eliminada')
    refetch()
  }

  // Filtrar: completadas + por año/mes/texto
  const filtered = useMemo(() => {
    const list = (activities || []).filter(a => a.is_completed && a.completed_at)
    return list.filter((a: any) => {
      const d = new Date(a.completed_at)
      if (d.getFullYear() !== year) return false
      if (month !== 'all' && d.getMonth() !== month) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [a.subject, a.description, a.companies?.name, a.contacts?.first_name, a.contacts?.last_name]
          .some((v: any) => v?.toLowerCase().includes(q))
        if (!hay) return false
      }
      return true
    }).sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
  }, [activities, year, month, search])

  const years = useMemo(() => {
    const set = new Set<number>()
    set.add(now.getFullYear())
    ;(activities || []).forEach((a: any) => {
      if (a.completed_at) set.add(new Date(a.completed_at).getFullYear())
    })
    return Array.from(set).sort((a, b) => b - a)
  }, [activities])

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = { call: 0, meeting: 0, email: 0, note: 0, task: 0 }
    const byCompany: Record<string, { name: string; count: number }> = {}
    filtered.forEach((a: any) => {
      byType[a.type] = (byType[a.type] || 0) + 1
      const cn = a.companies?.name || '— Sin empresa —'
      if (!byCompany[cn]) byCompany[cn] = { name: cn, count: 0 }
      byCompany[cn].count++
    })
    const topCompanies = Object.values(byCompany).sort((a, b) => b.count - a.count).slice(0, 10)
    return { byType, topCompanies, total: filtered.length }
  }, [filtered])

  const printReport = (scope: 'month' | 'semester' | 'year') => {
    // Ajusta filtros según alcance y usa window.print()
    if (scope === 'month') {
      // mantiene filtro actual
    } else if (scope === 'semester') {
      // H1 (ene-jun) o H2 (jul-dic) según mes actual seleccionado
      const h1 = month === 'all' ? (now.getMonth() < 6 ? 'h1' : 'h2') : ((month as number) < 6 ? 'h1' : 'h2')
      // No cambiamos el state, usamos rango al imprimir
      const rangeMonth = h1 === 'h1' ? [0,5] : [6,11]
      document.body.dataset.printScope = `semester:${rangeMonth.join('-')}`
    } else if (scope === 'year') {
      document.body.dataset.printScope = 'year'
    }
    setTimeout(() => {
      window.print()
      delete document.body.dataset.printScope
    }, 100)
  }

  // Cálculo especial para lista en impresión (semester/year)
  const printFiltered = useMemo(() => {
    const list = (activities || []).filter(a => a.is_completed && a.completed_at)
    return list.filter((a: any) => {
      const d = new Date(a.completed_at)
      return d.getFullYear() === year
    }).sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
  }, [activities, year])

  if (wsLoading || loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-5 bg-[#0a1628]/80 backdrop-blur-sm rounded-2xl p-5 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          body * { visibility: hidden; }
          #printable, #printable * { visibility: visible; }
          #printable { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Header no-print */}
      <div className="no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <History className="h-7 w-7 text-orange-400" />
            Historial de Tareas
          </h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">{stats.total} tareas completadas en el periodo seleccionado</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 no-print">
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider">Año</label>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="mt-1 w-full h-9 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider">Mes</label>
          <select value={String(month)} onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            className="mt-1 w-full h-9 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3">
            <option value="all">Todos los meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[11px] text-gray-400 uppercase tracking-wider">Buscar</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Empresa, descripción, contacto..."
              className="pl-10 h-9 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Botones de descarga */}
      <div className="flex flex-wrap gap-2 no-print">
        <Button onClick={() => printReport('month')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          PDF Mensual ({month === 'all' ? 'todos' : MONTHS[month as number]} {year})
        </Button>
        <Button onClick={() => printReport('semester')} variant="outline" className="rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          PDF Semestral
        </Button>
        <Button onClick={() => printReport('year')} variant="outline" className="rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          PDF Anual ({year})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 no-print">
        {(['call','meeting','email','note','task'] as const).map(t => {
          const meta = TYPE_META[t]
          const Icon = meta.icon
          return (
            <Card key={t}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{meta.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.byType[t] || 0}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top empresas */}
      {stats.topCompanies.length > 0 && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Top empresas con más contactos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.topCompanies.map(c => (
              <div key={c.name} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <span className="text-gray-900 dark:text-white truncate">{c.name}</span>
                <span className="text-xs font-semibold text-gray-500">{c.count} {c.count === 1 ? 'tarea' : 'tareas'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de tareas (vista normal y print) */}
      <div id="printable">
        {/* Cabecera solo print */}
        <div className="print-only mb-4">
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', borderBottom: '3px solid #fb923c', paddingBottom: '8px' }}>
            Historial de Tareas · {workspaceName || 'CRM'}
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Periodo: {month === 'all' ? `Año ${year}` : `${MONTHS[month as number]} ${year}`} · Generado el {new Date().toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
            Total: {filtered.length} {filtered.length === 1 ? 'tarea' : 'tareas'}
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <History className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                No hay tareas completadas en este periodo
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700/30">
                {filtered.map((a: any) => {
                  const meta = TYPE_META[a.type] || TYPE_META.task
                  const Icon = meta.icon
                  const d = new Date(a.completed_at)
                  // Ubicación: ciudad / provincia desde billing_address (si existe).
                  const ba = a.companies?.billing_address || {}
                  const location = [ba.city, ba.state].filter(Boolean).join(', ')
                  const isEditingDate = editingDateId === a.id
                  const isSavingDate = savingDateId === a.id
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 print:py-2 print:break-inside-avoid">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} print:!bg-transparent print:border print:border-gray-300`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{meta.label}</span>
                          {a.companies?.name && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">· {a.companies.name}</span>
                          )}
                          {location && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 dark:text-gray-400 italic">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </span>
                          )}
                          {a.contacts && (
                            <span className="text-xs text-gray-500">· {a.contacts.first_name} {a.contacts.last_name}</span>
                          )}
                        </div>
                        {a.subject && a.subject !== meta.label && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{a.subject}</p>
                        )}
                        {a.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 print:line-clamp-none">{a.description}</p>
                        )}
                      </div>

                      {/* Fecha — editable inline */}
                      {isEditingDate ? (
                        <div className="no-print flex items-center gap-1 flex-shrink-0">
                          <input
                            type="datetime-local"
                            value={editingDateValue}
                            onChange={(e) => setEditingDateValue(e.target.value)}
                            disabled={isSavingDate}
                            className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveDate(a.id)}
                            disabled={isSavingDate}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                            title="Guardar"
                          >
                            {isSavingDate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => { setEditingDateId(null); setEditingDateValue('') }}
                            disabled={isSavingDate}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingDateId(a.id); setEditingDateValue(isoToLocalInput(a.completed_at)) }}
                          className="no-print text-right flex-shrink-0 group hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1 transition-colors"
                          title="Cambiar fecha y hora"
                        >
                          <p className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1 justify-end">
                            {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[10px] text-gray-500">{d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                        </button>
                      )}
                      {/* Fecha (versión print, no editable) */}
                      <div className="text-right flex-shrink-0 hidden print:block">
                        <p className="text-xs font-medium">{d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                        <p className="text-[10px] text-gray-500">{d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(a.id)}
                        disabled={deletingId === a.id}
                        className="no-print p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Eliminar tarea"
                      >
                        {deletingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
