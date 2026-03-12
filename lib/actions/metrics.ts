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
    highPriority: number
    byType: Record<string, number>
  }
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
      tasksAllRes,
      tasksPendingRes,
      tasksOverdueRes,
      tasksCompletedRes,
      tasksHighPriorityRes,
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

      // Companies
      supabase
        .from('companies')
        .select('id, updated_at')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null),

      // All activities (for activity breakdown)
      supabase
        .from('activities')
        .select('type, is_completed, due_date, metadata')
        .eq('workspace_id', workspaceId),

      // Task counts - total
      supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),

      // Tasks pending
      supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_completed', false),

      // Tasks overdue
      supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_completed', false)
        .lt('due_date', new Date().toISOString().split('T')[0]),

      // Tasks completed
      supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_completed', true),

      // Tasks high priority (stored in metadata)
      supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_completed', false)
        .contains('metadata', { priority: 'high' }),
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
    const companies = companiesRes.data || []
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const activeCompanies = companies.filter((c: any) =>
      c.updated_at && new Date(c.updated_at) >= sevenDaysAgo
    ).length
    const inactiveCompanies = companies.length - activeCompanies

    // --- Activity metrics ---
    const allActivities = activitiesRes.data || []
    const activityByType = { call: 0, email: 0, meeting: 0, task: 0, note: 0 }
    const taskByType: Record<string, number> = {}
    for (const a of allActivities) {
      const t = a.type as keyof typeof activityByType
      if (t in activityByType) activityByType[t]++
      // Count by type for task breakdown
      const typeKey = a.type || 'other'
      taskByType[typeKey] = (taskByType[typeKey] || 0) + 1
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
          total: companies.length,
          active: activeCompanies,
          inactive: inactiveCompanies,
        },
        activities: {
          total: allActivities.length,
          byType: activityByType,
        },
        tasks: {
          total: tasksAllRes.count || 0,
          pending: tasksPendingRes.count || 0,
          overdue: tasksOverdueRes.count || 0,
          completed: tasksCompletedRes.count || 0,
          highPriority: tasksHighPriorityRes.count || 0,
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
        companies: { total: 0, active: 0, inactive: 0 },
        activities: { total: 0, byType: { call: 0, email: 0, meeting: 0, task: 0, note: 0 } },
        tasks: { total: 0, pending: 0, overdue: 0, completed: 0, highPriority: 0, byType: {} },
      },
      error: String(err),
    }
  }
}
