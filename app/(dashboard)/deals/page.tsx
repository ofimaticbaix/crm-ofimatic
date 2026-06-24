'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, TrendingUp, AlertCircle, Clock, X, Loader2, Pencil, Trash2, Trophy, XCircle, CalendarClock, Target, GripVertical, LayoutGrid, List } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getDeals, createDeal, updateDeal, deleteDeal } from '@/lib/actions/deals'
import { getPipeline } from '@/lib/actions/pipeline'
import { getCompanies } from '@/lib/actions/companies'
import { useCachedData } from '@/lib/hooks/use-cached-data'
import { useAllDeals, useAllCompanies } from '@/lib/hooks/use-shared-data'
import { toast } from 'sonner'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor,
  useDraggable, useDroppable, useSensor, useSensors
} from '@dnd-kit/core'

// Close date status — visual chip
function getCloseDateStatus(dateStr: string | null | undefined): 'overdue' | 'thisWeek' | 'future' | 'none' {
  if (!dateStr) return 'none'
  const d = new Date(dateStr)
  const now = new Date()
  const daysLeft = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 7) return 'thisWeek'
  return 'future'
}

// Value tier — colored left border
function getValueTier(v: number): 'none' | 'small' | 'medium' | 'large' | 'huge' {
  if (!v || v <= 0) return 'none'
  if (v < 1000) return 'small'
  if (v < 10000) return 'medium'
  if (v < 50000) return 'large'
  return 'huge'
}
const VALUE_TIER_BORDER: Record<string, string> = {
  none: 'border-l-4 border-l-gray-300 dark:border-l-gray-700',
  small: 'border-l-4 border-l-gray-400',
  medium: 'border-l-4 border-l-blue-500',
  large: 'border-l-4 border-l-green-500',
  huge: 'border-l-4 border-l-purple-500',
}

// Draggable deal card
function DraggableDealCard({
  deal, stages, onEdit, onDelete, onWin, onLose, onStageChange, getDealRiskStatus, getRiskIcon
}: {
  deal: any
  stages: any[]
  onEdit: (d: any) => void
  onDelete: (id: string) => void
  onWin: (d: any) => void
  onLose: (d: any) => void
  onStageChange: (dealId: string, stageId: string) => Promise<void>
  getDealRiskStatus: (d: any) => string
  getRiskIcon: (s: string) => any
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id, data: { stageId: deal.stage_id } })
  const riskStatus = getDealRiskStatus(deal)
  const riskIcon = getRiskIcon(riskStatus)
  const contacts = deal.deal_contacts?.map((dc: any) => dc.contacts).filter(Boolean) || []
  const tier = getValueTier(deal.value || 0)
  const closeStatus = getCloseDateStatus(deal.expected_close_date)
  const currentStage = stages.find((s: any) => s.id === deal.stage_id)
  const isClosedWon = currentStage?.is_closed_won
  const isClosedLost = currentStage?.is_closed_lost

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : {}

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : ''}>
      <Card className={`hover:shadow-xl transition-all bg-white dark:bg-gray-900 ${VALUE_TIER_BORDER[tier]}`}>
        <CardContent className="p-2 md:p-3">
          {/* Drag handle + header */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            {/* Tirador visible — en móvil/tablet es el único punto de drag; en desktop también funciona por el título */}
            <button
              {...listeners}
              {...attributes}
              className="flex-shrink-0 -ml-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing touch-none"
              title="Arrastrar para mover"
              aria-label="Mover oportunidad"
              onClick={(e) => e.preventDefault()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm leading-tight truncate">{deal.name}</h4>
              {deal.companies && (
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{deal.companies.name}</p>
              )}
            </div>
            {riskIcon && <div className="flex-shrink-0">{riskIcon}</div>}
          </div>

          {/* Value — big and prominent */}
          <div className="flex items-baseline justify-between mb-1.5 gap-1">
            <div className="text-sm md:text-lg font-bold text-gray-900 dark:text-white truncate">{formatCurrency(deal.value || 0)}</div>
            {currentStage && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                {currentStage.probability}%
              </span>
            )}
          </div>

          {/* Close date chip */}
          {deal.expected_close_date && (
            <div className="mb-1.5">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                closeStatus === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                closeStatus === 'thisWeek' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                <CalendarClock className="h-2.5 w-2.5" />
                {new Date(deal.expected_close_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}

          {/* Contacts */}
          {contacts.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex -space-x-1.5">
                {contacts.slice(0, 3).map((contact: any) => (
                  <div key={contact.id} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[9px] font-semibold border border-white dark:border-gray-800"
                    title={`${contact.first_name} ${contact.last_name}`}>
                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                  </div>
                ))}
              </div>
              {contacts.length > 3 && <span className="text-[10px] text-gray-500 dark:text-gray-400">+{contacts.length - 3}</span>}
            </div>
          )}

          {/* Win / Lose quick actions */}
          {!isClosedWon && !isClosedLost && (
            <div className="grid grid-cols-2 gap-1 mb-1">
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onWin(deal) }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-lg text-[10px] md:text-xs h-6 md:h-7 bg-green-600 hover:bg-green-700 text-white px-1">
                <Trophy className="h-3 w-3 md:mr-0.5" /><span className="hidden md:inline">Ganado</span>
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onLose(deal) }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-lg text-[10px] md:text-xs h-6 md:h-7 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 px-1">
                <XCircle className="h-3 w-3 md:mr-0.5" /><span className="hidden md:inline">Perdido</span>
              </Button>
            </div>
          )}
          {isClosedWon && (
            <div className="mb-1 text-center px-1 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" /> Ganado
            </div>
          )}
          {isClosedLost && (
            <div className="mb-1 text-center px-1 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1">
              <XCircle className="h-3 w-3" /> Perdido
            </div>
          )}

          {/* Edit / Delete */}
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(deal) }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 rounded-lg text-[10px] md:text-xs h-6 md:h-7 px-1">
              <Pencil className="h-3 w-3 md:mr-0.5" /><span className="hidden md:inline">Editar</span>
            </Button>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDelete(deal.id) }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-lg text-[10px] md:text-xs h-6 md:h-7 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 px-1">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Droppable column
