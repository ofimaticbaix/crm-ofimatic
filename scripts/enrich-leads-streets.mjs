// Script: Rellena `billing_address.street` en los leads existentes a partir
// del Excel "CLIENTES POTENCIALES. 1.xlsx".
//
// - NO crea ni borra empresas. Solo UPDATE.
// - NO toca emails, teléfonos, ciudad, NIF, contactos, tags ni custom_fields existentes.
// - Solo añade `street` cuando esté vacío en DB y exista en el Excel.
// - Si el lead no se encuentra por nombre o NIF, se reporta y salta.

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const FERRAN_EMAIL = 'fpons@metalher.es'
const FILE = './CLIENTES POTENCIALES. 1.xlsx'
const HEADER_ROW_INDEX = 4 // row 5 in spreadsheet

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

// 1) Resolver workspace de Ferran
const { data: users } = await supa.auth.admin.listUsers()
const ferran = users?.users?.find(u => u.email === FERRAN_EMAIL)
if (!ferran) { console.error('No encuentro usuario fpons@metalher.es'); process.exit(1) }
const { data: memDirect } = await supa.from('memberships').select('workspace_id').eq('user_id', ferran.id).limit(1).single()
const WORKSPACE_ID = memDirect.workspace_id
console.log('Workspace de Ferran:', WORKSPACE_ID)

// 2) Leer Excel
const wb = XLSX.readFile(FILE)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

// 3) Construir mapa nombre→dirección y nif→dirección
const byName = new Map()
const byNif = new Map()
let excelCount = 0
for (let i = HEADER_ROW_INDEX + 1; i < rows.length; i++) {
  const r = rows[i]
  const rawName = String(r[0] || '').trim()
  if (!rawName) continue
  // El nombre puede venir mezclado con notas tipo "EMPRESA   NO LES INTERESA"
  // Para matching usamos el nombre tal cual aparece en DB (que ya fue limpiado por el import original).
  const street = String(r[1] || '').trim()
  const nif = String(r[7] || '').trim()
  if (!street) continue
  excelCount++
  // Limpiamos el nombre para matching: quitamos exceso de espacios y notas conocidas
  const cleanName = rawName
    .replace(/\s{2,}.*$/, '') // descartar todo lo que venga después de 2+ espacios (nota inline)
    .trim()
    .toLowerCase()
  byName.set(cleanName, street)
  if (nif) byNif.set(nif.toLowerCase(), street)
}
console.log(`Filas del Excel con dirección: ${excelCount}`)

// 4) Cargar todos los leads de DB (account_type='lead')
const { data: leads, error: leadsErr } = await supa
  .from('companies')
  .select('id, name, vat_number, billing_address')
  .eq('workspace_id', WORKSPACE_ID)
  .eq('account_type', 'lead')
  .is('deleted_at', null)
  .range(0, 9999)
if (leadsErr) { console.error('Error leyendo leads:', leadsErr); process.exit(1) }
console.log(`Leads en DB: ${leads.length}`)

// 5) Hacer match y construir updates
let willUpdate = 0
let alreadyHadStreet = 0
let notFound = 0
const updates = []

for (const lead of leads) {
  const currentStreet = lead.billing_address?.street || ''
  if (currentStreet) { alreadyHadStreet++; continue }

  const nameKey = (lead.name || '').toLowerCase().trim()
  const nifKey = (lead.vat_number || '').toLowerCase().trim()

  let street = (nifKey && byNif.get(nifKey)) || byName.get(nameKey)
  if (!street) {
    // Try fuzzy: match contains
    for (const [k, v] of byName) {
      if (k && (k.includes(nameKey) || nameKey.includes(k))) { street = v; break }
    }
  }

  if (!street) { notFound++; continue }
  willUpdate++
  updates.push({
    id: lead.id,
    billing_address: { ...(lead.billing_address || {}), street },
  })
}

console.log(`\nResumen:`)
console.log(`  Ya tenían calle (sin tocar): ${alreadyHadStreet}`)
console.log(`  Se actualizarán: ${willUpdate}`)
console.log(`  Sin match en Excel: ${notFound}`)

// 6) Confirmar antes de aplicar
const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) {
  console.log('\nDRY-RUN — no se aplica ningún cambio. Quita --dry-run para ejecutar.')
  process.exit(0)
}

// 7) Aplicar updates en lotes
let done = 0
for (const u of updates) {
  const { error } = await supa
    .from('companies')
    .update({ billing_address: u.billing_address })
    .eq('id', u.id)
  if (error) console.error(`Error en ${u.id}:`, error.message)
  else done++
}

console.log(`\nActualizados con éxito: ${done}/${updates.length}`)
