'use server'

import { createClient } from '@/lib/supabase/server'

export interface CompanyInput {
  name: string
  website?: string
  industry?: string
  company_size?: string
  annual_revenue?: number
  vat_number?: string
  billing_address?: Record<string, any>
  linkedin_url?: string
  owner_id?: string
  health_score?: number
  custom_fields?: Record<string, any>
}

// Listar empresas del workspace (con conteo de contactos)
export async function getCompanies(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*, contacts(count)')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Obtener una empresa con sus contactos
export async function getCompany(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*, contacts(id, first_name, last_name, email, job_title, lifecycle_stage)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Crear empresa
export async function createCompany(workspaceId: string, input: CompanyInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('companies')
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

// Actualizar empresa
export async function updateCompany(id: string, input: Partial<CompanyInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('companies')
    .update({ ...input, updated_by_id: user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Eliminar empresa (soft delete)
export async function deleteCompany(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}
