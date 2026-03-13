'use server'

import { createClient } from '@/lib/supabase/server'
import { geocodeCompany } from './geocoding'

export interface CompanyInput {
  name: string
  website?: string
  industry?: string
  company_size?: string
  annual_revenue?: number
  vat_number?: string
  billing_address?: Record<string, any>
  shipping_address?: Record<string, any>
  linkedin_url?: string
  owner_id?: string
  health_score?: number
  custom_fields?: Record<string, any>
  // New fields
  account_type?: 'customer' | 'prospect' | 'lead' | 'partner' | 'supplier'
  account_status?: 'active' | 'inactive' | 'negotiating' | 'churned'
  description?: string
  founded_year?: number
  employees_exact?: number
  phone?: string
  email?: string
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
    p_resource: 'companies',
  })

  if (rpcError) {
    console.error('check_plan_limit error:', rpcError)
    // Continue anyway - don't block creation if limit check fails
  }

  if (limitCheck && !limitCheck.allowed) {
    return { data: null, error: `Has alcanzado el limite de ${limitCheck.max} empresas en tu plan. Mejora tu plan para continuar.` }
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      workspace_id: workspaceId,
      ...input,
      created_by_id: user.id,
      owner_id: input.owner_id || user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('createCompany insert error:', error)
    return { data: null, error: `Error creando empresa: ${error.message} (code: ${error.code})` }
  }

  // Geocode company address asynchronously (fire and forget)
  if (data && input.billing_address) {
    geocodeCompany(data.id).catch(console.error)
  }

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

  // Re-geocode if address was updated
  if (data && input.billing_address) {
    geocodeCompany(id).catch(console.error)
  }

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
