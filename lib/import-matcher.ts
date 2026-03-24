import type { ColumnMapping, ImportEntityType } from './import-types'
import type { FieldDefinition } from './import-types'
import { getFieldsForEntityType } from './import-fields'

// Normalizar texto: minúsculas, sin acentos, sin caracteres especiales
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')    // reemplazar especiales por espacio
    .replace(/\s+/g, ' ')            // colapsar espacios
    .trim()
}

// Quitar sufijos numéricos: "Teléfono 1" → "telefono", "Email 2" → "email"
function stripNumericSuffix(text: string): string {
  return text.replace(/\s+\d+$/, '').trim()
}

// Quitar prefijos/sufijos comunes: "Últ. Compra" → "compra", etc.
function stripCommonPrefixes(text: string): string {
  return text
    .replace(/^(ult|ultimo|ultima|f|fecha)\s+/i, '')
    .trim()
}

// ==========================================
// CAPA 1: Match exacto por aliases (95%)
// ==========================================
function exactMatch(normalizedColumn: string, fields: FieldDefinition[]): { field: FieldDefinition, confidence: number } | null {
  // Intentar match directo primero
  for (const field of fields) {
    if (normalizedColumn === normalize(field.key)) {
      return { field, confidence: 95 }
    }
    for (const alias of field.aliases) {
      if (normalizedColumn === normalize(alias)) {
        return { field, confidence: 95 }
      }
    }
  }

  // Intentar sin sufijo numérico: "Teléfono 1" → "telefono"
  const withoutNumber = stripNumericSuffix(normalizedColumn)
  if (withoutNumber !== normalizedColumn) {
    for (const field of fields) {
      if (withoutNumber === normalize(field.key)) {
        return { field, confidence: 90 }
      }
      for (const alias of field.aliases) {
        if (withoutNumber === normalize(alias)) {
          return { field, confidence: 90 }
        }
      }
    }
  }

  // Intentar compactado (sin espacios): "c p" → "cp", "nif cif" → "nifcif"
  const compacted = normalizedColumn.replace(/\s/g, '')
  if (compacted !== normalizedColumn) {
    for (const field of fields) {
      for (const alias of field.aliases) {
        const compactedAlias = normalize(alias).replace(/\s/g, '')
        if (compacted === compactedAlias && compacted.length >= 2) {
          return { field, confidence: 90 }
        }
      }
    }
  }

  return null
}

// ==========================================
// CAPA 2: Substring/fuzzy (70-85%)
// ==========================================
function substringMatch(normalizedColumn: string, fields: FieldDefinition[]): { field: FieldDefinition, confidence: number } | null {
  let bestMatch: { field: FieldDefinition, confidence: number } | null = null

  // También probar sin sufijo numérico
  const variants = [normalizedColumn]
  const withoutNumber = stripNumericSuffix(normalizedColumn)
  if (withoutNumber !== normalizedColumn) variants.push(withoutNumber)

  for (const variant of variants) {
    for (const field of fields) {
      for (const alias of field.aliases) {
        const normalizedAlias = normalize(alias)

        // El alias está contenido en la columna
        if (variant.includes(normalizedAlias) && normalizedAlias.length >= 3) {
          const ratio = normalizedAlias.length / variant.length
          const confidence = Math.round(70 + (ratio * 15)) // 70-85
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { field, confidence }
          }
        }

        // La columna está contenida en el alias
        if (normalizedAlias.includes(variant) && variant.length >= 3) {
          const ratio = variant.length / normalizedAlias.length
          const confidence = Math.round(70 + (ratio * 15))
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { field, confidence }
          }
        }
      }
    }
  }

  return bestMatch
}

// ==========================================
// CAPA 3: Detección por valores (50-65%)
// ==========================================
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[\d\s\-\(\)]{7,15}$/,
  nif: /^[A-Z]\d{7}[A-Z0-9]$|^\d{8}[A-Z]$/i, // CIF o NIF español
  url: /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+/,
  date: /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})$/,
  number: /^[\d.,]+\s*€?$/,
  postalCode: /^\d{5}$/,
}

