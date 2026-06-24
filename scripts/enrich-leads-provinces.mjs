// Rellena `billing_address.state` (provincia) en los leads existentes deduciéndola
// del código postal. España: los 2 primeros dígitos del CP identifican la provincia.
//
// - NO crea ni borra empresas. Solo UPDATE.
// - Solo actualiza la provincia cuando esté vacía en DB.
// - Lee el CP de billing_address.postal_code; si no existe, lo extrae del campo
//   billing_address.city ("ABRERA 08630") o de la columna POBLACIÓN del Excel.

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const FERRAN_EMAIL = 'fpons@metalher.es'
const FILE = './CLIENTES POTENCIALES. 1.xlsx'
const HEADER_ROW_INDEX = 4

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Mapping prefijo CP (2 dígitos) → provincia (España, oficial 2026).
const CP_PROVINCIA = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería',
  '05': 'Ávila', '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona',
  '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
  '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca',
  '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
  '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
  '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
  '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
  '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
  '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
  '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
  '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza',
  '51': 'Ceuta', '52': 'Melilla',
}

function provinciaFromCP(cp) {
  if (!cp) return null
  const digits = String(cp).replace(/\D/g, '')
  if (digits.length < 2) return null
  return CP_PROVINCIA[digits.slice(0, 2)] || null
}

// Extrae el CP del campo "ABRERA 08630" o similar.
function extractCP(s) {
  if (!s) return null
  const m = String(s).match(/\b(\d{5})\b/)
  return m ? m[1] : null
}

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

// 1) Resolver workspace de Ferran
const { data: users } = await supa.auth.admin.listUsers()
const ferran = users?.users?.find(u => u.email === FERRAN_EMAIL)
if (!ferran) { console.error('No encuentro usuario fpons@metalher.es'); process.exit(1) }
const { data: memDirect } = await supa.from('memberships').select('workspace_id').eq('user_id', ferran.id).limit(1).single()
const WORKSPACE_ID = memDirect.workspace_id
console.log('Workspace de Ferran:', WORKSPACE_ID)

// 2) Leer Excel y mapear empresa → CP (por si en DB no está bien parseado)
const wb = XLSX.readFile(FILE)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

const cpByName = new Map()
const cpByNif = new Map()
for (let i = HEADER_ROW_INDEX + 1; i < rows.length; i++) {
  const r = rows[i]
  const rawName = String(r[0] || '').trim()
  if (!rawName) continue
  const poblacion = String(r[2] || '')
  const nif = String(r[7] || '').trim()
  const cp = extractCP(poblacion)
  if (!cp) continue
  const cleanName = rawName.replace(/\s{2,}.*$/, '').trim().toLowerCase()
  cpByName.set(cleanName, cp)
  if (nif) cpByNif.set(nif.toLowerCase(), cp)
}
console.log(`Filas del Excel con CP: ${cpByName.size}`)

// 3) Cargar leads de DB
const { data: leads, error: leadsErr } = await supa
  .from('companies')
  .select('id, name, vat_number, billing_address')
  .eq('workspace_id', WORKSPACE_ID)
  .eq('account_type', 'lead')
  .is('deleted_at', null)
  .range(0, 9999)
if (leadsErr) { console.error('Error leyendo leads:', leadsErr); process.exit(1) }
console.log(`Leads en DB: ${leads.length}`)

// 4) Calcular updates
let willUpdate = 0
let alreadyHadProvince = 0
let noCP = 0
const updates = []

for (const lead of leads) {
  const ba = lead.billing_address || {}
  if (ba.state && String(ba.state).trim()) { alreadyHadProvince++; continue }

  // Try DB postal_code, then DB city ("ABRERA 08630"), then Excel mapping
  let cp = ba.postal_code ? String(ba.postal_code).trim() : ''
  if (!cp) cp = extractCP(ba.city) || ''
  if (!cp) {
    const nameKey = (lead.name || '').toLowerCase().trim()
    const nifKey = (lead.vat_number || '').toLowerCase().trim()
    cp = (nifKey && cpByNif.get(nifKey)) || cpByName.get(nameKey) || ''
    if (!cp) {
      // fuzzy match
      for (const [k, v] of cpByName) {
        if (k && (k.includes(nameKey) || nameKey.includes(k))) { cp = v; break }
      }
    }
  }

  if (!cp) { noCP++; continue }
  const province = provinciaFromCP(cp)
  if (!province) { noCP++; continue }

  willUpdate++
  updates.push({
    id: lead.id,
    billing_address: { ...ba, state: province, postal_code: ba.postal_code || cp },
  })
}

console.log(`\nResumen:`)
console.log(`  Ya tenían provincia (sin tocar): ${alreadyHadProvince}`)
console.log(`  Se actualizarán (provincia + CP si falta): ${willUpdate}`)
console.log(`  Sin CP detectable: ${noCP}`)

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) {
  console.log('\nDRY-RUN — no se aplica ningún cambio. Quita --dry-run para ejecutar.')
  // Sample
  console.log('\nMuestra de 5 actualizaciones:')
  for (const u of updates.slice(0, 5)) {
    console.log(' ', u.billing_address)
  }
  process.exit(0)
}

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
