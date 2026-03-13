'use server'

import { createClient } from '@/lib/supabase/server'
import { randomBytes, createHmac } from 'node:crypto'

// Node.js crypto functions (Server Actions run in Node.js runtime)
function generateSecret(): string {
  return randomBytes(32).toString('hex')
}

function createHmacSignature(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
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

// Test webhook (send test payload)
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

  // Send test payload
  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'Este es un evento de prueba desde tu CRM',
      webhook_id: webhookId,
      webhook_name: webhook.name,
    },
  }

  const result = await sendWebhook(webhook, 'test', testPayload)
  return result
}

// ============================================
// INTERNAL: Trigger webhook for an event
// ============================================

interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

async function sendWebhook(
  webhook: { id: string; url: string; secret: string | null },
  eventType: string,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const startTime = Date.now()

  try {
    // Create signature
    const payloadString = JSON.stringify(payload)
    const signature = webhook.secret
      ? createHmacSignature(webhook.secret, payloadString)
      : undefined

    // Send request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': eventType,
        'X-Webhook-Timestamp': payload.timestamp,
        ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
      },
      body: payloadString,
    })

    const durationMs = Date.now() - startTime
    const responseBody = await response.text().catch(() => '')

    // Log the delivery
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      status_code: response.status,
      response_body: responseBody.slice(0, 1000), // Limit response size
      duration_ms: durationMs,
    })

    // Update webhook status
    await supabase
      .from('webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_status_code: response.status,
        failure_count: response.ok ? 0 : supabase.rpc('increment_failure_count', { webhook_id: webhook.id }),
      })
      .eq('id', webhook.id)

    return { success: response.ok }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    // Log the failure
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      error_message: errorMessage,
      duration_ms: durationMs,
    })

    return { success: false, error: errorMessage }
  }
}

// ============================================
// PUBLIC: Trigger webhooks for events
// ============================================

export async function triggerWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
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

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  // Fire and forget - don't block the main operation
  Promise.all(
    webhooks.map(webhook => sendWebhook(webhook, event, payload))
  ).catch(console.error)
}
