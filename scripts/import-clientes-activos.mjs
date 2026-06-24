#!/usr/bin/env node
/**
 * Script para importar el Excel "Actualizado clientes 19-03-2026.xls"
 * en la tabla companies con account_type = 'customer'
 */

import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://viupowwpfrkumdvapjdq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Get workspace_id from first workspace
async function getWorkspaceId() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .limit(1)
    .single()
  if (error) throw new Error(`No workspace found: ${error.message}`)
  return data.id
}

// Get owner user id
async function getUserId() {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw new Error(`No users: ${error.message}`)
  return data.users[0]?.id
}

// Convert Excel serial date to ISO string (YYYY-MM-DD)
function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return null
  const epoch = new Date(1899, 11, 30)
  const date = new Date(epoch.getTime() + serial * 86400000)
  return date.toISOString().split('T')[0]
}

// Clean phone: keep only digits and leading +
function cleanPhone(val) {
  if (!val) return null
  const s = String(val).trim()
  if (!s) return null
  return s
}

// Clean string
function clean(val) {
  if (val == null) return null
  const s = String(val).trim()
  return s || null
}

async function main() {
  const filePath = process.argv[2] || 'C:/Users/Alex/Downloads/Actualizado clientes 19-03-2026.xls'

  console.log(`Reading: ${filePath}`)
  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Header is at row index 8
  const HEADER_ROW = 8
  const headers = rows[HEADER_ROW]
  console.log('Headers:', headers)

  // Data starts at row 9
  const dataRows = rows.slice(HEADER_ROW + 1).filter(r => {
    // Skip empty rows and special rows (9999, VARIOS)
    const code = r[0]
    if (!code && !r[1]) return false
    if (String(code) === '9999' || String(code) === 'VARIOS') return false
    // Must have a company name
    return !!r[1]
  })

  console.log(`Found ${dataRows.length} data rows`)

  const workspaceId = await getWorkspaceId()
  const userId = await getUserId()
  console.log(`Workspace: ${workspaceId}, User: ${userId}`)

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const row of dataRows) {
    const code = clean(row[0])
    const name = clean(row[1])
    const address = clean(row[2])
    const postalCode = clean(row[3])
    const city = clean(row[4])
    const province = clean(row[5])
    const vat = clean(row[6])
    const contact = clean(row[7])
    const phone = cleanPhone(row[8])
    const mobile = cleanPhone(row[9])
    const lastPurchase = excelDateToISO(row[10])
    const paymentMethod = clean(row[11])
    const email1 = clean(row[12])
    const email2 = clean(row[13])
    const email3 = clean(row[14])
    const email4 = clean(row[15])
    const email5 = clean(row[16])

    if (!name) continue

    // Build billing address
    const billingAddress = {}
    if (address) billingAddress.street = address
    if (city) billingAddress.city = city
    if (postalCode) billingAddress.postal_code = String(postalCode)
    if (province) billingAddress.state = province

    // Build custom fields
    const customFields = {}
    if (code) customFields.codigo_cliente = code
    if (contact) customFields.contacto = contact
    if (mobile) customFields.telefono_2 = String(mobile)
    if (lastPurchase) customFields.ultima_compra = lastPurchase
    if (paymentMethod) customFields.forma_pago = paymentMethod
    if (email2) customFields.email_2 = email2
    if (email3) customFields.email_3 = email3
    if (email4) customFields.email_4 = email4
    if (email5) customFields.email_5 = email5

    const companyData = {
      workspace_id: workspaceId,
      name: name,
      account_type: 'customer',
      account_status: 'active',
      phone: phone ? String(phone) : null,
      email: email1 || null,
      vat_number: vat || null,
      billing_address: Object.keys(billingAddress).length > 0 ? billingAddress : null,
      custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
      created_by_id: userId,
      owner_id: userId,
    }

    // Check for duplicate by NIF or name
    let existingId = null
    if (vat) {
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('vat_number', vat)
        .is('deleted_at', null)
        .limit(1)
        .single()
      if (existing) existingId = existing.id
    }

    if (!existingId) {
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('workspace_id', workspaceId)
        .ilike('name', name)
        .is('deleted_at', null)
        .limit(1)
        .single()
      if (existing) existingId = existing.id
    }

    if (existingId) {
      // Update existing
      const { error } = await supabase
        .from('companies')
        .update({
          ...companyData,
          updated_by_id: userId,
        })
        .eq('id', existingId)

      if (error) {
        console.error(`FAIL update "${name}":`, error.message)
        failed++
      } else {
        updated++
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('companies')
        .insert(companyData)

      if (error) {
        console.error(`FAIL insert "${name}":`, error.message)
        failed++
      } else {
        inserted++
      }
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Updated: ${updated}, Failed: ${failed}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
