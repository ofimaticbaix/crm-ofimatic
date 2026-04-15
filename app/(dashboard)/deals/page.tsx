'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, TrendingUp, AlertCircle, Clock, X, Loader2, Pencil, Trash2, Trophy, XCircle, CalendarClock, Target } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getDeals, createDeal, updateDeal, deleteDeal } from '@/lib/actions/deals'
import { getPipeline } from '@/lib/actions/pipeline'
import { getCompanies } from '@/lib/actions/companies'
import { useCachedData } from '@/lib/hooks/use-cached-data'
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
            <div {...listeners} {...attributes} className="flex-1 min-w-0 cursor-grab active:cursor-grabbing">
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
    <div className="flex-1 min-w-0">
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

  const { data: deals, loading: dealsLoading, refetch: refetchDeals } = useCachedData<any[]>(
    `deals-${workspaceId}`,
    () => getDeals(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const { data: companies } = useCachedData<any[]>(
    `companies-${workspaceId}`,
    () => getCompanies(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId, staleTime: 60000 }
  )

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
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  )
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const activeDeal = activeDealId ? (deals || []).find((d: any) => d.id === activeDealId) : null

  const handleDragStart = (e: DragStartEvent) => { setActiveDealId(e.active.id as string) }
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDealId(null)
    const { active, over } = e
    if (!over) return
    const newStageId = over.id as string
    const originalStageId = (active.data.current as any)?.stageId
    if (!originalStageId || newStageId === originalStageId) return
    await updateDeal(active.id as string, { stage_id: newStageId })
    refetchDeals()
  }

  const handleQuickStageChange = async (dealId: string, stageId: string) => {
    await updateDeal(dealId, { stage_id: stageId })
    refetchDeals()
  }
  const handleWin = async (deal: any) => {
    const wonStage = stages.find((s: any) => s.is_closed_won)
    if (!wonStage) { toast.error('No hay etapa de "Ganado" configurada'); return }
    await updateDeal(deal.id, { stage_id: wonStage.id, status: 'won' })
    toast.success(`🏆 "${deal.name}" marcado como Ganado`)
    refetchDeals()
  }
  const handleLose = async (deal: any) => {
    const lostStage = stages.find((s: any) => s.is_closed_lost)
    if (!lostStage) { toast.error('No hay etapa de "Perdido" configurada'); return }
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
        <Button
          onClick={() => setShowNewDealModal(true)}
          className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Oportunidad
        </Button>
      </div>

      {/* Tip visual */}
      <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 -mt-1">
        💡 Arrastra las tarjetas entre columnas para cambiar de etapa, o usa los botones <Trophy className="h-3 w-3 inline text-green-500" /> Ganado / <XCircle className="h-3 w-3 inline text-red-500" /> Perdido.
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {stages.map((stage: any) => {
          const stageDeals = (deals || []).filter(d => d.stage_id === stage.id)
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

      {/* Kanban Board — con Drag & Drop */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-1.5 md:gap-3 lg:gap-4 pb-4 w-full">
          {stages.map((stage: any) => {
            const stageDeals = (deals || []).filter((d: any) => d.stage_id === stage.id)
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

        {/* Preview que sigue al cursor durante drag */}
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
