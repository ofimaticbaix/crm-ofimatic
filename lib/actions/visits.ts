'use server'

import { createClient } from '@/lib/supabase/server'

export interface VisitInput {
  company_id: string
  contact_id?: string | null
  deal_id?: string | null
  visit_type?: 'presencial' | 'videollamada' | 'llamada'
  purpose?: string
  notes?: string
  check_in_latitude?: number
  check_in_longitude?: number
  check_in_address?: string
}

export interface CheckOutInput {
  notes?: string
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_show'
  next_steps?: string
  check_out_latitude?: number
  check_out_longitude?: number
}

// Get all visits for workspace
export async function getVisits(workspaceId: string, options?: {
  companyId?: string
  userId?: string
  fromDate?: string
  toDate?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('visits')
    .select('*, companies(id, name), contacts(id, first_name, last_name), users(id, full_name)')
    .eq('workspace_id', workspaceId)
    .order('check_in_at', { ascending: false })

  if (options?.companyId) {
    query = query.eq('company_id', options.companyId)
  }
  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }
  if (options?.fromDate) {
    query = query.gte('check_in_at', options.fromDate)
  }
  if (options?.toDate) {
    query = query.lte('check_in_at', options.toDate)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Get active visit (checked in but not checked out)
export async function getActiveVisit(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('visits')
    .select('*, companies(id, name)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .is('check_out_at', null)
    .order('check_in_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Check-in: Start a visit
export async function checkIn(workspaceId: string, input: VisitInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: `Error de autenticación: ${authError?.message || 'No autenticado'}` }
  }

  // Check if there's already an active visit
  const { data: activeVisit } = await getActiveVisit(workspaceId)
  if (activeVisit) {
    return { data: null, error: 'Ya tienes una visita activa. Haz check-out primero.' }
  }

  const { data, error } = await supabase
    .from('visits')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      company_id: input.company_id,
      contact_id: input.contact_id || null,
      deal_id: input.deal_id || null,
      visit_type: input.visit_type || 'presencial',
      purpose: input.purpose || null,
      notes: input.notes || null,
      check_in_latitude: input.check_in_latitude || null,
      check_in_longitude: input.check_in_longitude || null,
      check_in_address: input.check_in_address || null,
    })
    .select('*, companies(id, name)')
    .single()

  if (error) {
    console.error('checkIn error:', error)
    return { data: null, error: `Error haciendo check-in: ${error.message}` }
  }

  return { data, error: null }
}

// Check-out: End a visit
export async function checkOut(visitId: string, input: CheckOutInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('visits')
    .update({
      check_out_at: new Date().toISOString(),
      check_out_latitude: input.check_out_latitude || null,
      check_out_longitude: input.check_out_longitude || null,
      notes: input.notes || null,
      outcome: input.outcome || null,
      next_steps: input.next_steps || null,
    })
    .eq('id', visitId)
    .eq('user_id', user.id) // Security: only own visits
    .select('*, companies(id, name)')
    .single()

  if (error) {
    console.error('checkOut error:', error)
    return { data: null, error: `Error haciendo check-out: ${error.message}` }
  }

  return { data, error: null }
}

// Update visit notes or details
export async function updateVisit(visitId: string, input: Partial<VisitInput & CheckOutInput>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visits')
    .update(input)
    .eq('id', visitId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Delete visit
export async function deleteVisit(visitId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', visitId)

  if (error) return { error: error.message }
  return { error: null }
}

// Get visit statistics for a workspace
export async function getVisitStats(workspaceId: string, options?: {
  userId?: string
  fromDate?: string
  toDate?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('visits')
    .select('id, visit_type, outcome, duration_minutes, check_in_at')
    .eq('workspace_id', workspaceId)

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }
  if (options?.fromDate) {
    query = query.gte('check_in_at', options.fromDate)
  }
  if (options?.toDate) {
    query = query.lte('check_in_at', options.toDate)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  // Calculate stats
  const stats = {
    total: data?.length || 0,
    byType: {
      presencial: data?.filter(v => v.visit_type === 'presencial').length || 0,
      videollamada: data?.filter(v => v.visit_type === 'videollamada').length || 0,
      llamada: data?.filter(v => v.visit_type === 'llamada').length || 0,
    },
    byOutcome: {
      positive: data?.filter(v => v.outcome === 'positive').length || 0,
      neutral: data?.filter(v => v.outcome === 'neutral').length || 0,
      negative: data?.filter(v => v.outcome === 'negative').length || 0,
      no_show: data?.filter(v => v.outcome === 'no_show').length || 0,
    },
    avgDurationMinutes: data?.filter(v => v.duration_minutes).reduce((sum, v) => sum + (v.duration_minutes || 0), 0) / (data?.filter(v => v.duration_minutes).length || 1),
  }

  return { data: stats, error: null }
}
