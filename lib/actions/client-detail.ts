'use server'

import { createClient } from '@/lib/supabase/server'
// import { createAdminClient } from '@/lib/supabase/admin'

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

// Restaurar contactos soft-deleted y vincularlos a empresas
export async function recreateContactsFromCompanies(workspaceId: string): Promise<{ created: number; deleted: number; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { created: 0, deleted: 0, error: 'No autenticado' }

    // 1. Restore soft-deleted contacts
    const { error: restoreErr } = await supabase
      .from('contacts')
      .update({ deleted_at: null })
      .eq('workspace_id', workspaceId)
      .not('deleted_at', 'is', null)

    // 2. Count ALL contacts now (active + just restored)
    const { data: contacts, error: cErr } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, company_id')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    if (cErr) return { created: 0, deleted: 0, error: `Error contactos: ${cErr.message}` }

    // 3. Get companies - check what workspace they use
    const { data: companiesCheck } = await supabase
      .from('companies')
      .select('id, workspace_id')
      .is('deleted_at', null)
      .limit(3)

    // Debug: find the actual workspace_id companies use
    const companyWsIds = [...new Set((companiesCheck || []).map((c: any) => c.workspace_id))]

    // Get companies using their actual workspace_id
    let companyWsId = workspaceId
    if (companyWsIds.length > 0 && !companyWsIds.includes(workspaceId)) {
      companyWsId = companyWsIds[0]
    }

    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('id, name, email, phone, custom_fields')
      .eq('workspace_id', companyWsId)
      .is('deleted_at', null)

    if (compErr) return { created: 0, deleted: 0, error: `Error empresas: ${compErr.message}` }

    const contactCount = contacts?.length || 0
    const companyCount = companies?.length || 0

    if (contactCount === 0 && companyCount === 0) {
      return { created: 0, deleted: 0, error: `wsId contactos: ${workspaceId?.slice(0,8)}, wsId empresas: ${companyWsIds.join(',').slice(0,20)}, restoreErr: ${restoreErr?.message || 'ok'}. 0 contactos y 0 empresas.` }
    }
    if (contactCount === 0) {
      return { created: 0, deleted: 0, error: `0 contactos (wsId: ${workspaceId?.slice(0,8)}), ${companyCount} empresas (wsId: ${companyWsId?.slice(0,8)}). Restaurar falló: ${restoreErr?.message || 'no error pero 0 resultados'}` }
    }
    if (companyCount === 0) {
      return { created: 0, deleted: 0, error: `${contactCount} contactos OK, 0 empresas. wsId contactos: ${workspaceId?.slice(0,8)}, wsIds empresas encontrados: ${companyWsIds.join(', ') || 'ninguno'}` }
    }

    // 4. Build lookup maps
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

    const contactoToCompany = new Map<string, any>()
    const emailToCompany = new Map<string, any>()
    const phoneToCompany = new Map<string, any>()

    for (const comp of companies) {
      const cf = comp.custom_fields as Record<string, string> | null
      if (cf?.contacto) contactoToCompany.set(normalize(cf.contacto), comp)
      if (comp.email) emailToCompany.set(comp.email.toLowerCase().trim(), comp)
      if (cf?.email_2) emailToCompany.set(cf.email_2.toLowerCase().trim(), comp)
      if (comp.phone) {
        const cp = comp.phone.replace(/[\s\-\(\)\+\.]/g, '')
        if (cp.length >= 6) phoneToCompany.set(cp, comp)
      }
      if (cf?.telefono_2) {
        const cp = cf.telefono_2.replace(/[\s\-\(\)\+\.]/g, '')
        if (cp.length >= 6) phoneToCompany.set(cp, comp)
      }
    }

    // 5. Link contacts
    let linked = 0
    const debugInfo: string[] = []

    for (const contact of contacts!) {
      if (contact.company_id) continue

      const fullName = normalize(`${contact.first_name || ''} ${contact.last_name || ''}`)
      let matchedCompany: any = null

      if (fullName && contactoToCompany.has(fullName)) matchedCompany = contactoToCompany.get(fullName)
      if (!matchedCompany && contact.first_name) {
        const fn = normalize(contact.first_name)
        if (contactoToCompany.has(fn)) matchedCompany = contactoToCompany.get(fn)
      }
      if (!matchedCompany && contact.email) {
        const em = contact.email.toLowerCase().trim()
        if (emailToCompany.has(em)) matchedCompany = emailToCompany.get(em)
      }
      if (!matchedCompany && contact.email) {
        const domain = contact.email.toLowerCase().trim().split('@')[1]
        if (domain && !['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'].includes(domain)) {
          for (const comp of companies) {
            if (comp.email?.toLowerCase().trim().split('@')[1] === domain) { matchedCompany = comp; break }
          }
        }
      }
      if (!matchedCompany && contact.phone) {
        const cp = contact.phone.replace(/[\s\-\(\)\+\.]/g, '')
        if (cp.length >= 6 && phoneToCompany.has(cp)) matchedCompany = phoneToCompany.get(cp)
      }
      if (!matchedCompany && fullName && fullName.length > 3) {
        for (const [cn, comp] of contactoToCompany) {
          if (cn.includes(fullName) || fullName.includes(cn)) { matchedCompany = comp; break }
        }
      }

      if (matchedCompany) {
        const { error } = await supabase
          .from('contacts')
          .update({ company_id: matchedCompany.id, updated_by_id: user.id })
          .eq('id', contact.id)
        if (!error) linked++
        else if (debugInfo.length < 3) debugInfo.push(`update err: ${error.message}`)
      } else if (debugInfo.length < 5) {
        debugInfo.push(`no match: ${contact.first_name} ${contact.last_name}`)
      }
    }

    const alreadyLinked = contacts!.filter((c: any) => c.company_id).length

    return {
      created: linked,
      deleted: alreadyLinked,
      error: linked === 0 && alreadyLinked === 0
        ? `${contactCount} contactos, ${companyCount} empresas, maps: contacto=${contactoToCompany.size}, email=${emailToCompany.size}, phone=${phoneToCompany.size}. ${debugInfo.join('; ')}`
        : null
    }
  } catch (err) {
    console.error('recreateContactsFromCompanies error:', err)
    return { created: 0, deleted: 0, error: String(err) }
  }
}

