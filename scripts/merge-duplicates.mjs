import { createClient } from '@supabase/supabase-js'

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: users } = await supa.auth.admin.listUsers()
const ferran = users.users.find(u => u.email === 'fpons@metalher.es')
const { data: mem } = await supa.from('memberships').select('workspace_id').eq('user_id', ferran.id).limit(1).single()
const WS = mem.workspace_id

// Pares: [keep_id, remove_id]  (Keep = el bueno, Remove = el duplicado a borrar)
// Los resolvemos por nombre exacto para coger el id justo ahora
const pairs = [
  { keepName: 'CALDERITECH  S.L.',           removeName: 'CALDERITECH',               keepType: 'lead' },
  { keepName: 'TECNIVALL EUROPA SL',         removeName: 'TECNIVALL EUROPA, S.L.',    keepType: 'customer', removeType: 'lead' },
  { keepName: 'DESLI-BLOC, SL',              removeName: 'DESLI - BLOC',              keepType: 'customer' },
  { keepName: 'INESVA WORK SL',              removeName: 'INESVA WORK S.L.',          keepType: 'customer' },
  { keepName: 'SERRALLERIA METADA SLU',      removeName: 'SERRALLERIA METADA S.L',    keepType: 'customer' },
]

for (const p of pairs) {
  const { data: keep } = await supa.from('companies').select('id, custom_fields')
    .eq('workspace_id', WS).is('deleted_at', null).eq('account_type', p.keepType).eq('name', p.keepName).limit(1).maybeSingle()
  const removeType = p.removeType || p.keepType
  const { data: remove } = await supa.from('companies').select('id, custom_fields')
    .eq('workspace_id', WS).is('deleted_at', null).eq('account_type', removeType).eq('name', p.removeName).limit(1).maybeSingle()

  if (!keep) { console.log('✗ No encuentro keep:', p.keepName); continue }
  if (!remove) { console.log('✗ No encuentro remove:', p.removeName); continue }

  // Fusionar custom_fields (los valores de keep prevalecen)
  const mergedCF = { ...(remove.custom_fields || {}), ...(keep.custom_fields || {}) }

  // Actualizar keep con CF fusionado
  await supa.from('companies').update({ custom_fields: mergedCF, updated_at: new Date().toISOString() }).eq('id', keep.id)

  // Soft-delete el duplicado
  await supa.from('companies').update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', remove.id)

  console.log('✅ Fusionado:', p.keepName, '←', p.removeName)
}

console.log('\nHecho.')
