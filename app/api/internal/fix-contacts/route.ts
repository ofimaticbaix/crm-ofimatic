import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This route uses the service role to bypass RLS and fix contact-company links
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return NextResponse.json({ error: 'No service role key configured' })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // 1. Restore soft-deleted contacts
  const { data: restored } = await admin
    .from('contacts')
    .update({ deleted_at: null })
    .not('deleted_at', 'is', null)
    .select('id')

  // 2. Get all contacts
  const { data: contacts, error: cErr } = await admin
    .from('contacts')
    .select('id, first_name, last_name, email, phone, company_id, workspace_id')
    .is('deleted_at', null)

  if (cErr) return NextResponse.json({ error: `contacts: ${cErr.message}` })

  // 3. Get all companies
  const { data: companies, error: compErr } = await admin
    .from('companies')
    .select('id, name, email, phone, custom_fields, workspace_id')
    .is('deleted_at', null)

  if (compErr) return NextResponse.json({ error: `companies: ${compErr.message}` })

  // Diagnostic info
  const diag = {
    restored: restored?.length || 0,
    totalContacts: contacts?.length || 0,
    totalCompanies: companies?.length || 0,
    contactWorkspaces: [...new Set((contacts || []).map(c => c.workspace_id))],
    companyWorkspaces: [...new Set((companies || []).map(c => c.workspace_id))],
    contactsWithCompany: (contacts || []).filter(c => c.company_id).length,
    contactsWithoutCompany: (contacts || []).filter(c => !c.company_id).length,
    sampleContacts: (contacts || []).slice(0, 3).map(c => ({
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      company_id: c.company_id,
    })),
    sampleCompanies: (companies || []).slice(0, 3).map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      contacto: (c.custom_fields as any)?.contacto,
      email_2: (c.custom_fields as any)?.email_2,
      telefono_2: (c.custom_fields as any)?.telefono_2,
    })),
  }

  if (!contacts?.length || !companies?.length) {
    return NextResponse.json({ diag, linked: 0, message: 'No data to link' })
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
  const matchDetails: any[] = []

  for (const contact of contacts) {
    if (contact.company_id) continue

    const fullName = normalize(`${contact.first_name || ''} ${contact.last_name || ''}`)
    let matchedCompany: any = null
    let matchStrategy = ''

    // Strategy 1: full name matches contacto
    if (fullName && contactoToCompany.has(fullName)) {
      matchedCompany = contactoToCompany.get(fullName)
      matchStrategy = 'fullName→contacto'
    }
    // Strategy 2: first_name matches contacto
    if (!matchedCompany && contact.first_name) {
      const fn = normalize(contact.first_name)
      if (contactoToCompany.has(fn)) {
        matchedCompany = contactoToCompany.get(fn)
        matchStrategy = 'firstName→contacto'
      }
    }
    // Strategy 3: exact email
    if (!matchedCompany && contact.email) {
      const em = contact.email.toLowerCase().trim()
      if (emailToCompany.has(em)) {
        matchedCompany = emailToCompany.get(em)
        matchStrategy = 'exactEmail'
      }
    }
    // Strategy 4: email domain
    if (!matchedCompany && contact.email) {
      const domain = contact.email.toLowerCase().trim().split('@')[1]
      if (domain && !['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com'].includes(domain)) {
        for (const comp of companies) {
          if (comp.email?.toLowerCase().trim().split('@')[1] === domain) {
            matchedCompany = comp
            matchStrategy = `emailDomain(${domain})`
            break
          }
        }
      }
    }
    // Strategy 5: phone
    if (!matchedCompany && contact.phone) {
      const cp = contact.phone.replace(/[\s\-\(\)\+\.]/g, '')
      if (cp.length >= 6 && phoneToCompany.has(cp)) {
        matchedCompany = phoneToCompany.get(cp)
        matchStrategy = 'phone'
      }
    }
    // Strategy 6: partial name
    if (!matchedCompany && fullName && fullName.length > 3) {
      for (const [cn, comp] of contactoToCompany) {
        if (cn.includes(fullName) || fullName.includes(cn)) {
          matchedCompany = comp
          matchStrategy = `partialName(${cn})`
          break
        }
      }
    }

    if (matchedCompany) {
      const { error } = await admin
        .from('contacts')
        .update({ company_id: matchedCompany.id })
        .eq('id', contact.id)

      if (!error) {
        linked++
        if (matchDetails.length < 10) {
          matchDetails.push({
            contact: `${contact.first_name} ${contact.last_name}`,
            company: matchedCompany.name,
            strategy: matchStrategy,
          })
        }
      }
    } else if (matchDetails.length < 15) {
      matchDetails.push({
        contact: `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        phone: contact.phone,
        company: null,
        strategy: 'NO MATCH',
      })
    }
  }

  return NextResponse.json({
    diag,
    maps: {
      contacto: contactoToCompany.size,
      email: emailToCompany.size,
      phone: phoneToCompany.size,
    },
    linked,
    matchDetails,
  })
}
