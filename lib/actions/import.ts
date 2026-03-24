'use server'

import { createClient } from '@/lib/supabase/server'
import type { DuplicateStrategy, DuplicateDetection, DefaultAccountType } from '@/lib/import-types'

// ==========================================
// Tipos para el batch import
// ==========================================

interface ImportCompanyRow {
  name: string
  vat_number?: string | null
  website?: string | null
  industry?: string | null
  company_size?: string | null
  phone?: string | null
  phone_2?: string | null
  email?: string | null
  email_2?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  province?: string | null
  account_type?: string | null
  description?: string | null
  contact_name?: string | null
  payment_method?: string | null
  code?: string | null
  last_purchase_date?: string | null
  custom_fields?: Record<string, string> | null
}

interface ImportContactRow {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  job_title?: string | null
  company_name?: string | null
  linkedin_url?: string | null
  lead_source?: string | null
  department?: string | null
  notes?: string | null
  custom_fields?: Record<string, string> | null
}

interface BatchResult {
  inserted: number
  updated: number
  skipped: number
  failed: number
  failedRows: { row: number; data: Record<string, string>; error: string }[]
}

// ==========================================
// Helper: separar campos DB vs custom_fields
// Campos que no existen en la tabla companies van a custom_fields
// ==========================================

const COMPANY_DB_COLUMNS = new Set([
  'name', 'vat_number', 'website', 'industry', 'company_size',
  'phone', 'email', 'account_type', 'account_status', 'description',
  'billing_address', 'shipping_address', 'linkedin_url', 'owner_id',
  'health_score', 'annual_revenue', 'founded_year', 'employees_exact',
])

function buildCompanyDbData(companyData: ImportCompanyRow): {
  dbData: Record<string, any>
  extraCustomFields: Record<string, string>
} {
  const dbData: Record<string, any> = {}
  const extraCustomFields: Record<string, string> = {}

  // Campos que van directo a la tabla
  if (companyData.vat_number) dbData.vat_number = companyData.vat_number
  if (companyData.website) dbData.website = companyData.website
  if (companyData.industry) dbData.industry = companyData.industry
  if (companyData.company_size) dbData.company_size = companyData.company_size
  if (companyData.phone) dbData.phone = companyData.phone
  if (companyData.email) dbData.email = companyData.email
  if (companyData.account_type) {
    // Map Spanish account types to valid English DB values
    const accountTypeMap: Record<string, string> = {
      'cliente': 'customer',
      'prospecto': 'prospect',
      'lead': 'lead',
      'socio': 'partner',
      'proveedor': 'supplier',
      // Already valid English values pass through
      'customer': 'customer',
      'prospect': 'prospect',
      'partner': 'partner',
      'supplier': 'supplier',
    }
    const mapped = accountTypeMap[companyData.account_type.toLowerCase().trim()]
    dbData.account_type = mapped || 'customer'
  }
  if (companyData.description) dbData.description = companyData.description

  // Construir billing_address
  const billingAddress: Record<string, string> = {}
  if (companyData.address) billingAddress.street = companyData.address
  if (companyData.city) billingAddress.city = companyData.city
  if (companyData.postal_code) billingAddress.postal_code = companyData.postal_code
  if (companyData.province) billingAddress.state = companyData.province
  if (Object.keys(billingAddress).length > 0) {
    dbData.billing_address = billingAddress
  }

  // Campos extra → custom_fields (no tienen columna propia en la tabla)
  if (companyData.contact_name) extraCustomFields.contacto = companyData.contact_name
  if (companyData.phone_2) extraCustomFields.telefono_2 = companyData.phone_2
  if (companyData.email_2) extraCustomFields.email_2 = companyData.email_2
  if ((companyData as any).email_3) extraCustomFields.email_3 = (companyData as any).email_3
  if ((companyData as any).email_4) extraCustomFields.email_4 = (companyData as any).email_4
  if ((companyData as any).email_5) extraCustomFields.email_5 = (companyData as any).email_5
  if (companyData.payment_method) extraCustomFields.forma_pago = companyData.payment_method
  if (companyData.code) extraCustomFields.codigo_cliente = companyData.code
  if (companyData.last_purchase_date) extraCustomFields.ultima_compra = companyData.last_purchase_date

  return { dbData, extraCustomFields }
}

// ==========================================
// Importar batch de empresas
// ==========================================

