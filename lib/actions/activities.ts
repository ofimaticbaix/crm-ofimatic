'use server'

import { createClient } from '@/lib/supabase/server'
// Webhooks are now triggered via Supabase database triggers (see migrations/008_webhook_triggers.sql)

export interface ActivityInput {
  type: 'call' | 'meeting' | 'email' | 'note' | 'task' | 'presupuesto'
  subject?: string
  description?: string
  outcome?: string
  scheduled_at?: string
  due_date?: string
  completed_at?: string
  is_completed?: boolean
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
      .select('*, contacts(id, first_name, last_name), companies(id, name, billing_address), deals(id, name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.contactId) query = query.eq('contact_id', filters.contactId)
    if (filters?.companyId) query = query.eq('company_id', filters.companyId)
    if (filters?.dealId) query = query.eq('deal_id', filters.dealId)
    if (filters?.onlyPending) query = query.eq('is_completed', false)

    // .range para evitar el truncado a 1000 filas de PostgREST. El Historial de
    // Tareas necesita el dataset completo para que el "Top empresas" sea correcto.
    const { data, error } = await query.range(0, 4999)

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

// Registrar un contacto inmediato con un cliente (crea una activity ya completada)
// — la forma rápida de decir "acabo de hablar con este cliente".
export async function logContact(
  workspaceId: string,
  input: {
    type: 'call' | 'meeting' | 'email' | 'note' | 'presupuesto'
    company_id?: string | null
    contact_id?: string | null
    deal_id?: string | null
    subject?: string
    description?: string
    metadata?: Record<string, any>
    // Optional: pass when registering a contact that happened in the past
    completed_at?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const now = input.completed_at || new Date().toISOString()

  const subjectDefaults: Record<string, string> = {
    call: 'Llamada',
    meeting: 'Reunión',
    email: 'Email',
    note: 'Nota',
    presupuesto: 'Presupuesto enviado',
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      workspace_id: workspaceId,
      type: input.type,
      subject: input.subject || subjectDefaults[input.type],
      description: input.description || null,
      company_id: input.company_id || null,
      contact_id: input.contact_id || null,
      deal_id: input.deal_id || null,
      is_completed: true,
      completed_at: now,
      created_by_id: user!.id,
      assigned_to_id: user!.id,
      metadata: input.metadata || {},
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
