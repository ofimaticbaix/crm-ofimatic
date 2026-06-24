// Restaura los 184 clientes del Excel de Ferran como customer activos,
// con datos correctos y descartando duplicados soft-deleted que vuelven a la vida.

import 'dotenv/config'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const FERRAN_EMAIL = 'fpons@metalher.es'
const FILE = './Actualizado clientes 19-03-2026 (1).xls'

if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

// 1) Resolver workspace de Ferran
const { data: membership, error: memErr } = await supa
  .from('memberships')
  .select('workspace_id, users:user_id(email)')
  .limit(1000)
if (memErr) { console.error('Error memberships:', memErr); process.exit(1) }

// Supabase no devuelve users anidado por auth.users, buscamos por otro lado:
const { data: users } = await supa.auth.admin.listUsers()
const ferran = users?.users?.find(u => u.email === FERRAN_EMAIL)
if (!ferran) { console.error('No encuentro usuario fpons@metalher.es'); process.exit(1) }

const ferranMem = membership.find(m => m.workspace_id && membership.some(mm => mm.workspace_id === m.workspace_id)) // fallback
const { data: memDirect } = await supa.from('memberships').select('workspace_id').eq('user_id', ferran.id).limit(1).single()
const WORKSPACE_ID = memDirect.workspace_id
console.log('Workspace de Ferran:', WORKSPACE_ID)

// 2) Leer Excel
const wb = XLSX.readFile(FILE)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
const dataRows = rows.slice(9).filter(r => (r[1] || '').toString().trim() && (r[6] || '').toString().trim())
console.log(`Excel: ${dataRows.length} filas con datos`)

// 3) Convertir fecha Excel serial a ISO si aplica
function excelDateToISO(val) {
  if (!val) return null
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  const n = Number(val)
  if (!isFinite(n) || n < 1000) return null
  // Excel serial to JS Date: days since 1900-01-01 (with leap year bug)
  const ms = (n - 25569) * 86400 * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

// 4) Procesar fila a fila
let created = 0, restored = 0, updated = 0, errors = 0
const errorLog = []

for (const r of dataRows) {
  const row = {
    codigo: (r[0] || '').toString().trim(),
    name: (r[1] || '').toString().trim(),
    street: (r[2] || '').toString().trim(),
    postal_code: (r[3] || '').toString().trim(),
    city: (r[4] || '').toString().trim(),
    province: (r[5] || '').toString().trim(),
    vat: (r[6] || '').toString().trim(),
    contacto: (r[7] || '').toString().trim(),
    phone: (r[8] || '').toString().trim(),
    mobile: (r[9] || '').toString().trim(),
    last_purchase: excelDateToISO(r[10]),
    forma_pago: (r[11] || '').toString().trim(),
    email: (r[12] || '').toString().trim(),
    email_2: (r[13] || '').toString().trim(),
    email_3: (r[15] || '').toString().trim(),
    email_4: (r[16] || '').toString().trim(),
  }
  if (!row.name || !row.vat) continue

  // Buscar por VAT en este workspace (incluido soft-deleted)
  const { data: existing, error: findErr } = await supa
    .from('companies')
    .select('id, name, account_type, custom_fields, deleted_at')
    .eq('workspace_id', WORKSPACE_ID)
    .eq('vat_number', row.vat)
    .order('deleted_at', { ascending: true, nullsFirst: true }) // activos primero, luego deleted
    .limit(5)

  if (findErr) { console.error('findErr', row.vat, findErr.message); errors++; continue }

  const customFields = {
    codigo_cliente: row.codigo || undefined,
    contacto: row.contacto || undefined,
    telefono_2: row.mobile || undefined,
    ultima_compra: row.last_purchase || undefined,
    forma_pago: row.forma_pago || undefined,
    email_2: row.email_2 || undefined,
    email_3: row.email_3 || undefined,
    email_4: row.email_4 || undefined,
  }
  // Clean undefined
  Object.keys(customFields).forEach(k => customFields[k] === undefined && delete customFields[k])

  const companyPayload = {
    workspace_id: WORKSPACE_ID,
    name: row.name,
    vat_number: row.vat,
    phone: row.phone || null,
    email: row.email || null,
    account_type: 'customer',
    account_status: 'active',
    billing_address: {
      street: row.street || null,
      city: row.city || null,
      postal_code: row.postal_code || null,
      state: row.province || null,
      country: 'España',
    },
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }

  if (existing && existing.length > 0) {
    // Preferir actualizar la fila activa si existe, sino la más reciente deleted
    const target = existing.find(e => !e.deleted_at) || existing[0]
    const mergedCF = { ...(target.custom_fields || {}), ...customFields }
    // Quitar manual_status (que forzaba a inactive/closed por error)
    delete mergedCF.manual_status
    // Limpiar import_note si coincide con el nombre bueno
    if (mergedCF.import_note && row.name.toLowerCase() === target.name?.toLowerCase()?.split('  ')[0]) {
      // no tocar
    }

    const { error: upErr } = await supa
      .from('companies')
      .update({ ...companyPayload, custom_fields: mergedCF })
      .eq('id', target.id)
    if (upErr) { console.error('upErr', row.vat, upErr.message); errorLog.push({vat: row.vat, err: upErr.message}); errors++; continue }

    if (target.deleted_at) restored++
    else updated++
  } else {
    // Crear
    const { error: insErr } = await supa
      .from('companies')
      .insert({ ...companyPayload, custom_fields: customFields })
    if (insErr) { console.error('insErr', row.vat, insErr.message); errorLog.push({vat: row.vat, err: insErr.message}); errors++; continue }
    created++
  }
}

console.log('\\n=== RESULTADO ===')
console.log('Actualizados (ya activos):', updated)
console.log('Restaurados (venían soft-deleted):', restored)
console.log('Creados nuevos:', created)
console.log('Errores:', errors)
if (errorLog.length) console.log('Lista de errores:', errorLog.slice(0, 20))
