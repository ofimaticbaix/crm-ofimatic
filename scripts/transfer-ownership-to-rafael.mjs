// Transferencia de propiedad del workspace "Metalher CRM" de Ferran a Rafael.
// Pre-requisito: Rafael ya tiene cuenta en el sistema y ha aceptado la invitación
// (ver scripts/invite-rafael.mjs).
//
// Resultado:
//   - Rafael (rcabello@metalher.es)  → role = 'owner'
//   - Ferran (fpons@metalher.es)     → role = 'admin'
//
// Limpieza: si Rafael tenía un workspace por defecto creado en su signup
// (sin datos), se elimina para que workspace-context resuelva siempre Metalher CRM.

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

const FERRAN_EMAIL = 'fpons@metalher.es'
const RAFAEL_EMAIL = 'rcabello@metalher.es'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

const { data: users } = await supa.auth.admin.listUsers()
const ferran = users?.users?.find(u => u.email === FERRAN_EMAIL)
const rafael = users?.users?.find(u => u.email === RAFAEL_EMAIL)

if (!ferran) { console.error('No encuentro a Ferran'); process.exit(1) }
if (!rafael) {
  console.error(`Rafael (${RAFAEL_EMAIL}) NO tiene cuenta todavía.`)
  console.error('Pídele que se registre primero en /signup con ese email y acepte la invitación.')
  process.exit(1)
}

// Workspace de Ferran
const { data: ferranMem } = await supa
  .from('memberships')
  .select('id, workspace_id, role')
  .eq('user_id', ferran.id)
  .eq('role', 'owner')
  .maybeSingle()

if (!ferranMem) {
  console.error('Ferran no es owner de ningún workspace. ¿Ya hicimos la transferencia?')
  // Mostrar estado actual
  const { data: allFerran } = await supa.from('memberships').select('workspace_id, role').eq('user_id', ferran.id)
  console.log('Memberships de Ferran:', allFerran)
  process.exit(1)
}
const WORKSPACE_ID = ferranMem.workspace_id

// Membership de Rafael en ese workspace
const { data: rafaelMem } = await supa
  .from('memberships')
  .select('id, role')
  .eq('user_id', rafael.id)
  .eq('workspace_id', WORKSPACE_ID)
  .maybeSingle()

if (!rafaelMem) {
  console.error('Rafael todavía no es miembro de "Metalher CRM". Debe aceptar la invitación primero.')
  process.exit(1)
}

console.log(`Estado actual:`)
console.log(`  Ferran (${ferran.id})  → role = ${ferranMem.role}`)
console.log(`  Rafael (${rafael.id}) → role = ${rafaelMem.role}`)
console.log(`  Workspace: ${WORKSPACE_ID}`)

if (DRY_RUN) {
  console.log('\nDRY-RUN — sin cambios. Quita --dry-run para aplicar.')
  process.exit(0)
}

// 1) Promover Rafael a owner
{
  const { error } = await supa
    .from('memberships')
    .update({ role: 'owner' })
    .eq('id', rafaelMem.id)
  if (error) { console.error('Error promoviendo a Rafael:', error); process.exit(1) }
  console.log('✓ Rafael ahora es owner.')
}

// 2) Degradar a Ferran a admin
{
  const { error } = await supa
    .from('memberships')
    .update({ role: 'admin' })
    .eq('id', ferranMem.id)
  if (error) { console.error('Error degradando a Ferran:', error); process.exit(1) }
  console.log('✓ Ferran degradado a admin.')
}

// 3) Limpieza: workspace por defecto que el trigger creó al registrarse Rafael
const { data: rafaelWorkspaces } = await supa
  .from('memberships')
  .select('workspace_id, role, workspaces:workspaces!inner(id, name)')
  .eq('user_id', rafael.id)

console.log('\nWorkspaces de Rafael:')
for (const m of rafaelWorkspaces || []) {
  console.log(`  - ${m.workspaces?.name || m.workspace_id}  → role=${m.role}`)
}

const orphanWorkspaces = (rafaelWorkspaces || []).filter(m => m.workspace_id !== WORKSPACE_ID)
for (const orphan of orphanWorkspaces) {
  const wsId = orphan.workspace_id
  // Comprobar si está vacío (sin clientes/deals)
  const [{ count: companies }, { count: deals }] = await Promise.all([
    supa.from('companies').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
    supa.from('deals').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
  ])
  if ((companies || 0) === 0 && (deals || 0) === 0) {
    console.log(`Eliminando workspace vacío de Rafael: ${orphan.workspaces?.name} (${wsId})`)
    await supa.from('memberships').delete().eq('workspace_id', wsId)
    await supa.from('workspaces').delete().eq('id', wsId)
  } else {
    console.log(`Workspace ${wsId} tiene datos (${companies} empresas, ${deals} deals). NO lo borro.`)
  }
}

console.log('\n✅ Transferencia completada.')
console.log('   Rafael es ahora propietario de Metalher CRM.')
console.log('   Ferran sigue trabajando como admin (sin pérdida de funcionalidad).')
