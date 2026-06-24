'use server'

import { createClient } from '@/lib/supabase/server'

// Obtener workspace + perfil en una sola llamada (optimizado)
export async function getWorkspaceWithProfile() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    // Ejecutar ambas queries en paralelo
    const [membershipResult, profileResult] = await Promise.all([
      supabase
        .from('memberships')
        .select('workspace_id, role, workspaces(id, name, slug, plan_id, subscription_status, subscription_tier, trial_ends_at, logo_url, background_url, background_color, app_subtitle, plans(*))')
        .eq('user_id', user.id)
        .limit(1)
        .single(),
      supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
    ])

    if (membershipResult.error) {
      console.error('getWorkspaceWithProfile error:', membershipResult.error.message)
      return { data: null, error: membershipResult.error.message }
    }

    const workspace = membershipResult.data.workspaces as any
    const profile = profileResult.data

    return {
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: profile?.full_name || user.email?.split('@')[0] || 'Usuario',
        workspaceId: membershipResult.data.workspace_id as string,
        role: membershipResult.data.role as string,
        workspace,
        plan: workspace?.plans || null,
        planId: workspace?.plan_id || 'starter',
      },
      error: null,
    }
  } catch (err) {
    console.error('getWorkspaceWithProfile error:', err)
    return { data: null, error: String(err) }
  }
}

// Legacy: mantener por compatibilidad (llama a la nueva función)
export async function getCurrentWorkspace() {
  return getWorkspaceWithProfile()
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

// Cambiar el color/modo de fondo
export async function updateWorkspaceBackgroundColor(
  workspaceId: string,
  mode: 'white' | 'black' | 'image' | 'default'
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('workspaces')
      .update({ background_color: mode })
      .eq('id', workspaceId)
    if (error) return { data: null, error: error.message }
    return { data: true, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Actualizar subtítulo / tagline del workspace
export async function updateWorkspaceSubtitle(workspaceId: string, subtitle: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('workspaces')
      .update({ app_subtitle: subtitle || null })
      .eq('id', workspaceId)
    if (error) return { data: null, error: error.message }
    return { data: true, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Guardar la URL del logo/fondo en workspaces (la subida la hace el cliente)
export async function setWorkspaceBrandingUrl(
  workspaceId: string,
  kind: 'logo' | 'background',
  publicUrl: string
) {
  try {
    const supabase = await createClient()
    const updateField = kind === 'logo' ? 'logo_url' : 'background_url'
    const { error } = await supabase
      .from('workspaces')
      .update({ [updateField]: publicUrl })
      .eq('id', workspaceId)
    if (error) return { data: null, error: error.message }
    return { data: publicUrl, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Quitar logo o fondo (vuelve al default de la app)
export async function removeWorkspaceBranding(
  workspaceId: string,
  kind: 'logo' | 'background'
) {
  try {
    const supabase = await createClient()
    const updateField = kind === 'logo' ? 'logo_url' : 'background_url'
    const { error } = await supabase
      .from('workspaces')
      .update({ [updateField]: null })
      .eq('id', workspaceId)
    if (error) return { data: null, error: error.message }
    return { data: true, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Legacy: mantener por compatibilidad
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
