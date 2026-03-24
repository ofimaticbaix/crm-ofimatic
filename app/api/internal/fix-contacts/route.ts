import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return NextResponse.json({ error: 'No service role key configured' })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // Step 0: Check for soft-deleted companies and restore them
  const { data: deletedCompanies } = await admin
    .from('companies')
    .select('id, name, deleted_at')
    .not('deleted_at', 'is', null)

  let companiesRestored = 0
  if (deletedCompanies && deletedCompanies.length > 0) {
    const { data: restoredComps } = await admin
      .from('companies')
      .update({ deleted_at: null })
      .not('deleted_at', 'is', null)
      .select('id')
    companiesRestored = restoredComps?.length || 0
  }

  // Step 1: Restore soft-deleted contacts too
  const { data: restoredContacts } = await admin
    .from('contacts')
    .update({ deleted_at: null })
    .not('deleted_at', 'is', null)
    .select('id')

  // Step 2: Get ALL companies (including just restored)
  const { data: companies, error: compErr } = await admin
    .from('companies')
    .select('id, name, email, phone, custom_fields, workspace_id')
    .is('deleted_at', null)

  if (compErr) return NextResponse.json({ error: `companies: ${compErr.message}` })

  // Step 3: Get ALL contacts
  const { data: contacts, error: cErr } = await admin
    .from('contacts')
    .select('id, first_name, last_name, email, phone, company_id, workspace_id')
    .is('deleted_at', null)

  if (cErr) return NextResponse.json({ error: `contacts: ${cErr.message}` })

  const diag = {
    deletedCompaniesFound: deletedCompanies?.length || 0,
    companiesRestored,
    contactsRestored: restoredContacts?.length || 0,
    totalContacts: contacts?.length || 0,
    totalCompanies: companies?.length || 0,
    contactWorkspaces: [...new Set((contacts || []).map(c => c.workspace_id))],
    companyWorkspaces: [...new Set((companies || []).map(c => c.workspace_id))],
    contactsWithCompany: (contacts || []).filter(c => c.company_id).length,
    contactsWithoutCompany: (contacts || []).filter(c => !c.company_id).length,
    sampleCompanies: (companies || []).slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      contacto: (c.custom_fields as any)?.contacto || null,
      workspace_id: c.workspace_id,
    })),
  }

  if (!contacts?.length || !companies?.length) {
    return NextResponse.json({ diag, linked: 0, message: 'No enough data' })
  }

  // Step 4: Fix workspace_id mismatch - move contacts to same workspace as companies
  const companyWs = companies[0]?.workspace_id
  const contactsInWrongWs = contacts.filter(c => c.workspace_id !== companyWs)
  let wsMigrated = 0
  if (contactsInWrongWs.length > 0 && companyWs) {
    for (const c of contactsInWrongWs) {
      const { error } = await admin
        .from('contacts')
        .update({ workspace_id: companyWs })
        .eq('id', c.id)
      if (!error) wsMigrated++
    }
  }

  // Step 5: Build lookup maps
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  const contactoToCompany = new Map<string, any>()
  const emailToCompany = new Map<string, any>()
  const phoneToCompany = new Map<string, any>()
  const domainToCompany = new Map<string, any>()

  for (const comp of companies) {
    const cf = comp.custom_fields as Record<string, string> | null
    if (cf?.contacto) contactoToCompany.set(normalize(cf.contacto), comp)
    if (comp.email) {
      emailToCompany.set(comp.email.toLowerCase().trim(), comp)
      const d = comp.email.toLowerCase().trim().split('@')[1]
      if (d && !['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'].includes(d)) {
        domainToCompany.set(d, comp)
      }
    }
    if (cf?.email_2) {
      emailToCompany.set(cf.email_2.toLowerCase().trim(), comp)
      const d = cf.email_2.toLowerCase().trim().split('@')[1]
      if (d && !['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'].includes(d)) {
        domainToCompany.set(d, comp)
      }
    }
    if (comp.phone) {
      const cp = comp.phone.replace(/[\s\-\(\)\+\.]/g, '')
      if (cp.length >= 6) phoneToCompany.set(cp, comp)
    }
    if (cf?.telefono_2) {
      const cp = cf.telefono_2.replace(/[\s\-\(\)\+\.]/g, '')
      if (cp.length >= 6) phoneToCompany.set(cp, comp)
    }
  }

  // Step 6: Link contacts to companies
  let linked = 0
  const matchDetails: any[] = []

  for (const contact of contacts) {
    if (contact.company_id) continue

    const fullName = normalize(`${contact.first_name || ''} ${contact.last_name || ''}`)
    let matchedCompany: any = null
    let strategy = ''

    // 1: full name → contacto
    if (fullName && contactoToCompany.has(fullName)) {
      matchedCompany = contactoToCompany.get(fullName); strategy = 'fullName→contacto'
    }
    // 2: first_name → contacto
    if (!matchedCompany && contact.first_name) {
      const fn = normalize(contact.first_name)
      if (contactoToCompany.has(fn)) { matchedCompany = contactoToCompany.get(fn); strategy = 'firstName→contacto' }
    }
    // 3: exact email
    if (!matchedCompany && contact.email) {
      const em = contact.email.toLowerCase().trim()
      if (emailToCompany.has(em)) { matchedCompany = emailToCompany.get(em); strategy = 'exactEmail' }
    }
    // 4: email domain
    if (!matchedCompany && contact.email) {
      const domain = contact.email.toLowerCase().trim().split('@')[1]
      if (domain && domainToCompany.has(domain)) { matchedCompany = domainToCompany.get(domain); strategy = `domain(${domain})` }
    }
    // 5: phone
    if (!matchedCompany && contact.phone) {
      const cp = contact.phone.replace(/[\s\-\(\)\+\.]/g, '')
      if (cp.length >= 6 && phoneToCompany.has(cp)) { matchedCompany = phoneToCompany.get(cp); strategy = 'phone' }
    }
    // 6: partial name
    if (!matchedCompany && fullName && fullName.length > 3) {
      for (const [cn, comp] of contactoToCompany) {
        if (cn.includes(fullName) || fullName.includes(cn)) { matchedCompany = comp; strategy = `partial(${cn})`; break }
      }
    }

    if (matchedCompany) {
      const { error } = await admin
        .from('contacts')
        .update({ company_id: matchedCompany.id })
        .eq('id', contact.id)
      if (!error) linked++
      if (matchDetails.length < 10) matchDetails.push({ contact: `${contact.first_name} ${contact.last_name}`, company: matchedCompany.name, strategy })
    } else if (matchDetails.length < 10) {
      matchDetails.push({ contact: `${contact.first_name} ${contact.last_name}`, email: contact.email, strategy: 'NO MATCH' })
    }
  }

  return NextResponse.json({
    diag,
    wsMigrated,
    maps: { contacto: contactoToCompany.size, email: emailToCompany.size, domain: domainToCompany.size, phone: phoneToCompany.size },
    linked,
    matchDetails,
  })
}
