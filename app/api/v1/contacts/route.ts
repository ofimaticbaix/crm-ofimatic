import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/actions/api-keys'

// GET /api/v1/contacts - Listar contactos
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if ('error' in authResult) return authResult.error

  const { workspaceId } = authResult
  const supabase = createAdminClient()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('contacts')
    .select('*, companies(id, name)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
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

// POST /api/v1/contacts - Crear contacto
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

  const { first_name, last_name, email, phone, mobile, job_title, company_id, lifecycle_stage, lead_source, custom_fields } = body

  if (!email && !first_name && !last_name) {
    return NextResponse.json(
      { error: 'Se requiere al menos email, first_name o last_name' },
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
      mobile,
      job_title,
      company_id: company_id || null,
      lifecycle_stage: lifecycle_stage || 'lead',
      lead_source: lead_source || 'api',
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
