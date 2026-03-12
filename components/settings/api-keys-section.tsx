'use client'

import { useState, useEffect, useCallback } from 'react'
import { Key, Plus, Copy, Trash2, Check, ExternalLink, Shield, Webhook } from 'lucide-react'
import { createApiKey, listApiKeys, deleteApiKey } from '@/lib/actions/api-keys'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

interface ApiKeysSectionProps {
  workspaceId: string
}

export function ApiKeysSection({ workspaceId }: ApiKeysSectionProps) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  const loadKeys = useCallback(async () => {
    const { data, error } = await listApiKeys(workspaceId)
    if (!error && data) {
      setKeys(data)
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)

    const { data, error } = await createApiKey(workspaceId, newKeyName.trim())

    if (!error && data) {
      setNewlyCreatedKey(data.key)
      setNewKeyName('')
      setShowCreateForm(false)
      await loadKeys()
    }

    setCreating(false)
  }

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId)
    const { error } = await deleteApiKey(keyId)
    if (!error) {
      setKeys(keys.filter(k => k.id !== keyId))
    }
    setDeletingId(null)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              API Keys & Integraciones
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conecta n8n y otras herramientas con tu CRM
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-4 w-4" />
          Generar API Key
        </button>
      </div>

      {/* Key recien creada - solo se muestra una vez */}
      {newlyCreatedKey && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-300">
                API Key creada exitosamente
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Copia esta key ahora. No podras verla de nuevo.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 bg-black/30 text-green-300 px-3 py-2 rounded-lg text-xs font-mono break-all">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => handleCopy(newlyCreatedKey)}
                  className="flex-shrink-0 p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-green-400" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Formulario para crear */}
      {showCreateForm && (
        <div className="bg-white/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de la API Key
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Ej: n8n produccion, Zapier, etc."
              className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setNewKeyName('') }}
              className="px-4 py-2 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de API Keys */}
      <div className="bg-white/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Cargando API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="h-8 w-8 text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              No tienes API keys creadas todavia
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Crea una para conectar n8n u otras herramientas
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-white/5">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Key className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {key.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-mono">crm_{key.key_prefix}...</span>
                      <span>Creada {formatDate(key.created_at)}</span>
                      {key.last_used_at && (
                        <span>Ultimo uso {formatDate(key.last_used_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(key.id)}
                  disabled={deletingId === key.id}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Revocar API key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL base del webhook */}
      <div className="bg-white/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Webhook className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            URL Base de la API
          </span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 dark:bg-black/30 text-blue-300 px-3 py-2 rounded-lg text-xs font-mono">
            {baseUrl}/api/v1/
          </code>
          <button
            onClick={() => handleCopy(`${baseUrl}/api/v1/`)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Copy className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Guia de conexion con n8n */}
      <div className="bg-white/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Como conectar con n8n
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {showGuide ? 'Ocultar' : 'Ver guia'}
          </span>
        </button>

        {showGuide && (
          <div className="px-4 pb-4 space-y-4 text-sm text-gray-400 border-t border-gray-200 dark:border-white/5 pt-4">
            <div>
              <p className="font-semibold text-gray-300 mb-1">1. Genera una API Key</p>
              <p>Haz clic en &quot;Generar API Key&quot; y copia la clave generada.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-1">2. Configura el HTTP Request en n8n</p>
              <p>Usa el nodo &quot;HTTP Request&quot; con estos ajustes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                <li>Method: GET o POST segun la operacion</li>
                <li>URL: <code className="bg-black/30 px-1 rounded text-blue-300">{baseUrl}/api/v1/contacts</code></li>
                <li>Authentication: Header Auth</li>
                <li>Header Name: <code className="bg-black/30 px-1 rounded text-blue-300">Authorization</code></li>
                <li>Header Value: <code className="bg-black/30 px-1 rounded text-blue-300">Bearer crm_tu_api_key</code></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-1">3. Endpoints disponibles</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><code className="bg-black/30 px-1 rounded text-blue-300">GET/POST /api/v1/contacts</code> - Contactos</li>
                <li><code className="bg-black/30 px-1 rounded text-blue-300">GET/POST /api/v1/companies</code> - Empresas</li>
                <li><code className="bg-black/30 px-1 rounded text-blue-300">GET/POST /api/v1/deals</code> - Oportunidades</li>
                <li><code className="bg-black/30 px-1 rounded text-blue-300">POST /api/v1/webhooks</code> - Webhooks (eventos)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-1">4. Webhook para formularios</p>
              <p>Envia un POST a <code className="bg-black/30 px-1 rounded text-blue-300">/api/v1/webhooks</code> con:</p>
              <pre className="bg-black/30 rounded-lg p-3 mt-1 text-xs text-blue-300 overflow-x-auto">{`{
  "event_type": "form.submission",
  "data": {
    "first_name": "Juan",
    "last_name": "Perez",
    "email": "juan@ejemplo.com",
    "lead_source": "landing_page"
  }
}`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
