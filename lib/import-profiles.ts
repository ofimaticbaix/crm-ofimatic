import type { ImportProfile, ColumnMapping, ImportEntityType } from './import-types'

const STORAGE_KEY = 'crm_import_profiles'

function generateId(): string {
  return `prof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getProfiles(): ImportProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveProfile(
  name: string,
  entityType: ImportEntityType,
  mappings: ColumnMapping[],
  sourceColumns: string[]
): ImportProfile {
  const profiles = getProfiles()
  const profile: ImportProfile = {
    id: generateId(),
    name,
    entityType,
    mappings: mappings.filter(m => m.targetField !== null),
    sourceColumns,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  profiles.push(profile)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  return profile
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

export function incrementProfileUsage(id: string): void {
  const profiles = getProfiles()
  const profile = profiles.find(p => p.id === id)
  if (profile) {
    profile.usageCount++
    profile.updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  }
}

// Buscar perfiles con >50% de columnas coincidentes
export function findMatchingProfiles(
  sourceColumns: string[],
  entityType?: ImportEntityType
): ImportProfile[] {
  const profiles = getProfiles()
  const normalizedColumns = new Set(sourceColumns.map(c => c.toLowerCase().trim()))

  return profiles
    .filter(profile => {
      // Filtrar por tipo de entidad si se especifica
      if (entityType && profile.entityType !== entityType) return false

      // Calcular coincidencia de columnas
      const profileColumns = profile.sourceColumns.map(c => c.toLowerCase().trim())
      const matchCount = profileColumns.filter(c => normalizedColumns.has(c)).length
      const matchRatio = matchCount / profileColumns.length

      return matchRatio > 0.5
    })
    .sort((a, b) => b.usageCount - a.usageCount)
}

// Aplicar mapeo de un perfil guardado a columnas actuales
export function applyProfile(
  profile: ImportProfile,
  currentColumns: string[],
  rawData: Record<string, string>[]
): ColumnMapping[] {
  const normalizedCurrentColumns = currentColumns.map(c => c.toLowerCase().trim())

  return currentColumns.map(column => {
    const normalizedColumn = column.toLowerCase().trim()

    // Buscar el mapeo correspondiente en el perfil
    const profileMapping = profile.mappings.find(m =>
      m.sourceColumn.toLowerCase().trim() === normalizedColumn
    )

    const sampleValues = rawData
      .slice(0, 5)
      .map(row => row[column] || '')
      .filter(v => v.trim())

    if (profileMapping) {
      return {
        sourceColumn: column,
        targetField: profileMapping.targetField,
        confidence: 90, // Alta confianza por ser perfil guardado
        sampleValues,
        isCustomField: profileMapping.isCustomField,
      }
    }

    return {
      sourceColumn: column,
      targetField: null,
      confidence: 0,
      sampleValues,
      isCustomField: false,
    }
  })
}
