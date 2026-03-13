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

// Geocode an address using Nominatim (OpenStreetMap) - FREE
export async function geocodeAddress(address: string): Promise<{ data: GeocodingResult | null; error: string | null }> {
  if (!address || address.trim().length < 5) {
    return { data: null, error: 'Dirección demasiado corta' }
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
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
  let fullAddress = ''

  // 1. Try billing_address object
  const address = company.billing_address as Record<string, string> | null
  if (address) {
    fullAddress = [
      address.street,
      address.city,
      address.postal_code,
      address.province,
      address.country || 'España',
    ]
      .filter(Boolean)
      .join(', ')
  }

  // 2. If billing_address is a string (old format), use it directly
  if (!fullAddress && typeof company.billing_address === 'string') {
    fullAddress = company.billing_address + ', España'
  }

  // 3. Try custom_fields.direccion or similar
  const customFields = company.custom_fields as Record<string, string> | null
  if (!fullAddress && customFields) {
    const direccion = customFields.direccion || customFields.address || customFields.ubicacion
    if (direccion) {
      fullAddress = direccion + ', España'
    }
  }

  // 4. Last resort: try company name + España (for well-known companies)
  if (!fullAddress || fullAddress.length < 10) {
    return { success: false, error: `Sin dirección: ${company.name}. Edita la empresa y añade dirección completa.` }
  }

  // Geocode
  const { data: geocoded, error: geocodeError } = await geocodeAddress(fullAddress)

  if (geocodeError || !geocoded) {
    return { success: false, error: geocodeError || 'No se pudo geocodificar' }
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
