'use server'

import { createClient } from '@/lib/supabase/server'

export interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  currency: string
  max_users: number | null
  max_contacts: number | null
  max_companies: number | null
  max_deals: number | null
  max_pipelines: number | null
  max_storage_mb: number | null
  features: Record<string, boolean>
  sort_order: number
}

export interface PlanLimit {
  allowed: boolean
  current: number
  max: number | null
  unlimited: boolean
}

// Get all available plans
export async function getPlans() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as Plan[], error: null }
}

// Get the current workspace's plan
export async function getWorkspacePlan(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('*, plans(*)')
    .eq('id', workspaceId)
    .single()

  if (error) return { data: null, error: error.message }
  return {
    data: {
      workspace: data,
      plan: data.plans as Plan,
    },
    error: null,
  }
}

// Check if workspace can create more of a resource
export async function checkPlanLimit(workspaceId: string, resource: 'contacts' | 'companies' | 'deals' | 'users' | 'pipelines'): Promise<PlanLimit> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('check_plan_limit', {
      p_workspace_id: workspaceId,
      p_resource: resource,
    })

  if (error) return { allowed: false, current: 0, max: 0, unlimited: false }
  return data as PlanLimit
}

// Check if workspace has a specific feature
export async function checkFeature(workspaceId: string, feature: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('check_feature', {
      p_workspace_id: workspaceId,
      p_feature: feature,
    })

  if (error) return false
  return data as boolean
}

// Get workspace usage summary
export async function getWorkspaceUsage(workspaceId: string) {
  const supabase = await createClient()

  const [contacts, companies, deals, pipelines, members] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).is('deleted_at', null),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).is('deleted_at', null),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).is('deleted_at', null),
    supabase.from('pipelines').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
  ])

  return {
    data: {
      contacts: contacts.count || 0,
      companies: companies.count || 0,
      deals: deals.count || 0,
      pipelines: pipelines.count || 0,
      users: members.count || 0,
    },
    error: null,
  }
}