// Obtener contactos del workspace para selector (sin empresa o de otra empresa)
export async function getWorkspaceContactsForLinking(workspaceId: string, companyId: string): Promise<{ data: { id: string; name: string; email: string | null }[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, company_id')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('first_name', { ascending: true })

    if (error) return { data: null, error: error.message }

    // Filter: contacts not already linked to this company
    const available = (data || [])
      .filter((c: any) => c.company_id !== companyId)
      .map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Sin nombre',
        email: c.email,
      }))

    return { data: available, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Vincular un contacto existente a una empresa
export async function linkContactToCompany(contactId: string, companyId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
      .from('contacts')
      .update({ company_id: companyId, updated_by_id: user.id })
      .eq('id', contactId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: String(err) }
  }
}

// Desvincular un contacto de una empresa
export async function unlinkContactFromCompany(contactId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
      .from('contacts')
      .update({ company_id: null, updated_by_id: user.id })
      .eq('id', contactId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: String(err) }
  }
}

// Vincular contactos a empresas del workspace
// Detecta contactos sin empresa valida (null, vacio, o FK rota) y los vincula por email/telefono/nombre
export async function autoLinkContactsToCompanies(workspaceId: string): Promise<{ linked: number; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { linked: 0, error: 'No autenticado' }

    // Get ALL contacts WITH company join to detect broken FK references too
    const { data: allContacts, error: cErr } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, company_id, companies(id)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    if (cErr) return { linked: 0, error: `Error contactos: ${cErr.message}` }
    if (!allContacts || allContacts.length === 0) return { linked: 0, error: `No hay contactos en el workspace (wsId: ${workspaceId?.slice(0,8)}...)` }

    // Get all companies
    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('id, name, email, phone, custom_fields')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    if (compErr) return { linked: 0, error: `Error empresas: ${compErr.message}` }
    if (!companies || companies.length === 0) return { linked: 0, error: `Hay ${allContacts.length} contactos pero 0 empresas en el workspace` }

    // Contacts that need linking: no company_id, empty, or broken FK
    const validCompanyIds = new Set(companies.map(c => c.id))
    const needsLinking = allContacts.filter((c: any) => {
      // No company_id at all
      if (!c.company_id) return true
      if (c.company_id === '') return true
      // Has company_id but it's not a valid company in this workspace
      if (!validCompanyIds.has(c.company_id)) return true
      return false
    })

    if (needsLinking.length === 0) {
      return { linked: 0, error: `${allContacts.length} contactos ya vinculados a ${companies.length} empresas. Ejemplo company_id: ${allContacts[0]?.company_id || 'null'}` }
    }

    let linked = 0

    // If only 1 company, assign ALL to it
    if (companies.length === 1) {
      for (const contact of needsLinking) {
        const { error } = await supabase
          .from('contacts')
          .update({ company_id: companies[0].id, updated_by_id: user.id })
          .eq('id', contact.id)
        if (!error) linked++
      }
      return { linked, error: null }
    }

    // Build lookup maps
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const cleanPhoneFn = (p: string) => p.replace(/[\s\-\(\)\+\.]/g, '')

    const contactoNameToCompany = new Map<string, string>()
    const emailToCompany = new Map<string, string>()
    const phoneToCompany = new Map<string, string>()
    const domainToCompany = new Map<string, string>()

    for (const company of companies) {
      const cf = company.custom_fields as Record<string, string> | null
      if (cf?.contacto) contactoNameToCompany.set(normalize(cf.contacto), company.id)
      if (company.email) {
        const em = company.email.toLowerCase().trim()
        emailToCompany.set(em, company.id)
        const domain = em.split('@')[1]
        if (domain && !['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'].includes(domain))
          domainToCompany.set(domain, company.id)
      }
      if (cf?.email_2) {
        const em2 = cf.email_2.toLowerCase().trim()
        emailToCompany.set(em2, company.id)
        const d2 = em2.split('@')[1]
        if (d2 && !['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'].includes(d2))
          domainToCompany.set(d2, company.id)
      }
      if (company.phone) { const cp = cleanPhoneFn(company.phone); if (cp.length >= 6) phoneToCompany.set(cp, company.id) }
      if (cf?.telefono_2) { const cp = cleanPhoneFn(cf.telefono_2); if (cp.length >= 6) phoneToCompany.set(cp, company.id) }
    }

    for (const contact of needsLinking) {
      let matchedId: string | null = null
      const fullName = normalize(`${contact.first_name || ''} ${contact.last_name || ''}`)

      // 1. Name match vs custom_fields.contacto
      if (fullName && contactoNameToCompany.has(fullName)) matchedId = contactoNameToCompany.get(fullName)!
      // 2. first_name only
      if (!matchedId && contact.first_name) {
        const fn = normalize(contact.first_name)
        if (fn && contactoNameToCompany.has(fn)) matchedId = contactoNameToCompany.get(fn)!
      }
      // 3. Exact email
      if (!matchedId && contact.email) {
        const em = contact.email.toLowerCase().trim()
        if (emailToCompany.has(em)) matchedId = emailToCompany.get(em)!
      }
      // 4. Email domain
      if (!matchedId && contact.email) {
        const domain = contact.email.toLowerCase().trim().split('@')[1]
        if (domain && domainToCompany.has(domain)) matchedId = domainToCompany.get(domain)!
      }
      // 5. Phone
      if (!matchedId && contact.phone) {
        const cp = cleanPhoneFn(contact.phone)
        if (cp.length >= 6 && phoneToCompany.has(cp)) matchedId = phoneToCompany.get(cp)!
      }
      // 6. Partial name
      if (!matchedId && fullName && fullName.length > 3) {
        for (const [cn, cid] of contactoNameToCompany) {
          if (cn.includes(fullName) || fullName.includes(cn)) { matchedId = cid; break }
        }
      }

      if (matchedId) {
        const { error } = await supabase
          .from('contacts')
          .update({ company_id: matchedId, updated_by_id: user.id })
          .eq('id', contact.id)
        if (!error) linked++
      }
    }

    if (linked === 0) {
      return { linked: 0, error: `${needsLinking.length} contactos sin empresa pero no se encontraron coincidencias. Empresas: ${companies.length}, Maps: contacto=${contactoNameToCompany.size}, email=${emailToCompany.size}, domain=${domainToCompany.size}, phone=${phoneToCompany.size}` }
    }

    return { linked, error: null }
  } catch (err) {
    console.error('autoLinkContactsToCompanies error:', err)
    return { linked: 0, error: String(err) }
  }
}
