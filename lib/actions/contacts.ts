'use server'

import { createClient } from '@/lib/supabase/server'
import { triggerWebhooks } from './webhooks'

export interface ContactInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  department?: string
  company_id?: string | null
  linkedin_url?: string
  twitter_handle?: string
  website?: string
  lifecycle_stage?: string
  lead_source?: string
  language?: string
  owner_id?: string
  consent_marketing?: boolean
  consent_communications?: boolean
  // New fields
  birthday?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  is_decision_maker?: boolean
  notes?: string
  custom_fields?: Record<string, any>
}

// Listar contactos del workspace (con empresa)
export async function getContacts(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*, companies(id, name)')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Obtener un contacto por ID
export async function getContact(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*, companies(id, name, industry)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Crear contacto
export async function createContact(workspaceId: string, input: ContactInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: `Error de autenticacion: ${authError?.message || 'No autenticado'}` }
  }

  if (!workspaceId) {
    return { data: null, error: 'No se encontro el workspace. Recarga la pagina.' }
  }

  // Check plan limit
  const { data: limitCheck, error: rpcError } = await supabase.rpc('check_plan_limit', {
    p_workspace_id: workspaceId,
    p_resource: 'contacts',
  })

  if (rpcError) {
    console.error('check_plan_limit error:', rpcError)
  }

  if (limitCheck && !limitCheck.allowed) {
    return { data: null, error: `Has alcanzado el limite de ${limitCheck.max} contactos en tu plan. Mejora tu plan para continuar.` }
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      workspace_id: workspaceId,
      ...input,
      created_by_id: user.id,
      owner_id: input.owner_id || user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('createContact insert error:', error)
    return { data: null, error: `Error creando contacto: ${error.message} (code: ${error.code})` }
  }

  // Trigger webhooks
  if (data) {
    triggerWebhooks(workspaceId, 'contact.created', {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      company_id: data.company_id,
      lifecycle_stage: data.lifecycle_stage,
    })
  }

  return { data, error: null }
}

// Actualizar contacto
export async function updateContact(id: string, input: Partial<ContactInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('contacts')
    .update({ ...input, updated_by_id: user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Trigger webhooks
  if (data) {
    triggerWebhooks(data.workspace_id, 'contact.updated', {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      changes: Object.keys(input),
    })
  }

  return { data, error: null }
}

// Eliminar contacto (soft delete)
export async function deleteContact(id: string) {
  const supabase = await createClient()

  // Get contact first for webhook
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, workspace_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  // Trigger webhooks
  if (contact) {
    triggerWebhooks(contact.workspace_id, 'contact.deleted', {
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
    })
  }

  return { error: null }
}

// Búsqueda full-text
export async function searchContacts(workspaceId: string, query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*, companies(id, name)')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .textSearch('search_vector', query, { type: 'websearch' })
    .limit(20)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