export async function importCompaniesBatch(
  workspaceId: string,
  rows: { index: number; data: ImportCompanyRow; rawData: Record<string, string> }[],
  config: {
    duplicateStrategy: DuplicateStrategy
    duplicateDetection: DuplicateDetection
    defaultAccountType: DefaultAccountType
  }
): Promise<BatchResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      inserted: 0, updated: 0, skipped: 0, failed: rows.length,
      failedRows: rows.map(r => ({ row: r.index, data: r.rawData, error: 'No autenticado' }))
    }
  }

  const result: BatchResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, failedRows: [] }

  for (const row of rows) {
    try {
      const companyData = row.data
      if (!companyData.name?.trim()) {
        result.skipped++
        continue
      }

      // Asignar account_type por defecto si no viene mapeado
      if (!companyData.account_type) {
        companyData.account_type = config.defaultAccountType
      }

      // Detectar duplicado
      let existingId: string | null = null

      if (config.duplicateStrategy !== 'import_anyway') {
        if (config.duplicateDetection === 'nif' && companyData.vat_number) {
          const { data: existing } = await supabase
            .from('companies')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('vat_number', companyData.vat_number)
            .is('deleted_at', null)
            .limit(1)
            .single()
          if (existing) existingId = existing.id
        } else if (config.duplicateDetection === 'name') {
          const { data: existing } = await supabase
            .from('companies')
            .select('id')
            .eq('workspace_id', workspaceId)
            .ilike('name', companyData.name.trim())
            .is('deleted_at', null)
            .limit(1)
            .single()
          if (existing) existingId = existing.id
        } else if (config.duplicateDetection === 'email' && companyData.email) {
          const { data: existing } = await supabase
            .from('companies')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('email', companyData.email)
            .is('deleted_at', null)
            .limit(1)
            .single()
          if (existing) existingId = existing.id
        }
      }

      if (existingId) {
        if (config.duplicateStrategy === 'skip') {
          result.skipped++
          continue
        }

        if (config.duplicateStrategy === 'update') {
          const { dbData, extraCustomFields } = buildCompanyDbData(companyData)
          const updateData: Record<string, any> = { updated_by_id: user.id }
          for (const [key, value] of Object.entries(dbData)) {
            if (value != null && value !== '') {
              updateData[key] = value
            }
          }
          // Merge custom_fields
          const allCustom = { ...extraCustomFields, ...(companyData.custom_fields || {}) }
          if (Object.keys(allCustom).length > 0) {
            updateData.custom_fields = allCustom
          }

          const { error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', existingId)

          if (error) {
            result.failed++
            result.failedRows.push({ row: row.index, data: row.rawData, error: error.message })
          } else {
            result.updated++
          }
          continue
        }
      }

      // Insertar nuevo
      const { dbData, extraCustomFields } = buildCompanyDbData(companyData)

      const insertData: Record<string, any> = {
        workspace_id: workspaceId,
        name: companyData.name.trim(),
        created_by_id: user.id,
        owner_id: user.id,
        ...dbData,
      }

      // Merge custom_fields con los extra
      const allCustom = { ...extraCustomFields, ...(companyData.custom_fields || {}) }
      if (Object.keys(allCustom).length > 0) {
        insertData.custom_fields = allCustom
      }

      const { error } = await supabase
        .from('companies')
        .insert(insertData)

      if (error) {
        result.failed++
        result.failedRows.push({ row: row.index, data: row.rawData, error: error.message })
      } else {
        result.inserted++
      }
    } catch (err: any) {
      result.failed++
      result.failedRows.push({
        row: row.index,
        data: row.rawData,
        error: err?.message || 'Error desconocido'
      })
    }
  }

  return result
}

// ==========================================
// Importar batch de contactos
// ==========================================

