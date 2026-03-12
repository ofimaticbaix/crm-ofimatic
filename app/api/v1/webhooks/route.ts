import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/actions/api-keys'

// POST /api/v1/webhooks - Recibir eventos webhook desde n8n
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if ('error' in authResult) return authResult.error

  const { workspaceId } = authResult
  const supabase = createAdminClient()

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const { event_type, data: eventData } = body

  if (!event_type) {
    return NextResponse.json(
      { error: 'Se requiere el campo event_type' },
      { status: 400 }
    )
  }

  try {
    switch (event_type) {
      // Crear contacto desde formulario externo
      case 'contact.create':
      case 'form.submission': {
        const { first_name, last_name, email, phone, lead_source, custom_fields, ...rest } = eventData || {}

        if (!email && !first_name) {
          return NextResponse.json(
            { error: 'Se requiere al menos email o first_name en data' },
            { status: 400 }
          )
        }

        const { data, error } = await supabase
          .from('contacts')
          .insert({
            workspace_id: workspaceId,
            first_name,
            last_name,
            email,
            phone,
            lead_source: lead_source || 'webhook',
            lifecycle_stage: 'lead',
            custom_fields: { ...custom_fields, ...rest },
          })
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          event_type,
          record: data,
        }, { status: 201 })
      }

      // Crear empresa
      case 'company.create': {
        const { name, website, industry, ...rest } = eventData || {}

        if (!name) {
          return NextResponse.json(
            { error: 'Se requiere el campo name en data' },
            { status: 400 }
          )
        }

        const { data, error } = await supabase
          .from('companies')
          .insert({
            workspace_id: workspaceId,
            name,
            website,
            industry,
            custom_fields: rest,
          })
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          event_type,
          record: data,
        }, { status: 201 })
      }

      // Crear deal/oportunidad
      case 'deal.create': {
        const { name, pipeline_id, stage_id, value, currency, company_id, ...rest } = eventData || {}

        if (!name || !pipeline_id || !stage_id) {
          return NextResponse.json(
            { error: 'Se requieren name, pipeline_id y stage_id en data' },
            { status: 400 }
          )
        }

        const { data, error } = await supabase
          .from('deals')
          .insert({
            workspace_id: workspaceId,
            name,
            pipeline_id,
            stage_id,
            value,
            currency: currency || 'EUR',
            company_id: company_id || null,
            status: 'open',
            custom_fields: rest,
          })
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          event_type,
          record: data,
        }, { status: 201 })
      }

      // Actualizar contacto
      case 'contact.update': {
        const { id, ...updateData } = eventData || {}

        if (!id) {
          return NextResponse.json(
            { error: 'Se requiere el campo id en data' },
            { status: 400 }
          )
        }

        const { data, error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', id)
          .eq('workspace_id', workspaceId)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          event_type,
          record: data,
        })
      }

      // Evento generico - log para procesamiento futuro
      default: {
        console.log(`Webhook event no manejado: ${event_type}`, eventData)
        return NextResponse.json({
          success: true,
          event_type,
          message: `Evento ${event_type} recibido pero no tiene handler configurado`,
        })
      }
    }
  } catch (err) {
    console.error('Error procesando webhook:', err)
    return NextResponse.json(
      { error: 'Error interno procesando el evento' },
      { status: 500 }
    )
  }
}

// Helper para autenticar requests con API key
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Se requiere header Authorization: Bearer <api_key>' },
        { status: 401 }
      ),
    }
  }

  const apiKey = authHeader.replace('Bearer ', '')
  const { data, error } = await validateApiKey(apiKey)

  if (error || !data) {
    return {
      error: NextResponse.json(
        { error: 'API key invalida o revocada' },
        { status: 401 }
      ),
    }
  }

  return { workspaceId: data.workspaceId, keyId: data.keyId }
}