function DroppableStageColumn({
  stage, stageDeals, stageValue, totalPipelineValue, children
}: {
  stage: any
  stageDeals: any[]
  stageValue: number
  totalPipelineValue: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const percentage = totalPipelineValue > 0 ? (stageValue / totalPipelineValue) * 100 : 0
  const stageColor = stage.is_closed_won ? 'from-green-500 to-emerald-600' :
                     stage.is_closed_lost ? 'from-red-500 to-rose-600' :
                     'from-blue-500 to-indigo-600'

  return (
    <div className="flex-shrink-0 w-64 md:w-72 xl:flex-1 xl:w-auto xl:min-w-0">
      {/* Header */}
      <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-t-xl md:rounded-t-2xl p-2 md:p-3 border-x border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm truncate">{stage.name}</h3>
          <span className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">{stage.probability}%</span>
        </div>
        <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-600 dark:text-gray-300 mb-1.5 gap-1">
          <span className="flex-shrink-0">{stageDeals.length}</span>
          <span className="font-semibold text-gray-900 dark:text-white truncate">{formatCurrency(stageValue)}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 md:h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${stageColor} transition-all`} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Droppable content */}
      <div
        ref={setNodeRef}
        className={`space-y-1.5 md:space-y-2 p-1.5 md:p-2 bg-gray-50/50 dark:bg-gray-800/50 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl md:rounded-b-2xl min-h-[400px] md:min-h-[500px] transition-colors ${
          isOver ? 'bg-blue-100/60 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-500' : ''
        }`}
      >
        {children}
        {stageDeals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 md:h-32 text-gray-400 dark:text-gray-500 text-[10px] md:text-xs text-center px-2">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-1 md:mb-2">
              <Plus className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
            </div>
            <span className="hidden md:inline">Arrastra una oportunidad aquí</span>
            <span className="md:hidden">Vacío</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Historial de oportunidades cerradas (ganadas/perdidas) con generación de PDF
function ClosedDealsHistory({ deals, stages, onView }: { deals: any[]; stages: any[]; onView: (d: any) => void }) {
  // Inject print-only stylesheet on mount
  useEffect(() => {
    const STYLE_ID = 'deals-history-print-styles'
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      @media print {
        body[data-print-mode="deals-history"] * { visibility: hidden; }
        body[data-print-mode="deals-history"] #deals-print-area,
        body[data-print-mode="deals-history"] #deals-print-area * { visibility: visible; }
        body[data-print-mode="deals-history"] #deals-print-area {
          position: absolute; left: 0; top: 0; width: 100%; padding: 24px;
          background: white !important; color: #1f2937;
        }
        body[data-print-mode="deals-history"] .no-print { display: none !important; }
      }
      #deals-print-area { display: none; }
      body[data-print-mode="deals-history"] #deals-print-area { display: block; }
    `
    document.head.appendChild(style)
    return () => { document.getElementById(STYLE_ID)?.remove() }
  }, [])

  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'todas' | 'won' | 'lost'>('todas')

  // Periodo del informe — por defecto mes actual
  type PeriodMode = 'month' | 'range'
  const today = new Date()
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [reportYear, setReportYear] = useState(today.getFullYear())
  const [reportMonth, setReportMonth] = useState(today.getMonth()) // 0-11
  const [rangeFrom, setRangeFrom] = useState<string>(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1)
    return d.toISOString().slice(0, 10)
  })
  const [rangeTo, setRangeTo] = useState<string>(() => today.toISOString().slice(0, 10))

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  // Calcular fecha de cierre del deal (updated_at suele ser la fecha en que se marcó won/lost)
  const closedDateOf = (d: any) => new Date(d.updated_at || d.created_at)

  // Todos los deals cerrados (sin filtrar por periodo, para los stats globales del panel)
  const closed = deals.filter((d: any) => {
    const st = stages.find((s: any) => s.id === d.stage_id)
    return st && (st.is_closed_won || st.is_closed_lost)
  })

  // Calcular periodo seleccionado en formato Date range
  const periodRange = (() => {
    if (periodMode === 'month') {
      const from = new Date(reportYear, reportMonth, 1)
      const to = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59)
      return { from, to, label: `${MONTHS_ES[reportMonth]} ${reportYear}` }
    } else {
      const from = new Date(rangeFrom + 'T00:00:00')
      const to = new Date(rangeTo + 'T23:59:59')
      const f = from.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      const t = to.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      return { from, to, label: `${f} → ${t}` }
    }
  })()

  // Deals cerrados DENTRO del periodo (lo que va al PDF)
  const closedInPeriod = closed.filter((d: any) => {
    const dt = closedDateOf(d)
    return dt >= periodRange.from && dt <= periodRange.to
  })

  const won = closed.filter((d: any) => stages.find((s: any) => s.id === d.stage_id)?.is_closed_won)
  const lost = closed.filter((d: any) => stages.find((s: any) => s.id === d.stage_id)?.is_closed_lost)
  const wonValue = won.reduce((sum, d) => sum + (d.value || 0), 0)
  const lostValue = lost.reduce((sum, d) => sum + (d.value || 0), 0)
  const totalClosed = closed.length || 1
  const winRate = Math.round((won.length / totalClosed) * 100)

  const wonInPeriod = closedInPeriod.filter((d: any) => stages.find((s: any) => s.id === d.stage_id)?.is_closed_won)
  const lostInPeriod = closedInPeriod.filter((d: any) => stages.find((s: any) => s.id === d.stage_id)?.is_closed_lost)
  const wonInPeriodValue = wonInPeriod.reduce((sum, d) => sum + (d.value || 0), 0)
  const lostInPeriodValue = lostInPeriod.reduce((sum, d) => sum + (d.value || 0), 0)
  const winRateInPeriod = closedInPeriod.length > 0 ? Math.round((wonInPeriod.length / closedInPeriod.length) * 100) : 0

  // Etapas ordenadas por posición (para el embudo visual)
  const stagesSorted = [...stages].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))

  const visible = (filter === 'won' ? won : filter === 'lost' ? lost : closed)
    .slice()
    .sort((a, b) => closedDateOf(b).getTime() - closedDateOf(a).getTime())

  // Lista del PDF — ordenada por fecha de cierre desc
  const reportDeals = closedInPeriod
    .slice()
    .sort((a, b) => closedDateOf(b).getTime() - closedDateOf(a).getTime())

  const printReport = () => {
    document.body.dataset.printMode = 'deals-history'
    setTimeout(() => {
      window.print()
      delete document.body.dataset.printMode
    }, 100)
  }

  // Años disponibles (basado en deals existentes)
  const years = (() => {
    const set = new Set<number>([today.getFullYear()])
    closed.forEach((d: any) => set.add(closedDateOf(d).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  })()

  // Mostrar siempre el panel — si no hay deals cerrados, el bloque de informes queda
  // visible con datos en cero y botón de PDF deshabilitado, pero el usuario ve la feature.


  return (
    <>
    <Card className="no-print">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Trophy className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="text-left min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">Historial de oportunidades cerradas</h3>
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {won.length} ganadas · {lost.length} perdidas · {winRate}% tasa de éxito
            </p>
          </div>
        </div>
        <span className={`text-xs text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          {/* Bloque de informe PDF */}
          <div className="rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-900/10 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Generar informe PDF</h4>
            </div>

            {/* Selector tipo periodo — full width en mobile, inline en desktop */}
            <div className="grid grid-cols-2 sm:inline-grid sm:grid-cols-2 p-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-3 w-full sm:w-auto gap-1">
              {([
                { key: 'month' as const, label: 'Mensual', shortLabel: 'Mensual' },
                { key: 'range' as const, label: 'Rango personalizado', shortLabel: 'Rango' },
              ]).map(({ key, label, shortLabel }) => (
                <button
                  key={key}
                  onClick={() => setPeriodMode(key)}
                  className={`px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                    periodMode === key ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Inputs según el modo */}
            {periodMode === 'month' ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(parseInt(e.target.value, 10))}
                  className="h-9 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 min-w-0"
                >
                  {MONTHS_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(parseInt(e.target.value, 10))}
                  className="h-9 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 min-w-0"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Desde</label>
                  <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)}
                    className="h-9 w-full text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Hasta</label>
                  <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)}
                    className="h-9 w-full text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2" />
                </div>
              </div>
            )}

            {/* En mobile: texto arriba, botón abajo de ancho completo. En desktop: en línea. */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-[11px] text-gray-600 dark:text-gray-400 min-w-0">
                Periodo: <span className="font-semibold text-gray-900 dark:text-white">{periodRange.label}</span>
                {' · '}
                <span className="font-semibold text-gray-900 dark:text-white">{closedInPeriod.length}</span> cerradas
              </p>
              <Button
                onClick={printReport}
                disabled={closedInPeriod.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                📄 Descargar PDF
              </Button>
            </div>
          </div>

          {/* Stats grid — 2 cols en mobile, 4 en desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider truncate">Ganadas</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{won.length}</div>
              <div className="text-[11px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 truncate">{formatCurrency(wonValue)}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider truncate">Perdidas</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">{lost.length}</div>
              <div className="text-[11px] sm:text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">{formatCurrency(lostValue)}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider truncate">Tasa éxito</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{winRate}%</div>
              <div className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">{won.length} de {closed.length}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider truncate">Total cerradas</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{closed.length}</div>
              <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{formatCurrency(wonValue + lostValue)}</div>
            </div>
          </div>

          {/* Filtros — full width en mobile, inline en desktop */}
          <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 gap-1 w-full sm:w-auto">
            {([
              { key: 'todas' as const, label: 'Todas',    count: closed.length, cls: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' },
              { key: 'won' as const,   label: 'Ganadas',  count: won.length,    cls: 'bg-green-600 text-white' },
              { key: 'lost' as const,  label: 'Perdidas', count: lost.length,   cls: 'bg-red-600 text-white' },
            ]).map(({ key, label, count, cls }) => {
              const active = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    active ? `${cls} shadow-md` : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/40'
                  }`}
                >
                  <span className="truncate">{label}</span>
                  <span className={`px-1.5 rounded-md text-[10px] font-bold flex-shrink-0 ${active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Lista */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/40 divide-y divide-gray-100 dark:divide-gray-700/40 max-h-[400px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No hay oportunidades en este filtro.</div>
            ) : visible.map((deal: any) => {
              const st = stages.find((s: any) => s.id === deal.stage_id)
              const isWon = !!st?.is_closed_won
              const date = deal.updated_at || deal.created_at
              return (
                <button
                  key={deal.id}
                  onClick={() => onView(deal)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isWon ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {isWon ? <Trophy className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{deal.name}</span>
                      <Badge className={`text-[9px] rounded-full ${
                        isWon ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{isWon ? 'Ganada' : 'Perdida'}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {deal.companies?.name && <span className="truncate">{deal.companies.name}</span>}
                      {deal.companies?.name && date && <span>·</span>}
                      {date && <span>{new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${isWon ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatCurrency(deal.value || 0)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>

    {/* Reporte PRINT-ONLY — visible solo al imprimir */}
    <div id="deals-print-area">
      <div style={{ borderBottom: '4px solid #ea580c', paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ea580c', margin: 0 }}>
          🏆 Informe de Oportunidades
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
          Periodo: <strong style={{ color: '#1f2937' }}>{periodRange.label}</strong>
          {' · '}Generado el {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats globales del periodo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <div style={{ padding: 14, borderRadius: 10, border: '2px solid #16a34a', background: '#f0fdf4' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>🏆 GANADAS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#15803d', marginTop: 4 }}>{wonInPeriod.length}</div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>{formatCurrency(wonInPeriodValue)}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '2px solid #dc2626', background: '#fef2f2' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>❌ PERDIDAS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#b91c1c', marginTop: 4 }}>{lostInPeriod.length}</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>{formatCurrency(lostInPeriodValue)}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '2px solid #2563eb', background: '#eff6ff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>🎯 TASA ÉXITO</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>{winRateInPeriod}%</div>
          <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>{wonInPeriod.length} de {closedInPeriod.length}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '2px solid #6b7280', background: '#f9fafb' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>💰 VALOR TOTAL</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1f2937', marginTop: 4 }}>{formatCurrency(wonInPeriodValue + lostInPeriodValue)}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{closedInPeriod.length} oportunidades</div>
        </div>
      </div>

      {/* Lista de oportunidades cerradas */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a', borderLeft: '4px solid #ea580c', paddingLeft: 12, marginBottom: 16 }}>
        Detalle de oportunidades ({reportDeals.length})
      </h2>

      {reportDeals.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 14 }}>
          No hay oportunidades cerradas en este periodo.
        </p>
      ) : reportDeals.map((deal: any) => {
        const finalStage = stages.find((s: any) => s.id === deal.stage_id)
        const isWon = !!finalStage?.is_closed_won
        const finalStagePos = finalStage?.position ?? 0
        const created = new Date(deal.created_at)
        const closedDate = closedDateOf(deal)
        const daysInPipeline = Math.max(0, Math.round((closedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))

        return (
          <div key={deal.id} style={{
            pageBreakInside: 'avoid',
            marginBottom: 18,
            padding: 16,
            border: `2px solid ${isWon ? '#16a34a' : '#dc2626'}`,
            borderRadius: 12,
            background: isWon ? '#f0fdf4' : '#fef2f2',
          }}>
            {/* Cabecera del deal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    background: isWon ? '#16a34a' : '#dc2626', color: 'white', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {isWon ? '🏆 GANADA' : '❌ PERDIDA'}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', margin: 0 }}>{deal.name}</h3>
                {deal.companies?.name && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>🏢 {deal.companies.name}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: isWon ? '#15803d' : '#6b7280' }}>
                  {formatCurrency(deal.value || 0)}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {daysInPipeline} {daysInPipeline === 1 ? 'día' : 'días'} en pipeline
                </div>
              </div>
            </div>

            {/* Embudo / proceso visual */}
            <div style={{ marginTop: 14, marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                📊 Proceso de la oportunidad
              </p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                {stagesSorted.map((s: any, idx: number) => {
                  const isReached = (s.position ?? 0) <= finalStagePos
                  const isFinal = s.id === deal.stage_id
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        border: `2px solid ${
                          isFinal
                            ? (isWon ? '#16a34a' : '#dc2626')
                            : isReached ? '#9ca3af' : '#e5e7eb'
                        }`,
                        background: isFinal
                          ? (isWon ? '#16a34a' : '#dc2626')
                          : isReached ? '#f3f4f6' : 'white',
                        color: isFinal ? 'white' : isReached ? '#374151' : '#9ca3af',
                      }}>
                        {isFinal ? (isWon ? '✓ ' : '✕ ') : isReached ? '○ ' : ''}{s.name}
                      </div>
                      {idx < stagesSorted.length - 1 && (
                        <span style={{ color: isReached ? '#9ca3af' : '#e5e7eb', fontSize: 14 }}>→</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Fechas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
              <div>
                <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Inicio</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                  {created.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cerrada</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isWon ? '#15803d' : '#b91c1c' }}>
                  {closedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Pie de página */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
        CRM Ofimatic Baix · Informe de oportunidades · {periodRange.label}
      </div>
    </div>
    </>
  )
}

// Vista móvil/tablet: selector de etapa + cards apiladas
function MobileStageView({
  stages, deals, onEdit, onDelete, onWin, onLose, onStageChange, getDealRiskStatus, getRiskIcon, totalValue
}: {
  stages: any[]
  deals: any[]
  onEdit: (d: any) => void
  onDelete: (id: string) => void
  onWin: (d: any) => void
  onLose: (d: any) => void
  onStageChange: (id: string, stageId: string) => Promise<void>
  getDealRiskStatus: (d: any) => string
  getRiskIcon: (s: string) => any
  totalValue: number
}) {
  const [activeStageId, setActiveStageId] = useState(stages[0]?.id || '')
  const stageDeals = deals.filter((d: any) => d.stage_id === activeStageId)
  const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const activeStage = stages.find((s: any) => s.id === activeStageId)

  return (
    <div className="space-y-3">
      {/* Tab bar de etapas — scroll horizontal */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {stages.map((stage: any) => {
          const count = deals.filter((d: any) => d.stage_id === stage.id).length
          const isActive = stage.id === activeStageId
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {stage.name}
              <span className={`min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Info de la etapa activa */}
      {activeStage && (
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{activeStage.name}</span>
            <span className="text-xs text-gray-500 ml-2">{activeStage.probability}% probabilidad</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(stageValue)}</span>
        </div>
      )}

      {/* Cards de la etapa seleccionada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stageDeals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">
            <Plus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No hay oportunidades en esta etapa
          </div>
        ) : (
          stageDeals.map((deal: any) => {
            const riskStatus = getDealRiskStatus(deal)
            const riskIcon = getRiskIcon(riskStatus)
            const contacts = deal.deal_contacts?.map((dc: any) => dc.contacts).filter(Boolean) || []
            const tier = getValueTier(deal.value || 0)
            const closeStatus = getCloseDateStatus(deal.expected_close_date)
            const currentStage = stages.find((s: any) => s.id === deal.stage_id)
            const isClosedWon = currentStage?.is_closed_won
            const isClosedLost = currentStage?.is_closed_lost

            return (
              <Card key={deal.id} className={`bg-white dark:bg-gray-900 ${VALUE_TIER_BORDER[tier]}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{deal.name}</h4>
                      {deal.companies && <p className="text-xs text-gray-500 mt-0.5">{deal.companies.name}</p>}
                    </div>
                    {riskIcon}
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(deal.value || 0)}</span>
                    {currentStage && <span className="text-xs text-gray-500">{currentStage.probability}%</span>}
                  </div>
                  {deal.expected_close_date && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium mb-2 ${
                      closeStatus === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      closeStatus === 'thisWeek' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      <CalendarClock className="h-3 w-3" />
                      {new Date(deal.expected_close_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {contacts.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      {contacts.slice(0, 3).map((c: any) => (
                        <div key={c.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[9px] font-semibold flex items-center justify-center border border-white dark:border-gray-800" title={`${c.first_name} ${c.last_name}`}>
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </div>
                      ))}
                      {contacts.length > 3 && <span className="text-[10px] text-gray-400">+{contacts.length - 3}</span>}
                    </div>
                  )}
                  {!isClosedWon && !isClosedLost && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button size="sm" onClick={() => onWin(deal)} className="rounded-lg text-xs h-8 bg-green-600 hover:bg-green-700 text-white">
                        <Trophy className="h-3.5 w-3.5 mr-1" /> Ganado
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onLose(deal)} className="rounded-lg text-xs h-8 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Perdido
                      </Button>
                    </div>
                  )}
                  {isClosedWon && <div className="text-center py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold mb-2"><Trophy className="h-3 w-3 inline mr-1" />Ganado</div>}
                  {isClosedLost && <div className="text-center py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold mb-2"><XCircle className="h-3 w-3 inline mr-1" />Perdido</div>}
                  <select
                    value={deal.stage_id}
                    onChange={(e) => { if (e.target.value !== deal.stage_id) onStageChange(deal.id, e.target.value) }}
                    className="w-full h-8 text-xs rounded-lg bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 mb-2"
                  >
                    {stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(deal)} className="flex-1 rounded-lg text-xs h-8">
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(deal.id)} className="rounded-lg text-xs h-8 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function DealsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace()
  const [showNewDealModal, setShowNewDealModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingDeal, setEditingDeal] = useState<any>(null)
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null)
  const [updatingDeal, setUpdatingDeal] = useState(false)
  const [deletingDeal, setDeletingDeal] = useState(false)
  const [newDeal, setNewDeal] = useState({
    name: '',
    value: '',
    companyId: '',
    stageId: '',
    expectedCloseDate: ''
  })

  // Cached data - loads instantly if cached
  const { data: pipeline } = useCachedData(
    `pipeline-${workspaceId}`,
    () => getPipeline(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId, staleTime: 120000 } // Pipeline rarely changes
  )

  // SHARED dataset — same source as /metrics, /clients, etc. Mutations broadcast
  // automatically so other pages (and tabs) refresh in sync.
  const { data: deals, loading: dealsLoading, refetch: refetchDeals } = useAllDeals()

  const { data: companies } = useAllCompanies()

  // Set default stage when pipeline loads
  useEffect(() => {
    if (pipeline?.stages?.length > 0 && !newDeal.stageId) {
      setNewDeal(prev => ({ ...prev, stageId: pipeline.stages[0].id }))
    }
  }, [pipeline, newDeal.stageId])

  // Overall loading - only block if no cached data
  const loading = workspaceLoading || (dealsLoading && !deals)

  const stages = pipeline?.stages || []

  const handleCreateDeal = async () => {
    if (!pipeline) return
    setCreating(true)

    const { data, error } = await createDeal(workspaceId, {
      name: newDeal.name,
      value: Number(newDeal.value),
      company_id: newDeal.companyId || null,
      pipeline_id: pipeline.id,
      stage_id: newDeal.stageId,
      expected_close_date: newDeal.expectedCloseDate || undefined,
    })

    if (error) {
      console.error('Error creating deal:', error)
      setCreating(false)
      return
    }

    // Reload deals
    refetchDeals()

    setShowNewDealModal(false)
    setNewDeal({
      name: '',
      value: '',
      companyId: '',
      stageId: stages[0]?.id || '',
      expectedCloseDate: ''
    })
    setCreating(false)
  }

  const handleUpdateDeal = async () => {
    if (!editingDeal) return
    setUpdatingDeal(true)
    const result = await updateDeal(editingDeal.id, {
      name: editingDeal.name,
      value: Number(editingDeal.value),
      company_id: editingDeal.company_id || null,
      stage_id: editingDeal.stage_id,
      expected_close_date: editingDeal.expected_close_date || undefined,
    })
    setUpdatingDeal(false)
    if (!result.error) {
      setEditingDeal(null)
      refetchDeals()
    }
  }

  const handleDeleteDeal = async (id: string) => {
    setDeletingDeal(true)
    const result = await deleteDeal(id)
    setDeletingDeal(false)
    if (!result.error) {
      setDeletingDealId(null)
      refetchDeals()
    }
  }

  const getDealRiskStatus = (deal: any) => {
    const dateToCheck = deal.updated_at || deal.created_at
    if (!dateToCheck) return 'healthy'

    const daysSinceActivity = Math.floor(
      (new Date().getTime() - new Date(dateToCheck).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceActivity >= 7) return 'at-risk'
    if (daysSinceActivity >= 4) return 'warning'
    return 'healthy'
  }

  const getRiskIcon = (status: string) => {
    switch (status) {
      case 'at-risk':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const totalValue = (deals || []).reduce((sum, deal) => sum + (deal.value || 0), 0)
  // Weighted pipeline value = suma de (value × probabilidad de la etapa)
  const weightedValue = (deals || []).reduce((sum, deal: any) => {
    const st = stages.find((s: any) => s.id === deal.stage_id)
    if (!st || st.is_closed_won || st.is_closed_lost) return sum
    const prob = (st.probability || 0) / 100
    return sum + (deal.value || 0) * prob
  }, 0)

  // Drag & drop sensors (pointer for desktop, touch for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Sin delay: el handle tiene `touch-none` así el navegador no interpreta scroll.
    // Pequeña distancia (6px) para distinguir tap de drag.
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } })
  )
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  // Optimistic overrides: applied locally so cards/columns update INSTANTLY,
  // before the refetch completes. Cleared whenever fresh data arrives from server.
  const [overrides, setOverrides] = useState<Record<string, Partial<any>>>({})
  useEffect(() => { setOverrides({}) }, [deals])

  const displayDeals = (deals || []).map((d: any) => {
    const o = overrides[d.id]
    if (!o) return d
    // When overriding stage_id, also resolve the new `stages` join so badges/colours match.
    const newStage = o.stage_id ? stages.find((s: any) => s.id === o.stage_id) : d.stages
    return { ...d, ...o, stages: newStage || d.stages }
  })

  const activeDeal = activeDealId ? displayDeals.find((d: any) => d.id === activeDealId) : null

  const applyOptimistic = (dealId: string, patch: Partial<any>) => {
    setOverrides(o => ({ ...o, [dealId]: { ...(o[dealId] || {}), ...patch } }))
  }

  const handleDragStart = (e: DragStartEvent) => { setActiveDealId(e.active.id as string) }
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDealId(null)
    const { active, over } = e
    if (!over) return
    const newStageId = over.id as string
    const originalStageId = (active.data.current as any)?.stageId
    if (!originalStageId || newStageId === originalStageId) return
    applyOptimistic(active.id as string, { stage_id: newStageId })
    await updateDeal(active.id as string, { stage_id: newStageId })
    refetchDeals()
  }

  const handleQuickStageChange = async (dealId: string, stageId: string) => {
    applyOptimistic(dealId, { stage_id: stageId })
    await updateDeal(dealId, { stage_id: stageId })
    refetchDeals()
  }
  const handleWin = async (deal: any) => {
    const wonStage = stages.find((s: any) => s.is_closed_won)
    if (!wonStage) { toast.error('No hay etapa de "Ganado" configurada'); return }
    applyOptimistic(deal.id, { stage_id: wonStage.id, status: 'won' })
    await updateDeal(deal.id, { stage_id: wonStage.id, status: 'won' })
    toast.success(`🏆 "${deal.name}" marcado como Ganado`)
    refetchDeals()
  }
  const handleLose = async (deal: any) => {
    const lostStage = stages.find((s: any) => s.is_closed_lost)
    if (!lostStage) { toast.error('No hay etapa de "Perdido" configurada'); return }
    applyOptimistic(deal.id, { stage_id: lostStage.id, status: 'lost' })
    await updateDeal(deal.id, { stage_id: lostStage.id, status: 'lost' })
    toast.success(`"${deal.name}" marcado como Perdido`)
    refetchDeals()
  }

  if (workspaceLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Embudo de Ventas</h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            {(deals || []).length} oportunidades · Total <span className="font-semibold text-white">{formatCurrency(totalValue)}</span>
            {weightedValue > 0 && (
              <> · Proyectado <span className="font-semibold text-blue-300" title="Valor × probabilidad de cada etapa (exc. ganados/perdidos)">
                {formatCurrency(weightedValue)}
              </span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Toggle vista */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Vista Kanban (arrastrar)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Vista Lista (por etapa)"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
          <Button
            onClick={() => setShowNewDealModal(true)}
            className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            Nueva Oportunidad
          </Button>
        </div>
      </div>

      {/* Tip visual */}
      <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 -mt-1">
        💡 Arrastra las tarjetas entre columnas para cambiar de etapa, o usa los botones <Trophy className="h-3 w-3 inline text-green-500" /> Ganado / <XCircle className="h-3 w-3 inline text-red-500" /> Perdido.
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {stages.map((stage: any) => {
          const stageDeals = displayDeals.filter((d: any) => d.stage_id === stage.id)
          const stageValue = stageDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)

          return (
            <Card key={stage.id} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase truncate">
                  {stage.name}
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2">
                  {stageDeals.length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatCurrency(stageValue)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Vista Lista (tabs + cards) */}
      {viewMode === 'list' && (
        <MobileStageView
          stages={stages}
          deals={displayDeals}
          onEdit={(d) => setEditingDeal({ ...d, value: d.value || 0, expected_close_date: d.expected_close_date || '' })}
          onDelete={(id) => setDeletingDealId(id)}
          onWin={handleWin}
          onLose={handleLose}
          onStageChange={handleQuickStageChange}
          getDealRiskStatus={getDealRiskStatus}
          getRiskIcon={getRiskIcon}
          totalValue={totalValue}
        />
      )}

      {/* Vista Kanban con Drag & Drop */}
      {viewMode === 'kanban' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-2 md:gap-3 lg:gap-4 pb-4 overflow-x-auto">
            {stages.map((stage: any) => {
              const stageDeals = displayDeals.filter((d: any) => d.stage_id === stage.id)
              const stageValue = stageDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)

              return (
                <DroppableStageColumn
                  key={stage.id}
                  stage={stage}
                  stageDeals={stageDeals}
                  stageValue={stageValue}
                  totalPipelineValue={totalValue}
                >
                  {stageDeals.map((deal: any) => (
                    <DraggableDealCard
                      key={deal.id}
                      deal={deal}
                      stages={stages}
                      onEdit={(d) => setEditingDeal({ ...d, value: d.value || 0, expected_close_date: d.expected_close_date || '' })}
                      onDelete={(id) => setDeletingDealId(id)}
                      onWin={handleWin}
                      onLose={handleLose}
                      onStageChange={handleQuickStageChange}
                      getDealRiskStatus={getDealRiskStatus}
                      getRiskIcon={getRiskIcon}
                    />
                  ))}
                </DroppableStageColumn>
              )
            })}
          </div>

          <DragOverlay>
            {activeDeal && (
              <Card className={`shadow-2xl rotate-2 bg-white dark:bg-gray-900 ${VALUE_TIER_BORDER[getValueTier(activeDeal.value || 0)]}`}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{activeDeal.name}</h4>
                  {activeDeal.companies && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activeDeal.companies.name}</p>}
                  <div className="text-xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(activeDeal.value || 0)}</div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Historial de oportunidades cerradas (ganadas/perdidas) */}
      <ClosedDealsHistory deals={displayDeals} stages={stages} onView={(d) => setEditingDeal({ ...d, value: d.value || 0, expected_close_date: d.expected_close_date || '' })} />


      {/* Modal Editar Oportunidad */}
      {editingDeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingDeal(null)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">Editar Oportunidad</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingDeal(null)} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Nombre *</label>
                  <Input value={editingDeal.name || ''} onChange={(e) => setEditingDeal({...editingDeal, name: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="Nombre de la oportunidad" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Valor (EUR) *</label>
                  <Input type="number" value={editingDeal.value || ''} onChange={(e) => setEditingDeal({...editingDeal, value: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" placeholder="45000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Empresa</label>
                  <select value={editingDeal.company_id || ''} onChange={(e) => setEditingDeal({...editingDeal, company_id: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <option value="">Seleccionar empresa</option>
                    {[...(companies || [])].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es')).map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Etapa *</label>
                  <select value={editingDeal.stage_id || ''} onChange={(e) => setEditingDeal({...editingDeal, stage_id: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    {stages.map((stage: any) => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">Fecha de Cierre Esperada</label>
                  <Input type="date" value={editingDeal.expected_close_date || ''} onChange={(e) => setEditingDeal({...editingDeal, expected_close_date: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleUpdateDeal} className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!editingDeal.name || !editingDeal.value || updatingDeal}>
                  {updatingDeal ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button variant="outline" onClick={() => setEditingDeal(null)}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Eliminar Oportunidad */}
      {deletingDealId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeletingDealId(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Eliminar Oportunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">¿Estás seguro de que quieres eliminar esta oportunidad? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <Button onClick={() => handleDeleteDeal(deletingDealId)} disabled={deletingDeal}
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl">
                  {deletingDeal ? 'Eliminando...' : 'Eliminar'}
                </Button>
                <Button variant="outline" onClick={() => setDeletingDealId(null)}
                  className="flex-1 rounded-xl dark:border-gray-700 dark:text-gray-300">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nueva Oportunidad */}
      {showNewDealModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewDealModal(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">Nueva Oportunidad</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewDealModal(false)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Nombre de la Oportunidad *
                  </label>
                  <Input
                    value={newDeal.name}
                    onChange={(e) => setNewDeal({...newDeal, name: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Ej: Enterprise CRM - Acme Corp"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Valor (EUR) *
                  </label>
                  <Input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Empresa *
                  </label>
                  <select
                    value={newDeal.companyId}
                    onChange={(e) => setNewDeal({...newDeal, companyId: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar empresa</option>
                    {[...(companies || [])].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es')).map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Etapa *
                  </label>
                  <select
                    value={newDeal.stageId}
                    onChange={(e) => setNewDeal({...newDeal, stageId: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  >
                    {stages.map((stage: any) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Fecha de Cierre Esperada *
                  </label>
                  <Input
                    type="date"
                    value={newDeal.expectedCloseDate}
                    onChange={(e) => setNewDeal({...newDeal, expectedCloseDate: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateDeal}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newDeal.name || !newDeal.value || !newDeal.companyId || !newDeal.expectedCloseDate || creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    'Crear Oportunidad'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewDealModal(false)}
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
