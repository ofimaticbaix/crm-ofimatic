'use server'

import { createClient } from '@/lib/supabase/server'

// Tasks are stored in the activities table with specific types
// Mock type mapping: llamada→call, tarea→task, reunion→meeting, visita→meeting, email→email

export interface TaskInput {
  subject: string
  type?: 'call' | 'meeting' | 'email' | 'note' | 'task'
  due_date?: string
  scheduled_at?: string
  contact_id?: string | null
  company_id?: string | null
  deal_id?: string | null
  assigned_to_id?: string
  metadata?: Record<string, any> // priority, dueTime stored here
}

// Get tasks (activities) for a workspace
export async function getTasks(workspaceId: string, filters?: {
  onlyPending?: boolean
  date?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('activities')
    .select('*, contacts(id, first_name, last_name), companies(id, name), deals(id, name)')
    .eq('workspace_id', workspaceId)
    .order('due_date', { ascending: true })

  if (filters?.onlyPending) query = query.eq('is_completed', false)
  if (filters?.date) query = query.eq('due_date', filters.date)

  const { data, error } = await query.limit(100)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Create a task (activity)
export async function createTask(workspaceId: string, input: TaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      workspace_id: workspaceId,
      type: input.type || 'task',
      subject: input.subject,
      due_date: input.due_date,
      scheduled_at: input.scheduled_at,
      contact_id: input.contact_id || null,
      company_id: input.company_id || null,
      deal_id: input.deal_id || null,
      created_by_id: user!.id,
      assigned_to_id: input.assigned_to_id || user!.id,
      metadata: input.metadata || {},
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Toggle task completion
export async function toggleTaskComplete(id: string) {
  const supabase = await createClient()

  const { data: current, error: fetchError } = await supabase
    .from('activities')
    .select('is_completed')
    .eq('id', id)
    .single()

  if (fetchError) return { data: null, error: fetchError.message }

  const newCompleted = !current.is_completed

  const { data, error } = await supabase
    .from('activities')
    .update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Get dashboard metrics
export async function getDashboardMetrics(workspaceId: string) {
  const supabase = await createClient()

  // Get deals with stages
  const { data: deals } = await supabase
    .from('deals')
    .select('*, stages(id, name, probability, is_closed_won, is_closed_lost)')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  // Get counts
  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  const dealsArr = deals || []
  const totalValue = dealsArr.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const weightedValue = dealsArr.reduce((sum: number, d: any) => {
    const prob = d.stages?.probability || 0
    return sum + ((d.value || 0) * prob / 100)
  }, 0)
  const wonDeals = dealsArr.filter((d: any) => d.stages?.is_closed_won).length
  const totalDeals = dealsArr.length
  const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

  return {
    data: {
      totalValue,
      weightedValue,
      conversionRate,
      totalDeals,
      wonDeals,
      contactCount: contactCount || 0,
      companyCount: companyCount || 0,
    },
    error: null,
  }
}
