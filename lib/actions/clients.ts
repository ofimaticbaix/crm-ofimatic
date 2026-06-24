'use server'

import { createClient } from '@/lib/supabase/server'

export interface CompanyWithStatus {
  id: string
  name: string
  industry: string | null
  website: string | null
  health_score: number | null
  contact_count: number
  deal_count: number
  total_deal_value: number
  last_activity_date: string | null
  days_since_activity: number | null
  next_activity_date: string | null
  status: 'active' | 'overdue' | 'closed'
  contacts: { id: string; first_name: string; last_name: string }[]
}

export interface CompaniesGrouped {
  active: CompanyWithStatus[]
  overdue: CompanyWithStatus[]
  closed: CompanyWithStatus[]
}

export async function getCompaniesWithStatus(workspaceId: string): Promise<{ data: CompaniesGrouped | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Helper: batch .in() queries to avoid Supabase URL length limit
    async function batchIn<T>(
      table: string,
      selectFields: string,
      filterCol: string,
      ids: string[],
      extraFilters?: (q: any) => any
    ): Promise<T[]> {
      if (ids.length === 0) return []
      // BATCH kept at 200 — larger batches risk overflowing Supabase's URL length limit.
      // Perf win comes from running batches in parallel (was sequential with await-in-loop).
      const BATCH = 200
      const batches: string[][] = []
      for (let i = 0; i < ids.length; i += BATCH) {
        batches.push(ids.slice(i, i + BATCH))
      }
      const responses = await Promise.all(batches.map(batch => {
        let q = supabase.from(table).select(selectFields).in(filterCol, batch)
        if (extraFilters) q = extraFilters(q)
        return q
      }))
      const results: T[] = []
      for (const { data } of responses) {
        if (data) results.push(...data as T[])
      }
      return results
    }

    // Query 1: Get REAL customers only (account_type='customer').
    // Prospects, partners, suppliers and unclassified stay out of the Clientes sections —
    // they only show up in the Empresas view under "Sin clasificar". This keeps
    // Activos + Inactivos = Vista General always consistent.
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name, industry, website, health_score, custom_fields, account_type, contacts(id, first_name, last_name)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .eq('account_type', 'customer')
      .order('created_at', { ascending: false })
      .range(0, 1999)

    if (compError) return { data: null, error: compError.message }
    if (!companies || companies.length === 0) {
      return { data: { active: [], overdue: [], closed: [] }, error: null }
    }

    const companyIds = companies.map(c => c.id)
    const allContactIds = companies.flatMap(c =>
      (c.contacts as { id: string }[])?.map(contact => contact.id) || []
    )

    type ActivityWithCompletion = {
      contact_id?: string
      deal_id?: string
      company_id?: string
      created_at: string
      scheduled_at: string | null
      due_date: string | null
      completed_at: string | null
      is_completed: boolean
    }

    // Queries 2, 3, 4 are independent — run them in parallel.
    // Query 2: Get deals grouped by company (value, status, stage info)
    // Query 3: Get activities per company (direct company_id)
    // Query 4: Get activities via contacts (for companies without direct activities)
    const [deals, directActivities, contactActivities] = await Promise.all([
      batchIn<any>(
        'deals',
        'id, company_id, value, status, stages(is_closed_won, is_closed_lost)',
        'company_id',
        companyIds,
        (q: any) => q.is('deleted_at', null)
      ),
      batchIn<any>(
        'activities',
        'company_id, created_at, scheduled_at, due_date, completed_at, is_completed',
        'company_id',
        companyIds
      ),
      batchIn<ActivityWithCompletion>(
        'activities',
        'contact_id, created_at, scheduled_at, due_date, completed_at, is_completed',
        'contact_id',
        allContactIds
      ),
    ])

    // Query 5: Get activities via deals (for tasks associated with deals)
    const allDealIds = deals.map((d: any) => d.id)
    const dealActivities = await batchIn<ActivityWithCompletion>(
      'activities',
      'deal_id, created_at, scheduled_at, due_date, completed_at, is_completed',
      'deal_id',
      allDealIds
    )

    // Build contact-to-company mapping
    const contactToCompany = new Map<string, string>()
    for (const company of companies) {
      const contacts = (company.contacts as { id: string }[]) || []
      for (const contact of contacts) {
        contactToCompany.set(contact.id, company.id)
      }
    }

    // Build deal-to-company mapping
    const dealToCompany = new Map<string, string>()
    for (const deal of deals || []) {
      if (deal.company_id) {
        dealToCompany.set(deal.id, deal.company_id)
      }
    }

    // Build lookup maps
    const dealsByCompany = new Map<string, typeof deals>()
    for (const deal of deals || []) {
      if (!deal.company_id) continue
      const arr = dealsByCompany.get(deal.company_id) || []
      arr.push(deal)
      dealsByCompany.set(deal.company_id, arr)
    }

    // Build activity maps per company
    // lastContactByCompany: most recent COMPLETED activity (real contact date)
    // nextActivityByCompany: nearest future scheduled activity
    const lastContactByCompany = new Map<string, string>()
    const nextActivityByCompany = new Map<string, string>()

    const now = new Date()

    // Cache parsed timestamps to avoid repeated new Date() parsing (perf win on big datasets)
    const lastContactTs = new Map<string, number>()
    const nextActivityTs = new Map<string, number>()
    const nowTs = now.getTime()

    const processActivity = (companyId: string, act: ActivityWithCompletion) => {
      // Track last real contact: completed_at from completed tasks only
      if (act.is_completed && act.completed_at) {
        const ts = new Date(act.completed_at).getTime()
        const existing = lastContactTs.get(companyId)
        if (existing === undefined || ts > existing) {
          lastContactTs.set(companyId, ts)
          lastContactByCompany.set(companyId, act.completed_at)
        }
      }
      // Track next scheduled activity: earliest future date
      const futureDate = act.scheduled_at || act.due_date
      if (futureDate) {
        const ts = new Date(futureDate).getTime()
        if (ts >= nowTs) {
          const existing = nextActivityTs.get(companyId)
          if (existing === undefined || ts < existing) {
            nextActivityTs.set(companyId, ts)
            nextActivityByCompany.set(companyId, futureDate)
          }
        }
      }
    }

    // Process direct company activities
    for (const act of directActivities || []) {
      if (!act.company_id) continue
      processActivity(act.company_id, act as ActivityWithCompletion)
    }

    // Process contact activities (for companies without direct activities)
    for (const act of contactActivities) {
      if (!act.contact_id) continue
      const companyId = contactToCompany.get(act.contact_id)
      if (!companyId) continue
      processActivity(companyId, act)
    }

    // Process deal activities (for tasks associated with deals)
    for (const act of dealActivities) {
      if (!act.deal_id) continue
      const companyId = dealToCompany.get(act.deal_id)
      if (!companyId) continue
      processActivity(companyId, act)
    }

    const result: CompaniesGrouped = { active: [], overdue: [], closed: [] }

    for (const company of companies) {
      const companyDeals = dealsByCompany.get(company.id) || []
      const contactsList = (company.contacts as any[]) || []
      const lastContactDate = lastContactByCompany.get(company.id) || null
      const nextActivityDate = nextActivityByCompany.get(company.id) || null

      const totalDealValue = companyDeals.reduce((sum, d) => sum + (d.value || 0), 0)
      const dealCount = companyDeals.length

      let daysSinceContact: number | null = null
      if (lastContactDate) {
        daysSinceContact = Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
      }

      // Status classification is manual-only: a client is inactive ONLY when the
      // user explicitly marks it as such from the detail modal. No auto-rules.
      const manualStatus = (company as any).custom_fields?.manual_status as string | undefined
      const status: 'active' | 'overdue' | 'closed' = manualStatus === 'inactive' ? 'overdue' : 'active'

      const companyWithStatus: CompanyWithStatus = {
        id: company.id,
        name: company.name,
        industry: company.industry,
        website: company.website,
        health_score: company.health_score,
        contact_count: contactsList.length,
        deal_count: dealCount,
        total_deal_value: totalDealValue,
        last_activity_date: lastContactDate,
        days_since_activity: daysSinceContact,
        next_activity_date: nextActivityDate,
        status,
        contacts: contactsList.map(c => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
        })),
      }

      result[status].push(companyWithStatus)
    }

    return { data: result, error: null }
  } catch (err) {
    console.error('getCompaniesWithStatus error:', err)
    return { data: null, error: String(err) }
  }
}
