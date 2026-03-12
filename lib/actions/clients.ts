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

    // Query 1: Get companies with contact count and contacts list
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name, industry, website, health_score, contacts(id, first_name, last_name)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (compError) return { data: null, error: compError.message }
    if (!companies || companies.length === 0) {
      return { data: { active: [], overdue: [], closed: [] }, error: null }
    }

    const companyIds = companies.map(c => c.id)

    // Query 2: Get deals grouped by company (value, status, stage info)
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, company_id, value, status, stages(is_closed_won, is_closed_lost)')
      .in('company_id', companyIds)
      .is('deleted_at', null)

    if (dealsError) return { data: null, error: dealsError.message }

    // Query 3: Get latest activity per company
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('company_id, created_at')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    if (actError) return { data: null, error: actError.message }

    // Build lookup maps
    const dealsByCompany = new Map<string, typeof deals>()
    for (const deal of deals || []) {
      if (!deal.company_id) continue
      const arr = dealsByCompany.get(deal.company_id) || []
      arr.push(deal)
      dealsByCompany.set(deal.company_id, arr)
    }

    // Latest activity per company
    const lastActivityByCompany = new Map<string, string>()
    for (const act of activities || []) {
      if (!act.company_id) continue
      if (!lastActivityByCompany.has(act.company_id)) {
        lastActivityByCompany.set(act.company_id, act.created_at)
      }
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const result: CompaniesGrouped = { active: [], overdue: [], closed: [] }

    for (const company of companies) {
      const companyDeals = dealsByCompany.get(company.id) || []
      const contactsList = (company.contacts as any[]) || []
      const lastActivityDate = lastActivityByCompany.get(company.id) || null

      const totalDealValue = companyDeals.reduce((sum, d) => sum + (d.value || 0), 0)
      const dealCount = companyDeals.length

      let daysSinceActivity: number | null = null
      if (lastActivityDate) {
        daysSinceActivity = Math.floor((now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      }

      // Determine status
      // Check if all deals are closed (won or lost)
      const hasOpenDeals = companyDeals.some(d => {
        const stage = d.stages as any
        return d.status === 'open' && stage && !stage.is_closed_won && !stage.is_closed_lost
      })

      let status: 'active' | 'overdue' | 'closed'

      if (dealCount === 0 || !hasOpenDeals) {
        // No deals or all deals closed
        status = 'closed'
      } else if (!lastActivityDate || new Date(lastActivityDate) < sevenDaysAgo) {
        // Has open deals but no recent activity
        status = 'overdue'
      } else {
        // Has open deals and recent activity
        status = 'active'
      }

      const companyWithStatus: CompanyWithStatus = {
        id: company.id,
        name: company.name,
        industry: company.industry,
        website: company.website,
        health_score: company.health_score,
        contact_count: contactsList.length,
        deal_count: dealCount,
        total_deal_value: totalDealValue,
        last_activity_date: lastActivityDate,
        days_since_activity: daysSinceActivity,
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
