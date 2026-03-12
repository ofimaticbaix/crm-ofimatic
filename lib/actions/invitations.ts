'use server'

import { createClient } from '@/lib/supabase/server'
import { checkPlanLimit } from '@/lib/actions/plans'

export interface Member {
  userId: string
  fullName: string
  email: string
  role: string
  joinedAt: string
}

export interface Invitation {
  id: string
  email: string
  role: string
  status: string
  token: string
  createdAt: string
  expiresAt: string
}

// Obtener todos los miembros del workspace con detalles de usuario
export async function getWorkspaceMembers(workspaceId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('user_id, role, created_at, users(id, full_name, email)')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('getWorkspaceMembers error:', error.message)
      return { data: null, error: error.message }
    }

    const members: Member[] = (data || []).map((m: any) => ({
      userId: m.user_id,
      fullName: m.users?.full_name || m.users?.email?.split('@')[0] || 'Usuario',
      email: m.users?.email || '',
      role: m.role,
      joinedAt: m.created_at,
    }))

    return { data: members, error: null }
  } catch (err) {
    console.error('getWorkspaceMembers error:', err)
    return { data: null, error: String(err) }
  }
}

// Obtener invitaciones pendientes del workspace
export async function getWorkspaceInvitations(workspaceId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, role, status, token, created_at, expires_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getWorkspaceInvitations error:', error.message)
      return { data: null, error: error.message }
    }

    const invitations: Invitation[] = (data || []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      token: inv.token,
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
    }))

    return { data: invitations, error: null }
  } catch (err) {
    console.error('getWorkspaceInvitations error:', err)
    return { data: null, error: String(err) }
  }
}

// Invitar un usuario al workspace
export async function inviteUser(workspaceId: string, email: string, role: 'admin' | 'member') {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    // Verificar que el usuario es admin/owner
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return { data: null, error: 'No tienes permisos para invitar usuarios' }
    }

    // Verificar limite del plan
    const limit = await checkPlanLimit(workspaceId, 'users')
    if (!limit.allowed && !limit.unlimited) {
      return { data: null, error: `Has alcanzado el limite de ${limit.max} usuarios en tu plan. Mejora tu plan para invitar mas usuarios.` }
    }

    // Verificar que no exista ya un miembro con ese email
    const { data: existingMembers } = await supabase
      .from('memberships')
      .select('user_id, users(email)')
      .eq('workspace_id', workspaceId)

    const alreadyMember = (existingMembers || []).some(
      (m: any) => m.users?.email?.toLowerCase() === email.toLowerCase()
    )
    if (alreadyMember) {
      return { data: null, error: 'Este usuario ya es miembro del workspace' }
    }

    // Verificar que no exista una invitacion pendiente para ese email
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return { data: null, error: 'Ya existe una invitacion pendiente para este email' }
    }

    // Crear la invitacion
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
      })
      .select('id, token, email, role, status, created_at, expires_at')
      .single()

    if (error) {
      console.error('inviteUser insert error:', error.message)
      return { data: null, error: error.message }
    }

    return {
      data: {
        id: invitation.id,
        token: invitation.token,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      },
      error: null,
    }
  } catch (err) {
    console.error('inviteUser error:', err)
    return { data: null, error: String(err) }
  }
}

// Revocar una invitacion
export async function revokeInvitation(invitationId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (error) {
      console.error('revokeInvitation error:', error.message)
      return { data: null, error: error.message }
    }

    return { data: true, error: null }
  } catch (err) {
    console.error('revokeInvitation error:', err)
    return { data: null, error: String(err) }
  }
}

// Eliminar un miembro del workspace
export async function removeMember(workspaceId: string, memberUserId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'No autenticado' }
    }

    // Verificar que el usuario actual es admin/owner
    const { data: currentMembership } = await supabase
      .from('memberships')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
      return { data: null, error: 'No tienes permisos para eliminar miembros' }
    }

    // No permitir eliminar al owner
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', memberUserId)
      .single()

    if (targetMembership?.role === 'owner') {
      return { data: null, error: 'No se puede eliminar al propietario del workspace' }
    }

    // No permitir eliminarse a si mismo
    if (memberUserId === user.id) {
      return { data: null, error: 'No puedes eliminarte a ti mismo del workspace' }
    }

    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', memberUserId)

    if (error) {
      console.error('removeMember error:', error.message)
      return { data: null, error: error.message }
    }

    return { data: true, error: null }
  } catch (err) {
    console.error('removeMember error:', err)
    return { data: null, error: String(err) }
  }
}

// Aceptar una invitacion por token
export async function acceptInvitation(token: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'not_authenticated' }
    }

    // Buscar la invitacion por token
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !invitation) {
      return { data: null, error: 'Invitacion no encontrada o invalida' }
    }

    // Verificar que no este expirada
    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirada
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      return { data: null, error: 'Esta invitacion ha expirado' }
    }

    // Verificar que este pendiente
    if (invitation.status !== 'pending') {
      return { data: null, error: `Esta invitacion ya fue ${invitation.status === 'accepted' ? 'aceptada' : invitation.status === 'revoked' ? 'revocada' : 'procesada'}` }
    }

    // Verificar que el email coincida
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return { data: null, error: `Esta invitacion fue enviada a ${invitation.email}. Inicia sesion con esa cuenta para aceptarla.` }
    }

    // Verificar que no sea ya miembro
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      // Ya es miembro, marcar invitacion como aceptada
      await supabase
        .from('invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)
      return { data: { workspaceId: invitation.workspace_id, alreadyMember: true }, error: null }
    }

    // Crear membership
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
      })

    if (membershipError) {
      console.error('acceptInvitation membership error:', membershipError.message)
      return { data: null, error: 'Error al unirse al workspace: ' + membershipError.message }
    }

    // Marcar invitacion como aceptada
    await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return { data: { workspaceId: invitation.workspace_id, alreadyMember: false }, error: null }
  } catch (err) {
    console.error('acceptInvitation error:', err)
    return { data: null, error: String(err) }
  }
}
