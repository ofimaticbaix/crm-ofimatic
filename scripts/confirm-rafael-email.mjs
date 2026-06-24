// Confirma manualmente el email de Rafael (rcabello@metalher.es) desde el panel
// admin de Supabase. Útil cuando el enlace de verificación expiró o fue
// consumido por un escáner de seguridad (Outlook Safe Links, p. ej.).
//
// Tras esto, Rafael puede entrar directamente con la contraseña que eligió en
// el signup.
//
// Uso:
//   node scripts/confirm-rafael-email.mjs
//   node scripts/confirm-rafael-email.mjs --reset-password   (genera nueva contraseña aleatoria si la olvidó)

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const RAFAEL_EMAIL = 'rcabello@metalher.es'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

const { data: list } = await supa.auth.admin.listUsers()
const rafael = list?.users?.find(u => u.email === RAFAEL_EMAIL)

if (!rafael) {
  console.error(`Rafael (${RAFAEL_EMAIL}) NO existe todavía en auth.users.`)
  console.error('Pídele que primero pruebe a registrarse en /signup. Cuando exista, vuelve a lanzar este script.')
  process.exit(1)
}

console.log('Estado actual de Rafael:')
console.log(`  id:                ${rafael.id}`)
console.log(`  email:             ${rafael.email}`)
console.log(`  email_confirmed:   ${rafael.email_confirmed_at ? 'sí (' + rafael.email_confirmed_at + ')' : 'NO'}`)
console.log(`  created_at:        ${rafael.created_at}`)
console.log(`  last_sign_in_at:   ${rafael.last_sign_in_at || 'nunca'}`)

const updates = {}
if (!rafael.email_confirmed_at) {
  updates.email_confirm = true
}

let newPassword = null
if (process.argv.includes('--reset-password')) {
  newPassword = crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 12) + '!'
  updates.password = newPassword
}

if (Object.keys(updates).length === 0) {
  console.log('\n✓ Rafael ya tiene el email confirmado y no se ha pedido reset de contraseña. Nada que hacer.')
  console.log('  Puede iniciar sesión con su contraseña en /login.')
  process.exit(0)
}

const { data: updated, error } = await supa.auth.admin.updateUserById(rafael.id, updates)
if (error) { console.error('Error actualizando usuario:', error); process.exit(1) }

console.log('\n✅ Rafael actualizado.')
if (updates.email_confirm) console.log('   Email marcado como confirmado.')
if (newPassword) {
  console.log(`   Nueva contraseña temporal: ${newPassword}`)
  console.log('   Pásasela por canal seguro (NO email). Recomiéndale cambiarla en /settings.')
}

console.log('\nSiguiente paso:')
console.log('  1. Rafael abre el enlace de invitación que ya tiene.')
console.log('  2. Pulsa "Aceptar invitación".')
console.log('  3. Tú lanzas: node scripts/transfer-ownership-to-rafael.mjs')
