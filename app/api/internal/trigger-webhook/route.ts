import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// This internal API route handles webhook triggering
// It runs in Node.js runtime where crypto module works correctly

interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

function createHmacSignature(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function sendWebhook(
  webhook: { id: string; url: string; secret: string | null },
  eventType: string,
  payload: WebhookPayload,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now()

  try {
    const payloadString = JSON.stringify(payload)
    const signature = webhook.secret
      ? createHmacSignature(webhook.secret, payloadString)
      : undefined

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
      response_body: responseBody.slice(0, 1000),
      duration_ms: durationMs,
    })

    // Update webhook status
    if (response.ok) {
      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status_code: response.status,
          failure_count: 0,
        })
        .eq('id', webhook.id)
    } else {
      // Increment failure count using raw SQL
      await supabase.rpc('increment_webhook_failure', { webhook_id: webhook.id })
    }

    return { success: response.ok }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

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

export async function POST(request: NextRequest) {
  try {
    // Verify internal request (simple check - in production use a proper secret)
    const authHeader = request.headers.get('x-internal-secret')
    if (authHeader !== process.env.INTERNAL_API_SECRET && process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, event, data } = body

    if (!workspaceId || !event) {
      return NextResponse.json({ error: 'Missing workspaceId or event' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get active webhooks that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('id, url, secret')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .contains('events', [event])

    if (error || !webhooks || webhooks.length === 0) {
      return NextResponse.json({ triggered: 0 })
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Fire webhooks in parallel (don't wait for all to complete)
    const results = await Promise.allSettled(
      webhooks.map(webhook => sendWebhook(webhook, event, payload, supabase))
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    return NextResponse.json({ triggered: webhooks.length, successful })
  } catch (error) {
    console.error('Trigger webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
