'use server'

import { createClient } from '@/lib/supabase/server'

// Obtener el workspace actual del usuario autenticado
export async function getCurrentWorkspace() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    const { data: membership, error } = await supabase
      .from('memberships')
      .select('workspace_id, role, workspaces(id, name, slug, plan_id, subscription_status, subscription_tier, trial_ends_at, plans(*))')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (error) {
      console.error('getCurrentWorkspace error:', error.message)
      return { data: null, error: error.message }
    }

    const workspace = membership.workspaces as any

    return {
      data: {
        userId: user.id,
        userEmail: user.email,
        workspaceId: membership.workspace_id as string,
        role: membership.role as string,
        workspace,
        plan: workspace?.plans || null,
        planId: workspace?.plan_id || 'starter',
      },
      error: null,
    }
  } catch (err) {
    console.error('getCurrentWorkspace error:', err)
    return { data: null, error: String(err) }
  }
}

// Actualizar nombre del workspace
export async function updateWorkspaceName(workspaceId: string, name: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('workspaces')
      .update({ name })
      .eq('id', workspaceId)
    if (error) return { data: null, error: error.message }
    return { data: true, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Obtener perfil del usuario
export async function getUserProfile() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
