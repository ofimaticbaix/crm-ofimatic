'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Plus, Globe, Users, X, Building2, Target,
  Mail, Phone, MapPin, User, Calendar, Loader2, Pencil, Trash2
} from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies, getCompany, deleteCompany, updateCompany } from '@/lib/actions/companies'
import { useCachedData } from '@/lib/hooks/use-cached-data'

export default function LeadsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: allCompanies, loading: dataLoading, refetch } = useCachedData<any[]>(
    `companies-${workspaceId}`,
    () => getCompanies(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const loading = wsLoading || (dataLoading && !allCompanies)

  // Filter only leads (account_type = 'lead')
  const leads = (allCompanies || []).filter((c: any) => c.account_type === 'lead')

  const filtered = leads.filter((c: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return [c.name, c.vat_number, c.email, c.phone, c.billing_address?.city, c.custom_fields?.contacto]
      .some(v => v?.toLowerCase().includes(q))
  })

  // Load detail when selecting
  useEffect(() => {
    if (!selectedLead) { setDetailData(null); return }
    async function loadDetail() {
      setDetailLoading(true)
      const { data } = await getCompany(selectedLead.id)
      setDetailData(data)
      setDetailLoading(false)
    }
    loadDetail()
  }, [selectedLead])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente potencial?')) return
    setDeletingId(id)
    await deleteCompany(id)
    setSelectedLead(null)
    refetch()
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Target className="h-7 w-7 text-orange-400" />
            Clientes Potenciales
          </h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            {leads.length} clientes potenciales registrados
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, NIF, email, telefono, ciudad, contacto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-white/5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2">Poblacion</div>
          <div className="col-span-2">Telefono</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-1">NIF</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery ? 'No se encontraron resultados' : 'No hay clientes potenciales. Importa desde Excel.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/20">
            {filtered.map((lead: any) => {
              const cf = lead.custom_fields || {}
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {lead.name[0]}
                    </div>
                    <p className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition-colors">{lead.name}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{lead.billing_address?.city || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300">{lead.phone || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{cf.contacto || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{lead.email || cf.email_2 || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-400 truncate">{lead.vat_number || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          Mostrando {filtered.length} de {leads.length} clientes potenciales
        </p>
      )}

      {/* Detail Modal */}
      {selectedLead && (() => {
        const lead = detailData || selectedLead
        const cf = lead.custom_fields || {}

        const InfoField = ({ icon: Icon, iconColor, label, value, href, external }: {
          icon: any; iconColor: string; label: string; value: string | null | undefined; href?: string; external?: boolean
        }) => (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
            <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              {value ? (
                href ? (
                  <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                )
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          </div>
        )

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {lead.name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white text-xl">{lead.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs">
                          Cliente Potencial
                        </Badge>
                        {lead.vat_number && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">NIF: {lead.vat_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Informacion
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InfoField icon={Building2} iconColor="text-orange-500" label="Empresa" value={lead.name} />
                        <InfoField icon={MapPin} iconColor="text-red-500" label="Direccion" value={lead.billing_address?.street} />
                        <InfoField icon={MapPin} iconColor="text-orange-400" label="Poblacion" value={lead.billing_address?.city} />
                        <InfoField icon={Building2} iconColor="text-purple-500" label="NIF" value={lead.vat_number} />
                        <InfoField icon={Phone} iconColor="text-green-500" label="Telefono" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
                        <InfoField icon={Phone} iconColor="text-green-400" label="Telefono 2" value={cf.telefono_2} href={cf.telefono_2 ? `tel:${cf.telefono_2}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-500" label="Mail Compras" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} />
                        <InfoField icon={Mail} iconColor="text-blue-400" label="Mail Empresa" value={cf.email_2} href={cf.email_2 ? `mailto:${cf.email_2}` : undefined} />
                        <InfoField icon={Globe} iconColor="text-indigo-500" label="Web" value={lead.website}
                          href={lead.website ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`) : undefined} external />
                        <InfoField icon={User} iconColor="text-cyan-500" label="Contacto" value={cf.contacto} />
                        <InfoField icon={Calendar} iconColor="text-amber-500" label="Fecha Actualizacion" value={cf.fecha_actualizacion} />
                      </div>
                    </div>

                    {/* Notes / description */}
                    {lead.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notas</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">{lead.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button variant="outline" onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id}
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                        {deletingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Eliminar
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedLead(null)}
                        className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
                        Cerrar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
