// Crea la invitación para Rafael Cabello (rcabello@metalher.es) al workspace
// "Metalher CRM" con rol 'admin'. Posteriormente, cuando acepte, se transferirá
// la propiedad con `scripts/transfer-ownership-to-rafael.mjs`.
//
// Uso:
//   node scripts/invite-rafael.mjs             → crea (o reutiliza) la invitación
//   node scripts/invite-rafael.mjs --revoke    → revoca la pendiente y crea una nueva

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-ofimaticbaix.vercel.app'

const FERRAN_EMAIL = 'fpons@metalher.es'
const RAFAEL_EMAIL = 'rcabello@metalher.es'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

// 1) Resolver workspace de Ferran
const { data: users } = await supa.auth.admin.listUsers()
const ferran = users?.users?.find(u => u.email === FERRAN_EMAIL)
if (!ferran) { console.error('No encuentro a Ferran'); process.exit(1) }
const { data: ferranMem } = await supa
  .from('memberships')
  .select('workspace_id')
  .eq('user_id', ferran.id)
  .single()
const WORKSPACE_ID = ferranMem.workspace_id

// 2) Comprobar si Rafael ya tiene cuenta y si ya es miembro
const rafael = users?.users?.find(u => u.email === RAFAEL_EMAIL)
if (rafael) {
  const { data: existingMem } = await supa
    .from('memberships')
    .select('role')
    .eq('workspace_id', WORKSPACE_ID)
    .eq('user_id', rafael.id)
    .maybeSingle()
  if (existingMem) {
    console.log(`Rafael ya es miembro del workspace con rol "${existingMem.role}". Salto la invitación.`)
    console.log('→ Lanza ahora: node scripts/transfer-ownership-to-rafael.mjs')
    process.exit(0)
  }
}

// 3) Revocar invitaciones pendientes si --revoke
if (process.argv.includes('--revoke')) {
  const { data: pending } = await supa
    .from('invitations')
    .select('id')
    .eq('workspace_id', WORKSPACE_ID)
    .eq('email', RAFAEL_EMAIL)
    .eq('status', 'pending')
  for (const inv of pending || []) {
    await supa.from('invitations').update({ status: 'revoked' }).eq('id', inv.id)
    console.log(`Invitación previa revocada: ${inv.id}`)
  }
}

// 4) Comprobar si ya hay una invitación pendiente
const { data: existing } = await supa
  .from('invitations')
  .select('id, token, status, expires_at')
  .eq('workspace_id', WORKSPACE_ID)
  .eq('email', RAFAEL_EMAIL)
  .eq('status', 'pending')
  .maybeSingle()

let invitation = existing
if (!invitation) {
  const { data, error } = await supa
    .from('invitations')
    .insert({
      workspace_id: WORKSPACE_ID,
      email: RAFAEL_EMAIL,
      role: 'admin',
      invited_by: ferran.id,
    })
    .select('id, token, status, expires_at')
    .single()
  if (error) { console.error('Error creando invitación:', error); process.exit(1) }
  invitation = data
  console.log('Invitación creada.')
} else {
  console.log('Ya existía una invitación pendiente. Reutilizo.')
}

const url = `${APP_URL}/invite/${invitation.token}`
console.log('\n=== ENLACE PARA RAFAEL ===')
console.log(url)
console.log('=========================\n')
console.log(`Expira: ${new Date(invitation.expires_at).toLocaleString('es-ES')}`)
console.log('\nPasos para Rafael:')
console.log(`  1. Registrarse en ${APP_URL}/signup con el email ${RAFAEL_EMAIL}`)
console.log('  2. Verificar email')
console.log(`  3. Abrir el enlace de arriba`)
console.log('  4. Pulsar "Aceptar invitación"')
console.log('\nUna vez hecho, lanza: node scripts/transfer-ownership-to-rafael.mjs')
