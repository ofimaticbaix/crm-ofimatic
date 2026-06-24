// Verifica el estado actual de los miembros del workspace de Ferran.
// Solo lectura — no modifica nada.

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const FERRAN_EMAIL = 'fpons@metalher.es'

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

const { data: users } = await supa.auth.admin.listUsers()
const ferran = users?.users?.find(u => u.email === FERRAN_EMAIL)
if (!ferran) { console.error('No encuentro a Ferran'); process.exit(1) }

const { data: mem } = await supa.from('memberships').select('id, workspace_id, role').eq('user_id', ferran.id)
console.log('Memberships de Ferran:', mem)

if (mem && mem[0]) {
  const wsId = mem[0].workspace_id
  const { data: ws } = await supa.from('workspaces').select('id, name, slug').eq('id', wsId).single()
  console.log('\nWorkspace:', ws)

  const { data: allMem } = await supa.from('memberships').select('user_id, role, accepted_at').eq('workspace_id', wsId)
  console.log('\nTodos los miembros del workspace:')
  for (const m of allMem || []) {
    const u = users.users.find(x => x.id === m.user_id)
    console.log(` - ${u?.email || m.user_id}  → role=${m.role}  accepted=${m.accepted_at ? 'sí' : 'no'}`)
  }

  const { data: invs } = await supa.from('invitations').select('email, role, accepted_at, revoked_at').eq('workspace_id', wsId)
  console.log('\nInvitaciones del workspace:', invs)
}

const rcabello = users?.users?.find(u => u.email === 'rcabello@metalher.es')
console.log('\n¿rcabello@metalher.es ya tiene cuenta?:', rcabello ? `Sí — id=${rcabello.id}` : 'No, no existe aún')
