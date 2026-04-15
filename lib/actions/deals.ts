'use server'

import { createClient } from '@/lib/supabase/server'
// Webhooks are now triggered via Supabase database triggers (see migrations/008_webhook_triggers.sql)

export interface DealInput {
  name: string
  description?: string
  pipeline_id: string
  stage_id: string
  value?: number
  currency?: string
  expected_close_date?: string
  company_id?: string | null
  owner_id?: string
  status?: string
  next_step?: string
  competitors?: string[]
  custom_fields?: Record<string, any>
}

// Listar deals del workspace con relaciones
export async function getDeals(workspaceId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        companies(id, name),
        stages(id, name, probability, position, is_closed_won, is_closed_lost),
        deal_contacts(contact_id, role, is_primary, contacts(id, first_name, last_name, email))
      `)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getDeals error:', error.message)
      return { data: [], error: error.message }
    }
    return { data: data || [], error: null }
  } catch (err) {
    console.error('getDeals error:', err)
    return { data: [], error: String(err) }
  }
}

// Obtener un deal con todas sus relaciones
export async function getDeal(id: string, workspaceId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('deals')
    .select(`
      *,
      companies(id, name, industry),
      stages(id, name, probability, is_closed_won, is_closed_lost),
      pipelines(id, name),
      deal_contacts(contact_id, role, is_primary, contacts(id, first_name, last_name, email, phone, job_title))
    `)
    .eq('id', id)
    .is('deleted_at', null)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query.single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Crear deal
export async function createDeal(workspaceId: string, input: DealInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check plan limit
  const { data: limitCheck } = await supabase.rpc('check_plan_limit', {
    p_workspace_id: workspaceId,
    p_resource: 'deals',
  })
  if (limitCheck && !limitCheck.allowed) {
    return { data: null, error: `Has alcanzado el limite de ${limitCheck.max} oportunidades en tu plan. Mejora tu plan para continuar.` }
  }

  const { data, error } = await supabase
    .from('deals')
    .insert({
      workspace_id: workspaceId,
      ...input,
      currency: input.currency || 'EUR',
      status: input.status || 'open',
      created_by_id: user?.id,
      owner_id: input.owner_id || user?.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// Actualizar deal
export async function updateDeal(id: string, input: Partial<DealInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('deals')
    .update({ ...input, updated_by_id: user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// Mover deal a otra etapa
export async function updateDealStage(id: string, stageId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deals')
    .update({ stage_id: stageId })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// Eliminar deal (soft delete)
export async function deleteDeal(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

// Añadir contacto a un deal
export async function addContactToDeal(dealId: string, contactId: string, role?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deal_contacts')
    .insert({ deal_id: dealId, contact_id: contactId, role })

  if (error) return { error: error.message }
  return { error: null }
}

// Quitar contacto de un deal
export async function removeContactFromDeal(dealId: string, contactId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deal_contacts')
    .delete()
    .eq('deal_id', dealId)
    .eq('contact_id', contactId)

  if (error) return { error: error.message }
  return { error: null }
}
