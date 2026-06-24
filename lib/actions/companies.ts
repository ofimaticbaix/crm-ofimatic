'use server'

import { createClient } from '@/lib/supabase/server'
import { geocodeCompany } from './geocoding'
// Webhooks are now triggered via Supabase database triggers (see migrations/008_webhook_triggers.sql)

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

// Listar empresas del workspace (con conteo de contactos).
// PostgREST trunca las queries a 1000 filas por defecto, así que paginamos en lotes
// hasta que un lote venga vacío. Esto garantiza que se cargan TODAS las empresas.
export async function getCompanies(workspaceId: string, accountType?: string) {
  const supabase = await createClient()
  const PAGE_SIZE = 1000
  const MAX_PAGES = 10 // cortafuegos: hasta 10.000 empresas
  const all: any[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    let q = supabase
      .from('companies')
      .select('*, contacts(count)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (accountType) q = q.eq('account_type', accountType)

    const { data, error } = await q
    if (error) return { data: null, error: error.message }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return { data: all, error: null }
}

// Obtener una empresa con sus contactos.
// `workspaceId` es opcional pero recomendado: defense-in-depth en caso de que RLS falle.
export async function getCompany(id: string, workspaceId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('companies')
    .select('*, contacts(id, first_name, last_name, email, job_title, lifecycle_stage)')
    .eq('id', id)
    .is('deleted_at', null)

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query.single()

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

  // Duplicate prevention: refuse to create if another active company in the same workspace
  // already has the same normalized name or VAT. Non-destructive — returns legible error.
  const normalizedName = (input.name || '').trim().toLowerCase()
  if (normalizedName) {
    const { data: existingByName } = await supabase
      .from('companies')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .ilike('name', input.name.trim())
      .limit(1)
      .maybeSingle()
    if (existingByName) {
      return { data: null, error: `Ya existe una empresa con el nombre "${existingByName.name}". Abre esa ficha en lugar de crear un duplicado.` }
    }
  }
  if (input.vat_number && input.vat_number.trim()) {
    const { data: existingByVat } = await supabase
      .from('companies')
      .select('id, name, vat_number')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .eq('vat_number', input.vat_number.trim())
      .limit(1)
      .maybeSingle()
    if (existingByVat) {
      return { data: null, error: `El CIF/NIF ${input.vat_number} ya pertenece a "${existingByVat.name}". No se puede duplicar.` }
    }
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
