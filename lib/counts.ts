// Single source of truth for CRM counters.
// Pure functions. Given an array of entities, derive counts/filters.
// Used by EVERY page that shows numbers about clientes/leads/deals so the same
// dataset always yields the same numbers, no matter where it's rendered.

// ─── Companies ─────────────────────────────────────────────────────────────

export interface CompanyLite {
  id: string
  account_type?: string | null
  custom_fields?: Record<string, any> | null
  // Other fields can exist; we only consume these for counting.
}

export const isCustomer = (c: CompanyLite) => c.account_type === 'customer'
export const isLead = (c: CompanyLite) => c.account_type === 'lead'
export const isUnclassifiedCompany = (c: CompanyLite) =>
  c.account_type !== 'customer' && c.account_type !== 'lead'

// A customer is "inactive" only when manually flagged. Anything else (active by default).
export const isInactiveCustomer = (c: CompanyLite) =>
  isCustomer(c) && c.custom_fields?.manual_status === 'inactive'

export const isActiveCustomer = (c: CompanyLite) =>
  isCustomer(c) && c.custom_fields?.manual_status !== 'inactive'

export interface CompanyCounts {
  total: number
  customers: number
  customersActive: number
  customersInactive: number
  leads: number
  unclassified: number
}

export function countCompanies(companies: CompanyLite[]): CompanyCounts {
  let customers = 0
  let customersInactive = 0
  let leads = 0
  let unclassified = 0
  for (const c of companies) {
    if (c.account_type === 'customer') {
      customers++
      if (c.custom_fields?.manual_status === 'inactive') customersInactive++
    } else if (c.account_type === 'lead') {
      leads++
    } else {
      unclassified++
    }
  }
  return {
    total: companies.length,
    customers,
    customersActive: customers - customersInactive,
    customersInactive,
    leads,
    unclassified,
  }
}

// ─── Filters ────────────────────────────────────────────────────────────────

export const filterActiveCustomers = (companies: CompanyLite[]) =>
  companies.filter(isActiveCustomer)
export const filterInactiveCustomers = (companies: CompanyLite[]) =>
  companies.filter(isInactiveCustomer)
export const filterLeads = (companies: CompanyLite[]) =>
  companies.filter(isLead)
export const filterCustomers = (companies: CompanyLite[]) =>
  companies.filter(isCustomer)

// ─── Deals / Pipeline ───────────────────────────────────────────────────────

export interface DealLite {
  id: string
  stage_id?: string | null
  value?: number | null
  status?: string | null
  stages?: { is_closed_won?: boolean; is_closed_lost?: boolean; probability?: number | null } | null
}

export interface DealCounts {
  total: number
  totalValue: number
  weightedValue: number
  byStage: Record<string, { count: number; value: number }>
  closedWon: number
  closedWonValue: number
  closedLost: number
  closedLostValue: number
  open: number
  openValue: number
}

export function countDeals(deals: DealLite[]): DealCounts {
  const byStage: Record<string, { count: number; value: number }> = {}
  let totalValue = 0
  let weightedValue = 0
  let closedWon = 0
  let closedWonValue = 0
  let closedLost = 0
  let closedLostValue = 0
  for (const d of deals) {
    const v = d.value || 0
    totalValue += v
    if (d.stage_id) {
      const cur = byStage[d.stage_id] || { count: 0, value: 0 }
      cur.count++
      cur.value += v
      byStage[d.stage_id] = cur
    }
    const won = d.stages?.is_closed_won
    const lost = d.stages?.is_closed_lost
    if (won) {
      closedWon++
      closedWonValue += v
    } else if (lost) {
      closedLost++
      closedLostValue += v
    } else if (d.stages) {
      const prob = (d.stages.probability ?? 0) / 100
      weightedValue += v * prob
    }
  }
  return {
    total: deals.length,
    totalValue,
    weightedValue,
    byStage,
    closedWon,
    closedWonValue,
    closedLost,
    closedLostValue,
    open: deals.length - closedWon - closedLost,
    openValue: totalValue - closedWonValue - closedLostValue,
  }
}

export const filterClosedDeals = (deals: DealLite[]) =>
  deals.filter(d => d.stages?.is_closed_won || d.stages?.is_closed_lost)
export const filterWonDeals = (deals: DealLite[]) =>
  deals.filter(d => d.stages?.is_closed_won)
export const filterLostDeals = (deals: DealLite[]) =>
  deals.filter(d => d.stages?.is_closed_lost)
export const filterOpenDeals = (deals: DealLite[]) =>
  deals.filter(d => !d.stages?.is_closed_won && !d.stages?.is_closed_lost)