export async function importContactsBatch(
  workspaceId: string,
  rows: { index: number; data: ImportContactRow; rawData: Record<string, string> }[],
  config: {
    duplicateStrategy: DuplicateStrategy
    duplicateDetection: DuplicateDetection
    defaultAccountType: DefaultAccountType
  }
): Promise<BatchResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      inserted: 0, updated: 0, skipped: 0, failed: rows.length,
      failedRows: rows.map(r => ({ row: r.index, data: r.rawData, error: 'No autenticado' }))
    }
  }

  const result: BatchResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, failedRows: [] }

  for (const row of rows) {
    try {
      const contactData = row.data
      // Al menos first_name debe tener valor
      if (!contactData.first_name?.trim() && !contactData.last_name?.trim()) {
        result.skipped++
        continue
      }

      // Detectar duplicado
      let existingId: string | null = null

      if (config.duplicateStrategy !== 'import_anyway') {
        if (config.duplicateDetection === 'email' && contactData.email) {
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('email', contactData.email)
            .is('deleted_at', null)
            .limit(1)
            .single()
          if (existing) existingId = existing.id
        } else if (config.duplicateDetection === 'name') {
          const query = supabase
            .from('contacts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .is('deleted_at', null)
          if (contactData.first_name) query.ilike('first_name', contactData.first_name.trim())
          if (contactData.last_name) query.ilike('last_name', contactData.last_name.trim())
          const { data: existing } = await query.limit(1).single()
          if (existing) existingId = existing.id
        }
      }

      if (existingId) {
        if (config.duplicateStrategy === 'skip') {
          result.skipped++
          continue
        }

        if (config.duplicateStrategy === 'update') {
          const updateData: Record<string, any> = { updated_by_id: user.id }
          for (const [key, value] of Object.entries(contactData)) {
            if (value != null && value !== '' && key !== 'company_name') {
              updateData[key] = value
            }
          }
          delete updateData.company_name

          const { error } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', existingId)

          if (error) {
            result.failed++
            result.failedRows.push({ row: row.index, data: row.rawData, error: error.message })
          } else {
            result.updated++
          }
          continue
        }
      }

      // Insertar nuevo
      const insertData: Record<string, any> = {
        workspace_id: workspaceId,
        created_by_id: user.id,
        owner_id: user.id,
      }

      if (contactData.first_name) insertData.first_name = contactData.first_name.trim()
      if (contactData.last_name) insertData.last_name = contactData.last_name.trim()
      if (contactData.email) insertData.email = contactData.email
      if (contactData.phone) insertData.phone = contactData.phone
      if (contactData.mobile) insertData.mobile = contactData.mobile
      if (contactData.job_title) insertData.job_title = contactData.job_title
      if (contactData.linkedin_url) insertData.linkedin_url = contactData.linkedin_url
      if (contactData.lead_source) insertData.lead_source = contactData.lead_source
      if (contactData.department) insertData.department = contactData.department
      if (contactData.notes) insertData.notes = contactData.notes
      if (contactData.custom_fields && Object.keys(contactData.custom_fields).length > 0) {
        insertData.custom_fields = contactData.custom_fields
      }

      // Si hay company_name, buscar o crear la empresa
      if (contactData.company_name) {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('workspace_id', workspaceId)
          .ilike('name', contactData.company_name.trim())
          .is('deleted_at', null)
          .limit(1)
          .single()

        if (existingCompany) {
          insertData.company_id = existingCompany.id
        }
        // No crear empresa automáticamente - solo vincular si existe
      }

      const { error } = await supabase
        .from('contacts')
        .insert(insertData)

      if (error) {
        result.failed++
        result.failedRows.push({ row: row.index, data: row.rawData, error: error.message })
      } else {
        result.inserted++
      }
    } catch (err: any) {
      result.failed++
      result.failedRows.push({
        row: row.index,
        data: row.rawData,
        error: err?.message || 'Error desconocido'
      })
    }
  }

  return result
}

// ==========================================
// Contar duplicados (para preview)
// ==========================================

export async function countDuplicates(
  workspaceId: string,
  entityType: 'contactos' | 'empresas',
  detection: DuplicateDetection,
  values: string[]
): Promise<number> {
  const supabase = await createClient()
  const table = entityType === 'empresas' ? 'companies' : 'contacts'
  let count = 0

  // Comprobar en lotes de 50
  for (let i = 0; i < values.length; i += 50) {
    const batch = values.slice(i, i + 50).filter(v => v?.trim())
    if (batch.length === 0) continue

    let field = 'name'
    if (detection === 'nif') field = 'vat_number'
    else if (detection === 'email') field = 'email'
    else if (detection === 'name') field = entityType === 'empresas' ? 'name' : 'first_name'

    const { count: matchCount } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in(field, batch)
      .is('deleted_at', null)

    count += matchCount || 0
  }

  return count
}
