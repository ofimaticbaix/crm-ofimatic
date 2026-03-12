import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return null
  }
  return user
}

// GET - List all workspaces with owner info
export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('workspaces')
    .select('id, name, slug, subscription_status, subscription_tier, plan_id, trial_ends_at, created_at, owner_id, users!workspaces_owner_id_fkey(email, full_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PATCH - Update workspace status/plan
export async function PATCH(request: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { workspaceId, subscription_status, plan_id, subscription_tier } = body

  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 })

  const admin = createAdminClient()
  const updateData: Record<string, string> = {}
  if (subscription_status) updateData.subscription_status = subscription_status
  if (plan_id) updateData.plan_id = plan_id
  if (subscription_tier) updateData.subscription_tier = subscription_tier

  const { error } = await admin
    .from('workspaces')
    .update(updateData)
    .eq('id', workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
