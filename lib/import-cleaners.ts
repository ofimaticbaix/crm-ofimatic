// Limpieza automática de datos antes de insertar en Supabase

const NULL_VALUES = new Set(['', 'nan', 'NaN', 'null', 'NULL', 'none', 'None', 'NONE', '-', '--', 'N/A', 'n/a', 'undefined'])

/** Convierte valores nulos comunes a null */
export function cleanNullValue(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (NULL_VALUES.has(trimmed)) return null
  return trimmed
}

/** Trim de espacios en todos los campos */
export function cleanTrim(value: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed || null
}

/**
 * Teléfonos: quitar ".0" si viene como flotante, quitar espacios y guiones
 * 937561249.0 → 937561249
 */
export function cleanPhone(value: string | null): string | null {
  if (value == null) return null
  let cleaned = value.trim()
  if (!cleaned || NULL_VALUES.has(cleaned)) return null

  // Quitar .0 de flotantes (Excel suele hacer esto)
  cleaned = cleaned.replace(/\.0+$/, '')

  // Quitar espacios, guiones, paréntesis, puntos
  cleaned = cleaned.replace(/[\s\-\.\(\)]/g, '')

  // Si quedó vacío o no parece teléfono
  if (!cleaned || !/^\+?\d{6,15}$/.test(cleaned)) {
    // Devolver el original limpio si tiene al menos dígitos
    const digits = value.replace(/\D/g, '')
    return digits.length >= 6 ? digits : null
  }

  return cleaned
}

/** Emails: minúsculas, validar formato */
export function cleanEmail(value: string | null): string | null {
  if (value == null) return null
  let cleaned = value.trim().toLowerCase()
  if (!cleaned || NULL_VALUES.has(cleaned)) return null

  // Validar formato básico
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return cleaned
  }
  return null // Email inválido → null
}

/**
 * Código Postal: siempre string, preservar ceros iniciales
 * 8630 → "08630", 08630 → "08630"
 */
export function cleanPostalCode(value: string | null): string | null {
  if (value == null) return null
  let cleaned = value.trim()
  if (!cleaned || NULL_VALUES.has(cleaned)) return null

  // Quitar .0 de flotantes
  cleaned = cleaned.replace(/\.0+$/, '')

  // Solo dígitos
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return null

  // Pad a 5 dígitos para códigos postales españoles
  if (digits.length <= 5) {
    return digits.padStart(5, '0')
  }

  return digits
}

/** NIF/CIF: trim y mayúsculas */
export function cleanNif(value: string | null): string | null {
  if (value == null) return null
  let cleaned = value.trim()
  if (!cleaned || NULL_VALUES.has(cleaned)) return null

  // Quitar espacios y guiones internos
  cleaned = cleaned.replace(/[\s\-]/g, '').toUpperCase()

  return cleaned || null
}

/**
 * Fechas: parsear DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY → ISO 8601
 */
export function cleanDate(value: string | null): string | null {
  if (value == null) return null
  let cleaned = value.trim()
  if (!cleaned || NULL_VALUES.has(cleaned)) return null

  // Si ya es un número serial de Excel (días desde 1900)
  const num = Number(cleaned)
  if (!isNaN(num) && num > 10000 && num < 100000) {
    const excelEpoch = new Date(1899, 11, 30) // Excel epoch
    const date = new Date(excelEpoch.getTime() + num * 86400000)
    return date.toISOString().split('T')[0]
  }

  // YYYY-MM-DD (ya está en formato ISO)
  if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split(/[-\/]/)
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  }

  // DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  if (/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split(/[-\/\.]/)
    let year = parseInt(y)
    if (year < 100) year += year > 50 ? 1900 : 2000
    const date = new Date(year, parseInt(m) - 1, parseInt(d))
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  }

  return null
}

/** Números: parsear formato europeo (1.234,56) */
export function cleanNumber(value: string | null): number | null {
  if (value == null) return null
  let cleaned = value.trim()
  if (!cleaned || NULL_VALUES.has(cleaned)) return null

  // Quitar símbolo de euro y espacios
  cleaned = cleaned.replace(/[€$\s]/g, '')

  // Quitar .0 de flotantes enteros
  cleaned = cleaned.replace(/\.0+$/, '')

  // Detectar formato europeo: 1.234,56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastDot < lastComma) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/** Texto genérico: trim + null values */
export function cleanText(value: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed || NULL_VALUES.has(trimmed)) return null
  return trimmed
}

// ==========================================
// Limpiar una fila completa según el tipo de campo
// ==========================================

import type { FieldDefinition } from './import-types'

export interface CleanedRow {
  data: Record<string, any>
  customFields: Record<string, string>
}

export function cleanRow(
  rawRow: Record<string, string>,
  mappings: { sourceColumn: string; targetField: string | null; isCustomField: boolean }[],
  fieldDefinitions: FieldDefinition[]
): CleanedRow {
  const data: Record<string, any> = {}
  const customFields: Record<string, string> = {}

  for (const mapping of mappings) {
    if (!mapping.targetField) continue

    const rawValue = rawRow[mapping.sourceColumn] ?? ''

    if (mapping.isCustomField || mapping.targetField === '__custom__') {
      const cleaned = cleanText(rawValue)
      if (cleaned) customFields[mapping.sourceColumn] = cleaned
      continue
    }

    const field = fieldDefinitions.find(f => f.key === mapping.targetField)
    if (!field) {
      data[mapping.targetField] = cleanText(rawValue)
      continue
    }

    switch (field.type) {
      case 'email':
        data[mapping.targetField] = cleanEmail(rawValue)
        break
      case 'phone':
        data[mapping.targetField] = cleanPhone(rawValue)
        break
      case 'nif':
        data[mapping.targetField] = cleanNif(rawValue)
        break
      case 'date':
        data[mapping.targetField] = cleanDate(rawValue)
        break
      case 'number':
        data[mapping.targetField] = cleanNumber(rawValue)
        break
      case 'url':
        data[mapping.targetField] = cleanText(rawValue)
        break
      case 'text':
      default:
        // Postal code detection by field key
        if (mapping.targetField === 'postal_code' || mapping.targetField === 'cp') {
          data[mapping.targetField] = cleanPostalCode(rawValue)
        } else {
          data[mapping.targetField] = cleanText(rawValue)
        }
        break
    }
  }

  return { data, customFields }
}
