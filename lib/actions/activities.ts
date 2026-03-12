'use server'

import { createClient } from '@/lib/supabase/server'

export interface ActivityInput {
  type: 'call' | 'meeting' | 'email' | 'note' | 'task'
  subject?: string
  description?: string
  outcome?: string
  scheduled_at?: string
  due_date?: string
  assigned_to_id?: string
  contact_id?: string | null
  company_id?: string | null
  deal_id?: string | null
  metadata?: Record<string, any>
}

// Listar actividades del workspace
export async function getActivities(workspaceId: string, filters?: {
  type?: string
  contactId?: string
  companyId?: string
  dealId?: string
  onlyPending?: boolean
}) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('activities')
      .select('*, contacts(id, first_name, last_name), companies(id, name), deals(id, name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.contactId) query = query.eq('contact_id', filters.contactId)
    if (filters?.companyId) query = query.eq('company_id', filters.companyId)
    if (filters?.dealId) query = query.eq('deal_id', filters.dealId)
    if (filters?.onlyPending) query = query.eq('is_completed', false)

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('getActivities error:', error.message)
      return { data: [], error: error.message }
    }
    return { data: data || [], error: null }
  } catch (err) {
    console.error('getActivities error:', err)
    return { data: [], error: String(err) }
  }
}

// Crear actividad/tarea
export async function createActivity(workspaceId: string, input: ActivityInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      workspace_id: workspaceId,
      ...input,
      created_by_id: user!.id,
      assigned_to_id: input.assigned_to_id || user!.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Actualizar actividad
export async function updateActivity(id: string, input: Partial<ActivityInput>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Marcar como completada / pendiente
export async function toggleActivityComplete(id: string) {
  const supabase = await createClient()

  // Obtener estado actual
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
