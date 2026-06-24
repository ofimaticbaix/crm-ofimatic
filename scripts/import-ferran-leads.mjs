// Importa leads de "CLIENTES POTENCIALES. 1.xlsx" al workspace de Ferran.
// Protege customers activos. Limpia nombres con anotaciones. Auto-detecta tags.
// Modo dry-run por defecto — añadir --apply para ejecutar cambios reales.

import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = !process.argv.includes('--apply')
const FERRAN_EMAIL = 'fpons@metalher.es'
const FILE = './CLIENTES POTENCIALES. 1.xlsx'

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: users } = await supa.auth.admin.listUsers()
const ferran = users.users.find(u => u.email === FERRAN_EMAIL)
const { data: mem } = await supa.from('memberships').select('workspace_id').eq('user_id', ferran.id).limit(1).single()
const WS = mem.workspace_id
console.log(`Workspace: ${WS}\nModo: ${DRY_RUN ? 'DRY RUN (sin cambios)' : 'APPLY (cambios reales)'}\n`)

const wb = XLSX.readFile(FILE)
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
const data = rows.slice(5).filter(r => (r[0] || '').toString().trim())
console.log(`Filas a procesar: ${data.length}`)

// Limpieza: separa nombre de nota si hay 2+ espacios
function splitNameAndNote(raw) {
  const s = (raw || '').toString().trim()
  const m = s.match(/^(.*?)\s{2,}(.+)$/)
  if (m) return { name: m[1].trim(), note: m[2].trim() }
  return { name: s, note: '' }
}

// Auto-tag desde la nota
function autoTag(note) {
  const u = note.toUpperCase()
  if (/NO\s+LES?\s+INTERESA|NO\s+INTERESA/.test(u)) return 'no_interesa'
  if (/^VISITAR/.test(u) || /\bVISITAR\b/.test(u)) return 'visitar'
  if (/^CLIENTE\b/.test(u)) return 'cliente'
  return null
}

// Detecta si la nota indica "empresa ya no existe" para soft-delete
function shouldSoftDelete(note) {
  return /NO\s+EXISTE|CERRADO|NO\s+TIENE\s+ACTIVIDAD/i.test(note)
}

// Parsea "ABRERA 08630" → { city: "ABRERA", postal: "08630" }
function splitPoblacion(p) {
  const s = (p || '').toString().trim()
  const m = s.match(/^(.+?)\s+(\d{4,5})$/)
  if (m) return { city: m[1].trim(), postal: m[2].trim() }
  return { city: s, postal: '' }
}

