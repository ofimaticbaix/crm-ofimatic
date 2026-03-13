'use server'

import { createClient } from '@/lib/supabase/server'

interface GeocodingResult {
  latitude: number
  longitude: number
  displayName: string
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
}

// Spanish address abbreviations to expand for better geocoding
const SPANISH_ABBREVIATIONS: Record<string, string> = {
  'c/': 'Calle',
  'c.': 'Calle',
  'ctra.': 'Carretera',
  'ctra': 'Carretera',
  'avda.': 'Avenida',
  'avda': 'Avenida',
  'av.': 'Avenida',
  'av': 'Avenida',
  'pza.': 'Plaza',
  'pza': 'Plaza',
  'pl.': 'Plaza',
  'pl': 'Plaza',
  'pº': 'Paseo',
  'p.º': 'Paseo',
  'rda.': 'Ronda',
  'rda': 'Ronda',
  'cno.': 'Camino',
  'cno': 'Camino',
  'pje.': 'Pasaje',
  'pje': 'Pasaje',
  'urb.': 'Urbanización',
  'urb': 'Urbanización',
  'pol.': 'Polígono',
  'pol': 'Polígono',
  'ind.': 'Industrial',
  'ind': 'Industrial',
  'nº': '',
  'núm.': '',
  'num.': '',
  'n.': '',
}

