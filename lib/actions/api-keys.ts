'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Generate random hex string (replacement for crypto.randomBytes)
function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// SHA-256 hash using Web Crypto API (compatible with all runtimes)
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generar una nueva API key para el workspace
export async function createApiKey(workspaceId: string, name: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado' }
    }

    // Generar la key
    const rawKey = `crm_${generateRandomHex(64)}`
    const keyHash = await sha256Hash(rawKey)
    const keyPrefix = rawKey.slice(4, 12) // Primeros 8 chars despues de "crm_"

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        workspace_id: workspaceId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        created_by: user.id,
      })
      .select('id, name, key_prefix, created_at')
      .single()

    if (error) return { data: null, error: error.message }

    return {
      data: {
        id: data.id,
        name: data.name,
        key: rawKey, // Solo se muestra una vez
        prefix: data.key_prefix,
        createdAt: data.created_at,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error creando API key:', err)
    return { data: null, error: 'Error interno al crear la API key' }
  }
}

// Listar todas las API keys (solo prefix, nunca la key completa)
export async function listApiKeys(workspaceId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_by, last_used_at, created_at, revoked_at')
      .eq('workspace_id', workspaceId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    console.error('Error listando API keys:', err)
    return { data: null, error: 'Error interno al listar API keys' }
  }
}

// Eliminar/revocar una API key
export async function deleteApiKey(keyId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', keyId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    console.error('Error revocando API key:', err)
    return { error: 'Error interno al revocar la API key' }
  }
}

// Validar una API key (usado por las rutas webhook/API)
export async function validateApiKey(apiKey: string) {
  try {
    if (!apiKey || !apiKey.startsWith('crm_')) {
      return { data: null, error: 'API key invalida' }
    }

    const keyHash = await sha256Hash(apiKey)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, workspace_id')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .single()

    if (error || !data) {
      return { data: null, error: 'API key invalida o revocada' }
    }

    // Actualizar last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)

    return {
      data: {
        workspaceId: data.workspace_id,
        keyId: data.id,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error validando API key:', err)
    return { data: null, error: 'Error interno al validar la API key' }
  }
}
