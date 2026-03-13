'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Generate a random secret using UUID (works in all runtimes)
function generateSecret(): string {
  // Generate 2 UUIDs and combine them for a 64-char hex string
  const uuid1 = globalThis.crypto.randomUUID().replace(/-/g, '')
  const uuid2 = globalThis.crypto.randomUUID().replace(/-/g, '')
  return uuid1 + uuid2
}

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Contacts
  'contact.created': 'Contacto creado',
  'contact.updated': 'Contacto actualizado',
  'contact.deleted': 'Contacto eliminado',
  // Companies
  'company.created': 'Empresa creada',
  'company.updated': 'Empresa actualizada',
  'company.deleted': 'Empresa eliminada',
  // Deals
  'deal.created': 'Oportunidad creada',
  'deal.updated': 'Oportunidad actualizada',
  'deal.stage_changed': 'Etapa de oportunidad cambiada',
  'deal.won': 'Oportunidad ganada',
  'deal.lost': 'Oportunidad perdida',
  // Activities
  'activity.created': 'Actividad creada',
  // Tasks
  'task.created': 'Tarea creada',
  'task.completed': 'Tarea completada',
} as const

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS

export interface WebhookInput {
  name: string
  url: string
  secret?: string
  events: WebhookEvent[]
  is_active?: boolean
}

// List webhooks for workspace
export async function getWebhooks(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Create webhook
export async function createWebhook(workspaceId: string, input: WebhookInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autenticado' }

  // Validate URL
  try {
    new URL(input.url)
  } catch {
    return { data: null, error: 'URL inválida' }
  }

  // Generate secret if not provided
  const secret = input.secret || generateSecret()

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      url: input.url,
      secret,
      events: input.events,
      is_active: input.is_active ?? true,
      created_by_id: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Update webhook
export async function updateWebhook(id: string, input: Partial<WebhookInput>) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.url !== undefined) updateData.url = input.url
  if (input.secret !== undefined) updateData.secret = input.secret
  if (input.events !== undefined) updateData.events = input.events
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  const { data, error } = await supabase
    .from('webhooks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Delete webhook
export async function deleteWebhook(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

// Get webhook logs
export async function getWebhookLogs(webhookId: string, limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('triggered_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Test webhook - calls the internal API route
export async function testWebhook(webhookId: string) {
  const supabase = await createClient()

  // Get webhook
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('workspace_id, name')
    .eq('id', webhookId)
    .single()

  if (error || !webhook) {
    return { success: false, error: 'Webhook no encontrado' }
  }

  // Call internal API to trigger the test
  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    const response = await fetch(`${protocol}://${host}/api/internal/trigger-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        workspaceId: webhook.workspace_id,
        event: 'test',
        data: {
          message: 'Este es un evento de prueba desde tu CRM',
          webhook_id: webhookId,
          webhook_name: webhook.name,
        },
      }),
    })

    if (response.ok) {
      return { success: true }
    } else {
      return { success: false, error: 'Error enviando webhook' }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

// ============================================
// PUBLIC: Trigger webhooks for events
// Uses internal API route for crypto compatibility
// ============================================

export async function triggerWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  // Fire and forget - don't block the main operation
  // Use internal API route which runs in Node.js runtime
  triggerWebhooksAsync(workspaceId, event, data).catch(console.error)
}

async function triggerWebhooksAsync(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    await fetch(`${protocol}://${host}/api/internal/trigger-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({ workspaceId, event, data }),
    })
  } catch (err) {
    console.error('Failed to trigger webhooks:', err)
  }
}