// Normalize Spanish addresses for better geocoding
function normalizeSpanishAddress(address: string): string {
  let normalized = address

  // Remove floor/door details that confuse geocoders
  // Examples: "Local 2º", "Piso 3", "Pta. 4", "Bajo", "Ático", "1º A"
  normalized = normalized.replace(/,?\s*(local|piso|pta\.?|puerta|bajo|ático|entresuelo|planta)\s*\d*[ºª]?\s*[a-z]?/gi, '')
  normalized = normalized.replace(/,?\s*\d+[ºª]\s*[a-z]?\s*(izq\.?|dcha\.?|izquierda|derecha|centro|ctr\.?)?/gi, '')

  // Expand abbreviations (case insensitive)
  for (const [abbrev, full] of Object.entries(SPANISH_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbrev.replace('.', '\\.')}\\s*`, 'gi')
    normalized = normalized.replace(regex, full ? `${full} ` : '')
  }

  // Clean up extra spaces and commas
  normalized = normalized.replace(/\s+/g, ' ')
  normalized = normalized.replace(/,\s*,/g, ',')
  normalized = normalized.replace(/^\s*,\s*/, '')
  normalized = normalized.replace(/\s*,\s*$/, '')
  normalized = normalized.trim()

  return normalized
}

// Extract street number from address
function extractStreetNumber(street: string): { streetName: string; number: string } {
  // Match patterns like "Carretera d'Esplugues, 42" or "Calle Mayor 15"
  const match = street.match(/^(.+?),?\s*(\d+)(?:\s*-\s*\d+)?(?:\s*,.*)?$/)
  if (match) {
    return { streetName: match[1].trim(), number: match[2] }
  }
  return { streetName: street, number: '' }
}

// Geocode using structured parameters (more precise)
async function geocodeStructured(params: {
  street?: string
  city?: string
  postalcode?: string
  state?: string
  country?: string
}): Promise<{ data: GeocodingResult | null; error: string | null }> {
  try {
    const searchParams = new URLSearchParams({
      format: 'json',
      limit: '1',
      addressdetails: '1',
    })

    if (params.street) searchParams.set('street', params.street)
    if (params.city) searchParams.set('city', params.city)
    if (params.postalcode) searchParams.set('postalcode', params.postalcode)
    if (params.state) searchParams.set('state', params.state)
    if (params.country) searchParams.set('country', params.country || 'Spain')

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
      {
        headers: {
          'User-Agent': 'CRM-AI-Native/1.0',
        },
      }
    )

    if (!response.ok) {
      return { data: null, error: 'Error en servicio de geocoding' }
    }

    const results: NominatimResponse[] = await response.json()

    if (!results || results.length === 0) {
      return { data: null, error: 'No se encontró la dirección' }
    }

    const result = results[0]
    return {
      data: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      },
      error: null,
    }
  } catch (error) {
    console.error('Structured geocoding error:', error)
    return { data: null, error: 'Error de conexión' }
  }
}

// Geocode an address using Nominatim (OpenStreetMap) - FREE
export async function geocodeAddress(address: string): Promise<{ data: GeocodingResult | null; error: string | null }> {
  if (!address || address.trim().length < 5) {
    return { data: null, error: 'Dirección demasiado corta' }
  }

  try {
    // Normalize Spanish address
    const normalizedAddress = normalizeSpanishAddress(address)
    const encodedAddress = encodeURIComponent(normalizedAddress)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CRM-AI-Native/1.0', // Required by Nominatim ToS
        },
      }
    )

    if (!response.ok) {
      return { data: null, error: 'Error en servicio de geocoding' }
    }

    const results: NominatimResponse[] = await response.json()

    if (!results || results.length === 0) {
      return { data: null, error: 'No se encontró la dirección' }
    }

    const result = results[0]
    return {
      data: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      },
      error: null,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return { data: null, error: 'Error de conexión con servicio de geocoding' }
  }
}

// Reverse geocode coordinates to address
export async function reverseGeocode(latitude: number, longitude: number): Promise<{ data: string | null; error: string | null }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'CRM-AI-Native/1.0',
        },
      }
    )

    if (!response.ok) {
      return { data: null, error: 'Error en servicio de geocoding' }
    }

    const result = await response.json()
    return { data: result.display_name || null, error: null }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return { data: null, error: 'Error de conexión' }
  }
}

// Update company with geocoded coordinates
export async function geocodeCompany(companyId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // Get company address - include name for fallback geocoding
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, billing_address, custom_fields')
    .eq('id', companyId)
    .single()

  if (fetchError || !company) {
    return { success: false, error: 'Empresa no encontrada' }
  }

  // Try multiple sources for address
  const address = company.billing_address as Record<string, string> | null

  if (!address || (!address.street && !address.city)) {
    // Check for string format
    if (typeof company.billing_address === 'string' && company.billing_address.length > 10) {
      const result = await geocodeAddress(company.billing_address + ', España')
      if (result.data) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            latitude: result.data.latitude,
            longitude: result.data.longitude,
            geocoded_at: new Date().toISOString(),
          })
          .eq('id', companyId)

        if (updateError) return { success: false, error: updateError.message }
        return { success: true, error: null }
      }
    }

    // Check custom_fields
    const customFields = company.custom_fields as Record<string, string> | null
    if (customFields) {
      const direccion = customFields.direccion || customFields.address || customFields.ubicacion
      if (direccion) {
        const result = await geocodeAddress(direccion + ', España')
        if (result.data) {
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              latitude: result.data.latitude,
              longitude: result.data.longitude,
              geocoded_at: new Date().toISOString(),
            })
            .eq('id', companyId)

          if (updateError) return { success: false, error: updateError.message }
          return { success: true, error: null }
        }
      }
    }

    return { success: false, error: `Sin dirección: ${company.name}. Edita la empresa y añade dirección completa.` }
  }

  // Normalize the street address
  const normalizedStreet = address.street ? normalizeSpanishAddress(address.street) : ''
  const { streetName, number } = extractStreetNumber(normalizedStreet)

  // Geocode with multiple attempts, from most specific to least
  let geocoded = null

  // Attempt 1: Structured search with street number
  if (streetName && number) {
    const result = await geocodeStructured({
      street: `${number} ${streetName}`,
      city: address.city,
      postalcode: address.postal_code,
      state: address.province,
      country: address.country || 'Spain',
    })
    if (result.data) {
      geocoded = result.data
    }
  }

  // Attempt 2: Structured search without number
  if (!geocoded && streetName) {
    // Small delay for rate limiting
    await new Promise(resolve => setTimeout(resolve, 1100))

    const result = await geocodeStructured({
      street: streetName,
      city: address.city,
      postalcode: address.postal_code,
      state: address.province,
      country: address.country || 'Spain',
    })
    if (result.data) {
      geocoded = result.data
    }
  }

  // Attempt 3: Free-form search with full normalized address
  if (!geocoded) {
    await new Promise(resolve => setTimeout(resolve, 1100))

    const fullAddress = [
      normalizedStreet,
      address.city,
      address.postal_code,
      address.province,
      address.country || 'España',
    ].filter(Boolean).join(', ')

    const result = await geocodeAddress(fullAddress)
    if (result.data) {
      geocoded = result.data
    }
  }

  // Attempt 4: Just street name + city + postal code (without province)
  if (!geocoded && streetName && address.city) {
    await new Promise(resolve => setTimeout(resolve, 1100))

    const result = await geocodeAddress(`${streetName}, ${address.city}, ${address.postal_code || ''}, España`)
    if (result.data) {
      geocoded = result.data
    }
  }

  // Attempt 5: City + postal code only (fallback to city center)
  if (!geocoded && address.city) {
    await new Promise(resolve => setTimeout(resolve, 1100))

    const result = await geocodeStructured({
      city: address.city,
      postalcode: address.postal_code,
      state: address.province,
      country: address.country || 'Spain',
    })
    if (result.data) {
      geocoded = result.data
    }
  }

  if (!geocoded) {
    return {
      success: false,
      error: `No se encontró: ${normalizedStreet}, ${address.city}. Verifica que la dirección sea correcta.`,
    }
  }

  // Update company with coordinates
  const { error: updateError } = await supabase
    .from('companies')
    .update({
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      geocoded_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, error: null }
}

// Batch geocode all companies without coordinates
export async function geocodeAllCompanies(workspaceId: string): Promise<{
  processed: number
  errors: number
  total: number
  errorDetails: string[]
}> {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .is('latitude', null)
    .is('deleted_at', null)
    .limit(50) // Rate limiting: max 50 at a time

  if (error || !companies) {
    return { processed: 0, errors: 1, total: 0, errorDetails: ['Error al obtener empresas'] }
  }

  let processed = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const company of companies) {
    const result = await geocodeCompany(company.id)
    if (result.success) {
      processed++
    } else {
      errors++
      errorDetails.push(`${company.name}: ${result.error}`)
    }
    // Rate limiting: 1 request per second (Nominatim requirement)
    await new Promise(resolve => setTimeout(resolve, 1100))
  }

  return { processed, errors, total: companies.length, errorDetails }
}

// Force re-geocode a company (clear existing and geocode again)
export async function reGeocodeCompany(companyId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // Clear existing coordinates first
  const { error: clearError } = await supabase
    .from('companies')
    .update({
      latitude: null,
      longitude: null,
      geocoded_at: null,
    })
    .eq('id', companyId)

  if (clearError) {
    return { success: false, error: clearError.message }
  }

  // Now geocode again
  return geocodeCompany(companyId)
}

// Get companies with coordinates for map display
export async function getGeocodedCompanies(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, latitude, longitude, industry, account_type, account_status, billing_address, phone, email')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
