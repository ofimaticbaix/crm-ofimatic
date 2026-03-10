import type { ColumnMapping, ImportEntityType, ValidationError } from './import-types'
import { getFieldsForEntityType } from './import-fields'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NIF_REGEX = /^[A-Z]\d{7}[A-Z0-9]$|^\d{8}[A-Z]$/i

// Parsear número con soporte para formato europeo (comas decimales)
function parseEuropeanNumber(value: string): number | null {
  if (!value || !value.trim()) return null
  // Quitar símbolo de euro y espacios
  let cleaned = value.replace(/[€\s]/g, '')
  // Detectar formato europeo: 1.234,56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Si el punto viene antes de la coma, es separador de miles
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastDot < lastComma) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    // Solo coma: podría ser decimal europeo
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

export function validateImportData(
  data: Record<string, string>[],
  mappings: ColumnMapping[],
  entityType: ImportEntityType
): ValidationError[] {
  const errors: ValidationError[] = []
  const fields = getFieldsForEntityType(entityType)
  const activeMappings = mappings.filter(m => m.targetField !== null)

  // 1. Validar que campos obligatorios estén mapeados
  const mappedFieldKeys = new Set(activeMappings.map(m => m.targetField))
  for (const field of fields) {
    if (field.required && !mappedFieldKeys.has(field.key)) {
      errors.push({
        row: -1, // -1 = error global
        column: field.key,
        message: `Campo obligatorio "${field.label}" no está mapeado`,
        severity: 'error',
      })
    }
  }

  // 2. Validar cada fila
  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx]

    for (const mapping of activeMappings) {
      if (!mapping.targetField) continue
      const field = fields.find(f => f.key === mapping.targetField)
      if (!field) continue

      const value = row[mapping.sourceColumn]?.trim() || ''

      // Campo obligatorio vacío
      if (field.required && !value) {
        errors.push({
          row: rowIdx,
          column: mapping.sourceColumn,
          message: `"${field.label}" es obligatorio y está vacío`,
          severity: 'error',
        })
        continue
      }

      if (!value) continue // no validar campos opcionales vacíos

      // Validar por tipo
      switch (field.type) {
        case 'email':
          if (!EMAIL_REGEX.test(value)) {
            errors.push({
              row: rowIdx,
              column: mapping.sourceColumn,
              message: `Email inválido: "${value}"`,
              severity: 'warning',
            })
          }
          break

        case 'number':
          if (parseEuropeanNumber(value) === null) {
            errors.push({
              row: rowIdx,
              column: mapping.sourceColumn,
              message: `Valor numérico inválido: "${value}"`,
              severity: 'error',
            })
          }
          break

        case 'nif':
          if (!NIF_REGEX.test(value.replace(/[\s\-]/g, ''))) {
            errors.push({
              row: rowIdx,
              column: mapping.sourceColumn,
              message: `NIF/CIF con formato inválido: "${value}"`,
              severity: 'warning',
            })
          }
          break
      }
    }
  }

  return errors
}

export function getValidationSummary(errors: ValidationError[]) {
  const globalErrors = errors.filter(e => e.row === -1)
  const rowErrors = errors.filter(e => e.row !== -1 && e.severity === 'error')
  const rowWarnings = errors.filter(e => e.row !== -1 && e.severity === 'warning')
  const errorRows = new Set(rowErrors.map(e => e.row))
  const warningRows = new Set(rowWarnings.map(e => e.row))

  return {
    globalErrors,
    totalErrors: rowErrors.length,
    totalWarnings: rowWarnings.length,
    rowsWithErrors: errorRows.size,
    rowsWithWarnings: warningRows.size,
    hasBlockingErrors: globalErrors.some(e => e.severity === 'error'),
  }
}
