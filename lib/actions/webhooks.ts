'use server'

import { createClient } from '@/lib/supabase/server'

// Generate a simple random secret (no crypto dependency)
function generateSecret(): string {
  const chars = 'abcdef0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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

// Test webhook - sends directly without crypto signature
export async function testWebhook(webhookId: string) {
  const supabase = await createClient()

  // Get webhook
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  if (error || !webhook) {
    return { success: false, error: 'Webhook no encontrado' }
  }

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'Este es un evento de prueba desde tu CRM',
      webhook_id: webhookId,
      webhook_name: webhook.name,
    },
  }

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'test',
        'X-Webhook-Timestamp': testPayload.timestamp,
      },
      body: JSON.stringify(testPayload),
    })

    // Log the test
    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event_type: 'test',
      payload: testPayload,
      status_code: response.status,
      duration_ms: 0,
    })

    return { success: response.ok }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

// ============================================
// PUBLIC: Trigger webhooks for events
// Simple implementation without crypto signatures
// ============================================

export async function triggerWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  // Fire and forget - don't block the main operation
  sendWebhooksAsync(workspaceId, event, data).catch(() => {
    // Silently ignore errors - webhooks should not break main operations
  })
}

async function sendWebhooksAsync(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  try {
    const supabase = await createClient()

    // Get active webhooks that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('id, url, secret')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .contains('events', [event])

    if (error || !webhooks || webhooks.length === 0) {
      return // No webhooks to trigger
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Send to all webhooks in parallel
    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const startTime = Date.now()
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Event': event,
              'X-Webhook-Timestamp': payload.timestamp,
            },
            body: JSON.stringify(payload),
          })

          const durationMs = Date.now() - startTime

          // Log the delivery (fire and forget)
          supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: event,
            payload,
            status_code: response.status,
            duration_ms: durationMs,
          }).then(() => {}).catch(() => {})

        } catch {
          // Ignore individual webhook errors
        }
      })
    )
  } catch {
    // Silently fail - don't break main operations
  }
}