// Excel date serial → ISO
function excelDate(v) {
  if (!v) return null
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const n = Number(v)
  if (!isFinite(n) || n < 1000) return null
  const d = new Date((n - 25569) * 86400000)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

// Pre-cargar customers para protegerlos
const { data: existingCustomers } = await supa
  .from('companies')
  .select('id, vat_number, name')
  .eq('workspace_id', WS).eq('account_type', 'customer').is('deleted_at', null)
const customerVats = new Set(existingCustomers.filter(c => c.vat_number).map(c => c.vat_number.trim()))
const customerNames = new Set(existingCustomers.map(c => (c.name || '').trim().toLowerCase()))
console.log(`Customers activos a proteger: ${existingCustomers.length}\n`)

const stats = { protected: 0, updated: 0, restored: 0, created: 0, softDeleted: 0, skipped: 0, errors: 0 }
const protectedList = []
const errorList = []

for (const r of data) {
  try {
    const rawName = (r[0] || '').toString().trim()
    const { name, note } = splitNameAndNote(rawName)
    const vat = (r[7] || '').toString().trim()
    if (!name) { stats.skipped++; continue }

    // Protección: si NIF ya es customer, no tocar
    if (vat && customerVats.has(vat)) {
      stats.protected++
      protectedList.push({ name, vat, reason: 'NIF ya es customer' })
      continue
    }
    // Protección: si sin NIF pero nombre coincide con customer, tampoco
    if (!vat && customerNames.has(name.toLowerCase())) {
      stats.protected++
      protectedList.push({ name, reason: 'Nombre coincide con customer existente' })
      continue
    }

    const { city, postal } = splitPoblacion(r[2])
    const tag = autoTag(note)
    const shouldDelete = shouldSoftDelete(note)

    const cf = {
      contacto: (r[10] || '').toString().trim() || undefined,
      telefono_2: (r[4] || '').toString().trim() || undefined,  // segundo teléfono
      email_2: (r[6] || '').toString().trim() || undefined,
      fecha_actualizacion: excelDate(r[9]) || undefined,
      lead_note: note || undefined,
      lead_tag: tag || undefined,
    }
    Object.keys(cf).forEach(k => cf[k] === undefined && delete cf[k])

    const basePayload = {
      workspace_id: WS,
      name,
      vat_number: vat || null,
      phone: (r[3] || '').toString().trim() || null,  // primer teléfono
      email: (r[5] || '').toString().trim() || null,  // mail compras
      website: (r[8] || '').toString().trim() || null,
      account_type: 'lead',
      account_status: 'active',
      billing_address: { city: city || null, postal_code: postal || null, country: 'España' },
      updated_at: new Date().toISOString(),
    }
    if (shouldDelete) {
      basePayload.deleted_at = new Date().toISOString()
    } else {
      basePayload.deleted_at = null
    }

    // Buscar existente por VAT (preferido) o nombre
    let existing = null
    if (vat) {
      const { data } = await supa.from('companies').select('id, custom_fields, deleted_at, account_type')
        .eq('workspace_id', WS).eq('vat_number', vat).order('deleted_at', { nullsFirst: true }).limit(1).maybeSingle()
      existing = data
    }
    if (!existing) {
      const { data } = await supa.from('companies').select('id, custom_fields, deleted_at, account_type')
        .eq('workspace_id', WS).ilike('name', name).limit(1).maybeSingle()
      existing = data
    }

    if (existing) {
      // Si es customer → skip (protegido)
      if (existing.account_type === 'customer' && !existing.deleted_at) {
        stats.protected++
        protectedList.push({ name, vat, reason: 'Customer activo detectado por búsqueda' })
        continue
      }

      const mergedCF = { ...(existing.custom_fields || {}), ...cf }
      delete mergedCF.manual_status

      if (DRY_RUN) {
        if (existing.deleted_at) stats.restored++
        else stats.updated++
        if (shouldDelete) stats.softDeleted++
      } else {
        const { error } = await supa.from('companies').update({ ...basePayload, custom_fields: mergedCF }).eq('id', existing.id)
        if (error) { stats.errors++; errorList.push({ name, err: error.message }); continue }
        if (existing.deleted_at) stats.restored++
        else stats.updated++
        if (shouldDelete) stats.softDeleted++
      }
    } else {
      if (DRY_RUN) {
        stats.created++
        if (shouldDelete) stats.softDeleted++
      } else {
        const { error } = await supa.from('companies').insert({ ...basePayload, custom_fields: cf })
        if (error) { stats.errors++; errorList.push({ name, err: error.message }); continue }
        stats.created++
        if (shouldDelete) stats.softDeleted++
      }
    }
  } catch (e) {
    stats.errors++
    errorList.push({ name: r[0], err: String(e) })
  }
}

console.log('=== RESUMEN ===')
console.log('Protegidos (customers no tocados):', stats.protected)
console.log('Actualizados (ya existían como lead):', stats.updated)
console.log('Restaurados (eran soft-deleted):', stats.restored)
console.log('Creados nuevos:', stats.created)
console.log('Soft-deleted (NO EXISTE / CERRADO):', stats.softDeleted)
console.log('Saltados:', stats.skipped)
console.log('Errores:', stats.errors)
console.log(`\nTotal procesado: ${stats.protected + stats.updated + stats.restored + stats.created + stats.skipped}`)

if (protectedList.length) {
  console.log('\n--- Primeros 10 protegidos ---')
  protectedList.slice(0, 10).forEach(p => console.log('-', p.name, p.vat || '', '|', p.reason))
}
if (errorList.length) {
  console.log('\n--- Primeros 5 errores ---')
  errorList.slice(0, 5).forEach(e => console.log('-', e.name, ':', e.err))
}

console.log(DRY_RUN ? '\n⚠️  DRY RUN — ningún cambio aplicado. Ejecuta con --apply para efectuar los cambios.' : '\n✅ Cambios aplicados.')
