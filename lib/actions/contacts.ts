'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  company_id?: string | null
  lifecycle_stage?: string
  lead_source?: string
  owner_id?: string
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
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      workspace_id: workspaceId,
      ...input,
      created_by_id: user?.id,
      owner_id: input.owner_id || user?.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
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
  return { data, error: null }
}

// Eliminar contacto (soft delete)
export async function deleteContact(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
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
