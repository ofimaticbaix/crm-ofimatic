'use server'

import { createClient } from '@/lib/supabase/server'

// Obtener el workspace actual del usuario autenticado
export async function getCurrentWorkspace() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: membership, error } = await supabase
    .from('memberships')
    .select('workspace_id, role, workspaces(id, name, slug, subscription_status, subscription_tier)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: {
      userId: user.id,
      userEmail: user.email,
      workspaceId: membership.workspace_id as string,
      role: membership.role as string,
      workspace: membership.workspaces as any,
    },
    error: null,
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