function detectPatternInValues(values: string[]): string | null {
  const nonEmpty = values.filter(v => v && v.trim())
  if (nonEmpty.length === 0) return null

  // Contar coincidencias por patrón
  const counts: Record<string, number> = {}
  for (const [patternName, regex] of Object.entries(PATTERNS)) {
    counts[patternName] = nonEmpty.filter(v => regex.test(v.trim())).length
  }

  // El patrón debe coincidir en al menos 40% de los valores
  const threshold = nonEmpty.length * 0.4
  let bestPattern: string | null = null
  let bestCount = 0

  for (const [pattern, count] of Object.entries(counts)) {
    if (count >= threshold && count > bestCount) {
      bestPattern = pattern
      bestCount = count
    }
  }

  return bestPattern
}

function patternToFieldType(pattern: string): string | null {
  switch (pattern) {
    case 'email': return 'email'
    case 'phone': return 'phone'
    case 'nif': return 'nif'
    case 'url': return 'url'
    case 'date': return 'date'
    case 'number': return 'number'
    default: return null
  }
}

function valueBasedMatch(values: string[], fields: FieldDefinition[]): { field: FieldDefinition, confidence: number } | null {
  const detectedPattern = detectPatternInValues(values)
  if (!detectedPattern) return null

  const fieldType = patternToFieldType(detectedPattern)
  if (!fieldType) return null

  // Buscar campos que coincidan con el tipo detectado
  const matchingFields = fields.filter(f => f.type === fieldType)
  if (matchingFields.length === 0) return null

  // Si solo hay un campo de ese tipo, es más confiable
  const confidence = matchingFields.length === 1 ? 65 : 50

  return { field: matchingFields[0], confidence }
}

// ==========================================
// ALGORITMO PRINCIPAL
// ==========================================
export function autoMapColumns(
  sourceColumns: string[],
  rawData: Record<string, string>[],
  entityType: ImportEntityType
): ColumnMapping[] {
  const fields = getFieldsForEntityType(entityType)
  const mappings: ColumnMapping[] = []
  const usedFields = new Set<string>()

  for (const column of sourceColumns) {
    const normalizedColumn = normalize(column)
    const sampleValues = rawData
      .slice(0, 5)
      .map(row => row[column] || '')
      .filter(v => v.trim())

    let mapping: ColumnMapping = {
      sourceColumn: column,
      targetField: null,
      confidence: 0,
      sampleValues,
      isCustomField: false,
    }

    // Capa 1: Match exacto
    const exact = exactMatch(normalizedColumn, fields.filter(f => !usedFields.has(f.key)))
    if (exact) {
      mapping.targetField = exact.field.key
      mapping.confidence = exact.confidence
      usedFields.add(exact.field.key)
      mappings.push(mapping)
      continue
    }

    // Capa 2: Substring
    const substring = substringMatch(normalizedColumn, fields.filter(f => !usedFields.has(f.key)))
    if (substring) {
      mapping.targetField = substring.field.key
      mapping.confidence = substring.confidence
      usedFields.add(substring.field.key)
      mappings.push(mapping)
      continue
    }

    // Capa 3: Por valores
    const valueBased = valueBasedMatch(sampleValues, fields.filter(f => !usedFields.has(f.key)))
    if (valueBased) {
      mapping.targetField = valueBased.field.key
      mapping.confidence = valueBased.confidence
      usedFields.add(valueBased.field.key)
      mappings.push(mapping)
      continue
    }

    // Sin match con campo CRM → auto-crear como campo personalizado
    // Toda columna con datos se importa, nunca se queda sin mapear
    const hasValues = sampleValues.length > 0
    if (hasValues) {
      mapping.targetField = '__custom__'
      mapping.confidence = 100
      mapping.isCustomField = true
    }
    mappings.push(mapping)
  }

  return mappings
}

// Obtener campos que no fueron mapeados
export function getUnmappedRequiredFields(
  mappings: ColumnMapping[],
  entityType: ImportEntityType
): FieldDefinition[] {
  const fields = getFieldsForEntityType(entityType)
  const mappedFields = new Set(mappings.map(m => m.targetField).filter(Boolean))
  return fields.filter(f => f.required && !mappedFields.has(f.key))
}
