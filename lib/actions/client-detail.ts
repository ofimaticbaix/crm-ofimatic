'use server'

import { createClient } from '@/lib/supabase/server'

// Tipo completo del cliente (empresa + contactos + deals + actividades)
export interface ClientDetail {
  id: string
  name: string
  vat_number: string | null
  website: string | null
  industry: string | null
  company_size: string | null
  annual_revenue: number | null
  phone: string | null
  email: string | null
  description: string | null
  linkedin_url: string | null
  health_score: number | null
  account_type: string | null
  account_status: string | null
  founded_year: number | null
  employees_exact: number | null
  billing_address: {
    street?: string
    city?: string
    postal_code?: string
    state?: string
    country?: string
  } | null
  shipping_address: {
    street?: string
    city?: string
    postal_code?: string
    state?: string
    country?: string
  } | null
  custom_fields: Record<string, string> | null
  created_at: string
  updated_at: string
  owner_id: string | null
  // Relaciones
  contacts: ClientContact[]
  deals: ClientDeal[]
  recent_activities: ClientActivity[]
}

export interface ClientContact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  job_title: string | null
  department: string | null
  lifecycle_stage: string | null
  is_decision_maker: boolean
  notes: string | null
}

export interface ClientDeal {
  id: string
  name: string
  value: number | null
  status: string
  stage_name: string | null
  expected_close_date: string | null
  created_at: string
}

export interface ClientActivity {
  id: string
  type: string
  subject: string | null
  notes: string | null
  is_completed: boolean
  completed_at: string | null
  scheduled_at: string | null
  due_date: string | null
  created_at: string
  contact_name: string | null
}

// Obtener detalle completo de un cliente
export async function getClientDetail(clientId: string): Promise<{ data: ClientDetail | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Query 1: Empresa con contactos
    const { data: company, error: compError } = await supabase
      .from('companies')
      .select(`
        *,
        contacts(
          id, first_name, last_name, email, phone, mobile,
          job_title, department, lifecycle_stage, is_decision_maker, notes
        )
      `)
      .eq('id', clientId)
      .is('deleted_at', null)
      .single()

    if (compError || !company) {
      return { data: null, error: compError?.message || 'Cliente no encontrado' }
    }

    // Query 2: Deals de la empresa
    const { data: deals } = await supabase
      .from('deals')
      .select('id, name, value, status, expected_close_date, created_at, stage_id, stages(name)')
      .eq('company_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    // Query 3: Actividades recientes (directas + via contactos)
    const contactIds = (company.contacts as any[])?.map((c: any) => c.id) || []

    const { data: directActivities } = await supabase
      .from('activities')
      .select('id, type, subject, notes, is_completed, completed_at, scheduled_at, due_date, created_at, contact_id')
      .eq('company_id', clientId)
      .order('created_at', { ascending: false })
      .limit(15)

    let contactActivities: any[] = []
    if (contactIds.length > 0) {
      const { data: cActs } = await supabase
        .from('activities')
        .select('id, type, subject, notes, is_completed, completed_at, scheduled_at, due_date, created_at, contact_id')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false })
        .limit(15)
      if (cActs) contactActivities = cActs
    }

    // Merge y dedup actividades
    const allActivities = [...(directActivities || []), ...contactActivities]
    const uniqueActivities = Array.from(new Map(allActivities.map(a => [a.id, a])).values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)

    // Map contactId a nombre
    const contactMap = new Map<string, string>()
    for (const c of (company.contacts as any[]) || []) {
      contactMap.set(c.id, `${c.first_name || ''} ${c.last_name || ''}`.trim())
    }

    const clientDetail: ClientDetail = {
      id: company.id,
      name: company.name,
      vat_number: company.vat_number,
      website: company.website,
      industry: company.industry,
      company_size: company.company_size,
      annual_revenue: company.annual_revenue,
      phone: company.phone,
      email: company.email,
      description: company.description,
      linkedin_url: company.linkedin_url,
      health_score: company.health_score,
      account_type: company.account_type,
      account_status: company.account_status,
      founded_year: company.founded_year,
      employees_exact: company.employees_exact,
      billing_address: company.billing_address || null,
      shipping_address: company.shipping_address || null,
      custom_fields: company.custom_fields || null,
      created_at: company.created_at,
      updated_at: company.updated_at,
      owner_id: company.owner_id,
      contacts: ((company.contacts as any[]) || []).map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        job_title: c.job_title,
        department: c.department,
        lifecycle_stage: c.lifecycle_stage,
        is_decision_maker: c.is_decision_maker || false,
        notes: c.notes,
      })),
      deals: (deals || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        value: d.value,
        status: d.status,
        stage_name: d.stages?.name || null,
        expected_close_date: d.expected_close_date,
        created_at: d.created_at,
      })),
      recent_activities: uniqueActivities.map((a: any) => ({
        id: a.id,
        type: a.type,
        subject: a.subject,
        notes: a.notes,
        is_completed: a.is_completed,
        completed_at: a.completed_at,
        scheduled_at: a.scheduled_at,
        due_date: a.due_date,
        created_at: a.created_at,
        contact_name: a.contact_id ? (contactMap.get(a.contact_id) || null) : null,
      })),
    }

    return { data: clientDetail, error: null }
  } catch (err) {
    console.error('getClientDetail error:', err)
    return { data: null, error: String(err) }
  }
}

// Listar todos los clientes (empresas) con info resumida para la lista
export interface ClientListItem {
  id: string
  name: string
  vat_number: string | null
  phone: string | null
  email: string | null
  industry: string | null
  account_type: string | null
  account_status: string | null
  city: string | null
  contact_count: number
  created_at: string
  custom_fields: Record<string, string> | null
}

export async function getClientsList(workspaceId: string): Promise<{ data: ClientListItem[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, vat_number, phone, email, industry, account_type, account_status, billing_address, created_at, custom_fields, contacts(count)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) return { data: null, error: error.message }

    const clients: ClientListItem[] = (companies || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      vat_number: c.vat_number,
      phone: c.phone,
      email: c.email,
      industry: c.industry,
      account_type: c.account_type,
      account_status: c.account_status,
      city: c.billing_address?.city || null,
      contact_count: c.contacts?.[0]?.count || 0,
      created_at: c.created_at,
      custom_fields: c.custom_fields,
    }))

    return { data: clients, error: null }
  } catch (err) {
    console.error('getClientsList error:', err)
    return { data: null, error: String(err) }
  }
}
