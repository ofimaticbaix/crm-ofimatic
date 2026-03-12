import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/actions/api-keys'

// GET /api/v1/deals - Listar deals/oportunidades
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if ('error' in authResult) return authResult.error

  const { workspaceId } = authResult
  const supabase = createAdminClient()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('deals')
    .select(`
      *,
      companies(id, name),
      stages(id, name, probability, is_closed_won, is_closed_lost),
      deal_contacts(contact_id, role, is_primary, contacts(id, first_name, last_name, email))
    `, { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: { total: count, limit, offset },
  })
}

// POST /api/v1/deals - Crear deal/oportunidad
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

  const { name, description, pipeline_id, stage_id, value, currency, expected_close_date, company_id, status: dealStatus, next_step, competitors, custom_fields } = body

  if (!name || !pipeline_id || !stage_id) {
    return NextResponse.json(
      { error: 'Se requieren los campos name, pipeline_id y stage_id' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('deals')
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      pipeline_id,
      stage_id,
      value,
      currency: currency || 'EUR',
      expected_close_date,
      company_id: company_id || null,
      status: dealStatus || 'open',
      next_step,
      competitors,
      custom_fields: custom_fields || {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
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
