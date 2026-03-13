'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Webhook, Plus, X, Check, Loader2, Trash2, Play, Eye, EyeOff,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Copy, RefreshCw
} from 'lucide-react'
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
} from '@/lib/actions/webhooks'
import { WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/constants/webhook-events'

interface WebhooksSectionProps {
  workspaceId: string
}

export function WebhooksSection({ workspaceId }: WebhooksSectionProps) {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<WebhookEvent[]>([])
  const [showSecret, setShowSecret] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Expanded webhook for logs
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Testing
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    loadWebhooks()
  }, [workspaceId])

  const loadWebhooks = async () => {
    setLoading(true)
    const result = await getWebhooks(workspaceId)
    if (result.data) setWebhooks(result.data)
    setLoading(false)
  }

  const resetForm = () => {
    setFormName('')
    setFormUrl('')
    setFormEvents([])
    setError('')
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) {
      setError('Completa todos los campos y selecciona al menos un evento')
      return
    }

    setCreating(true)
    setError('')

    const result = await createWebhook(workspaceId, {
      name: formName.trim(),
      url: formUrl.trim(),
      events: formEvents,
    })

    if (result.error) {
      setError(result.error)
      setCreating(false)
      return
    }

    await loadWebhooks()
    setShowModal(false)
    resetForm()
    setCreating(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el webhook "${name}"?`)) return

    const result = await deleteWebhook(id)
    if (result.error) {
      alert(result.error)
      return
    }

    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    const result = await updateWebhook(id, { is_active: !currentActive })
    if (result.error) {
      alert(result.error)
      return
    }

    setWebhooks(prev => prev.map(w =>
      w.id === id ? { ...w, is_active: !currentActive } : w
    ))
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    const result = await testWebhook(id)
    setTestingId(null)

    if (result.success) {
      alert('✓ Webhook enviado correctamente')
      // Refresh logs if expanded
      if (expandedWebhook === id) {
        loadLogs(id)
      }
    } else {
      alert(`✗ Error: ${result.error}`)
    }
  }

  const loadLogs = async (webhookId: string) => {
    setLogsLoading(true)
    const result = await getWebhookLogs(webhookId)
    if (result.data) setLogs(result.data)
    setLogsLoading(false)
  }

  const toggleExpand = (webhookId: string) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null)
      setLogs([])
    } else {
      setExpandedWebhook(webhookId)
      loadLogs(webhookId)
    }
  }

  const toggleEvent = (event: WebhookEvent) => {
    if (formEvents.includes(event)) {
      setFormEvents(prev => prev.filter(e => e !== event))
    } else {
      setFormEvents(prev => [...prev, event])
    }
  }

  const groupedEvents = {
    'Contactos': ['contact.created', 'contact.updated', 'contact.deleted'] as WebhookEvent[],
    'Empresas': ['company.created', 'company.updated', 'company.deleted'] as WebhookEvent[],
    'Oportunidades': ['deal.created', 'deal.updated', 'deal.stage_changed', 'deal.won', 'deal.lost'] as WebhookEvent[],
    'Actividades': ['activity.created'] as WebhookEvent[],
    'Tareas': ['task.created', 'task.completed'] as WebhookEvent[],
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Webhook className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            Webhooks
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Recibe notificaciones en tiempo real cuando ocurran eventos en el CRM. Conecta con tu sistema, ERP o automatizacion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No tienes webhooks configurados</p>
                <p className="text-sm">Crea uno para sincronizar con tu sistema externo</p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  {/* Webhook header */}
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggle(webhook.id, webhook.is_active)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          webhook.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          webhook.is_active ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {webhook.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {webhook.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Status indicator */}
                      {webhook.last_status_code && (
                        <Badge
                          variant="outline"
                          className={`rounded-full text-xs ${
                            webhook.last_status_code >= 200 && webhook.last_status_code < 300
                              ? 'border-emerald-500/30 text-emerald-500'
                              : 'border-red-500/30 text-red-500'
                          }`}
                        >
                          {webhook.last_status_code}
                        </Badge>
                      )}

                      {/* Events count */}
                      <Badge variant="outline" className="rounded-full text-xs dark:border-gray-600 dark:text-gray-400">
                        {webhook.events?.length || 0} eventos
                      </Badge>

                      {/* Test button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleTest(webhook.id)}
                        disabled={testingId === webhook.id}
                        title="Enviar test"
                      >
                        {testingId === webhook.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Expand logs */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleExpand(webhook.id)}
                        title="Ver logs"
                      >
                        {expandedWebhook === webhook.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDelete(webhook.id, webhook.name)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded logs */}
                  {expandedWebhook === webhook.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-4">
                      {/* Secret */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Secret (para validar firma HMAC)
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type={showSecret ? 'text' : 'password'}
                            value={webhook.secret || ''}
                            readOnly
                            className="text-xs font-mono h-8 dark:bg-gray-900/50 dark:border-gray-600"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowSecret(!showSecret)}
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(webhook.secret || '')
                              setCopiedSecret(true)
                              setTimeout(() => setCopiedSecret(false), 2000)
                            }}
                          >
                            {copiedSecret ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Events */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Eventos suscritos
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events?.map((event: string) => (
                            <Badge key={event} variant="outline" className="rounded-full text-xs dark:border-gray-600">
                              {WEBHOOK_EVENTS[event as WebhookEvent] || event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Logs */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Ultimos envios
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => loadLogs(webhook.id)}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />
                            Refrescar
                          </Button>
                        </div>

                        {logsLoading ? (
                          <div className="text-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
                          </div>
                        ) : logs.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-400">
                            Sin envios recientes
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {logs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-gray-900/50 text-xs"
                              >
                                {log.status_code && log.status_code >= 200 && log.status_code < 300 ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {WEBHOOK_EVENTS[log.event_type as WebhookEvent] || log.event_type}
                                  </div>
                                  {log.error_message && (
                                    <div className="text-red-500 truncate">{log.error_message}</div>
                                  )}
                                </div>
                                <div className="text-gray-400 flex-shrink-0 flex items-center gap-2">
                                  {log.status_code && (
                                    <span className={log.status_code >= 200 && log.status_code < 300 ? 'text-emerald-500' : 'text-red-500'}>
                                      {log.status_code}
                                    </span>
                                  )}
                                  <span>{log.duration_ms}ms</span>
                                  <span>{new Date(log.triggered_at).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            <Button
              variant="outline"
              className="w-full rounded-xl dark:border-gray-700 dark:text-gray-300"
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo Webhook</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Nombre
                </label>
                <Input
                  placeholder="Ej: Mi Sistema, ERP, Zapier..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  URL del webhook
                </label>
                <Input
                  type="url"
                  placeholder="https://tu-servidor.com/webhook"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Eventos a enviar
                </label>
                <div className="space-y-3">
                  {Object.entries(groupedEvents).map(([group, events]) => (
                    <div key={group}>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        {group}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {events.map((event) => (
                          <button
                            key={event}
                            onClick={() => toggleEvent(event)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              formEvents.includes(event)
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {WEBHOOK_EVENTS[event]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl dark:border-gray-700 dark:text-gray-300"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Crear Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
