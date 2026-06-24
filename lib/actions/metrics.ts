'use server'

import { createClient } from '@/lib/supabase/server'

export interface FullMetrics {
  pipeline: {
    totalValue: number
    weightedValue: number
    avgDealSize: number
    conversionRate: number
    dealsByStage: { id: string; name: string; count: number; value: number }[]
  }
  contacts: {
    total: number
    byLifecycle: { customer: number; prospect: number; lead: number }
  }
  companies: {
    total: number
    active: number
    inactive: number
    potential: number
  }
  activities: {
    total: number
    byType: { call: number; email: number; meeting: number; task: number; note: number }
  }
  tasks: {
    total: number
    pending: number
    overdue: number
    completed: number
    today: number
    byType: Record<string, number>
  }
}

// Helper: pagina la tabla companies hasta no haber más filas. PostgREST trunca a
// 1000 por defecto y `.range(0, 9999)` no basta — hay que ir lote por lote.
async function loadAllCompanies(supabase: any, workspaceId: string) {
  const PAGE = 1000
  const out: any[] = []
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, account_type, custom_fields, updated_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .range(i * PAGE, (i + 1) * PAGE - 1)
    if (error) return { data: out, error: error.message }
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < PAGE) break
  }
  return { data: out, error: null }
}

export async function getFullMetrics(workspaceId: string): Promise<{ data: FullMetrics; error: string | null }> {
  try {
    const supabase = await createClient()

    // Run all queries in parallel for efficiency
    const [
      dealsRes,
      contactsRes,
      contactLifecycleRes,
      companiesRes,
      activitiesRes,
    ] = await Promise.all([
      // Deals with stages
      supabase
        .from('deals')
        .select('id, value, stages(id, name, probability, position, is_closed_won, is_closed_lost)')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null),

      // Total contacts
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null),

      // Contacts by lifecycle_stage
      supabase
        .from('contacts')
        .select('lifecycle_stage')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null),

      // Companies — paginated to avoid PostgREST's 1000-row default truncation.
      loadAllCompanies(supabase, workspaceId),

      // All activities — single source of truth for activities + tasks counts.
      supabase
        .from('activities')
        .select('type, is_completed, due_date, scheduled_at, completed_at, metadata')
        .eq('workspace_id', workspaceId)
        .range(0, 9999),
    ])

    // --- Pipeline metrics ---
    const deals = dealsRes.data || []
    const totalValue = deals.reduce((sum, d: any) => sum + (d.value || 0), 0)
    const weightedValue = deals.reduce((sum, d: any) => {
      const prob = d.stages?.probability || 0
      return sum + ((d.value || 0) * prob / 100)
    }, 0)
    const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0
    const wonDeals = deals.filter((d: any) => d.stages?.is_closed_won).length
    const conversionRate = deals.length > 0 ? Math.round((wonDeals / deals.length) * 100) : 0

    // Group deals by stage
    const stageMap = new Map<string, { id: string; name: string; position: number; count: number; value: number }>()
    for (const deal of deals as any[]) {
      const stage = deal.stages
      if (!stage) continue
      const existing = stageMap.get(stage.id)
      if (existing) {
        existing.count++
        existing.value += deal.value || 0
      } else {
        stageMap.set(stage.id, {
          id: stage.id,
          name: stage.name,
          position: stage.position ?? 0,
          count: 1,
          value: deal.value || 0,
        })
      }
    }
    const dealsByStage = Array.from(stageMap.values())
      .sort((a, b) => a.position - b.position)
      .map(({ id, name, count, value }) => ({ id, name, count, value }))

    // --- Contact metrics ---
    const contactLifecycles = contactLifecycleRes.data || []
    const byLifecycle = { customer: 0, prospect: 0, lead: 0 }
    for (const c of contactLifecycles) {
      const stage = (c.lifecycle_stage || '').toLowerCase()
      if (stage === 'customer') byLifecycle.customer++
      else if (stage === 'prospect') byLifecycle.prospect++
      else if (stage === 'lead') byLifecycle.lead++
    }

    // --- Company metrics ---
    // "Estado de Clientes" cuenta SOLO customers reales (mismo criterio que Vista
    // General y Clientes Activos/Inactivos). Activo/Inactivo viene del flag manual.
    const companies = companiesRes.data || []
    const customersOnly = companies.filter((c: any) => c.account_type === 'customer')
    const inactiveCompanies = customersOnly.filter((c: any) => c.custom_fields?.manual_status === 'inactive').length
    const activeCompanies = customersOnly.length - inactiveCompanies
    const potentialCompanies = companies.filter((c: any) => c.account_type === 'lead').length

    // --- Activity & task metrics (single pass over the dataset) ---
    const allActivities = activitiesRes.data || []
    const activityByType = { call: 0, email: 0, meeting: 0, task: 0, note: 0 }
    const taskByType: Record<string, number> = {}

    // "Tasks" = activities the user actually has to do — those with a date set.
    // Logged contacts (calls/emails/etc. registered after-the-fact) without dates
    // count as activities but not as pending tasks.
    let totalTasks = 0
    let pending = 0
    let overdue = 0
    let completed = 0
    let today = 0

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const todayStart = new Date(todayStr + 'T00:00:00').getTime()
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000

    for (const a of allActivities as any[]) {
      const t = a.type as keyof typeof activityByType
      if (t in activityByType) activityByType[t]++

      const hasDate = !!(a.due_date || a.scheduled_at)
      const isTask = hasDate || a.type === 'task'

      if (isTask) {
        totalTasks++
        const typeKey = a.type || 'other'
        taskByType[typeKey] = (taskByType[typeKey] || 0) + 1

        if (a.is_completed === true) {
          completed++
        } else {
          pending++
          // Compute the relevant date for this task
          const dateRaw = a.scheduled_at || a.due_date
          if (dateRaw) {
            const ts = new Date(dateRaw).getTime()
            if (!isNaN(ts)) {
              if (ts < todayStart) overdue++
              else if (ts < tomorrowStart) today++
            }
          }
        }
      }
    }

    return {
      data: {
        pipeline: {
          totalValue,
          weightedValue,
          avgDealSize,
          conversionRate,
          dealsByStage,
        },
        contacts: {
          total: contactsRes.count || 0,
          byLifecycle,
        },
        companies: {
          // total = solo customers reales, NO leads ni prospects (consistente con Vista General)
          total: customersOnly.length,
          active: activeCompanies,
          inactive: inactiveCompanies,
          potential: potentialCompanies,
        },
        activities: {
          total: allActivities.length,
          byType: activityByType,
        },
        tasks: {
          total: totalTasks,
          pending,
          overdue,
          completed,
          today,
          byType: taskByType,
        },
      },
      error: null,
    }
  } catch (err) {
    console.error('getFullMetrics error:', err)
    return {
      data: {
        pipeline: { totalValue: 0, weightedValue: 0, avgDealSize: 0, conversionRate: 0, dealsByStage: [] },
        contacts: { total: 0, byLifecycle: { customer: 0, prospect: 0, lead: 0 } },
        companies: { total: 0, active: 0, inactive: 0, potential: 0 },
        activities: { total: 0, byType: { call: 0, email: 0, meeting: 0, task: 0, note: 0 } },
        tasks: { total: 0, pending: 0, overdue: 0, completed: 0, today: 0, byType: {} },
      },
      error: String(err),
    }
  }
}
