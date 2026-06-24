'use client'

import { useState, useDeferredValue, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, AlertTriangle, Loader2, ChevronUp, ChevronDown, ArrowUpDown, UserMinus } from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { useAllCompanies } from '@/lib/hooks/use-shared-data'
import { filterInactiveCustomers } from '@/lib/counts'
import { CompanyDetailModal } from '@/components/company-detail-modal'

type SortField = 'name' | 'vat_number' | 'phone' | 'city'
type SortDirection = 'asc' | 'desc' | null

export default function ClientesInactivosPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // SHARED dataset (used by activos, inactivos, /clients, /metrics, etc.).
  const { data: allCompanies, loading: dataLoading, refetch } = useAllCompanies()

  // Force refetch on mount so the page always shows fresh numbers.
  useEffect(() => {
    if (workspaceId) refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const initialLoading = wsLoading || (dataLoading && !allCompanies)
  const isRevalidating = !!allCompanies && dataLoading

  const inactives = useMemo(
    () => filterInactiveCustomers(allCompanies || []),
    [allCompanies],
  )

  const filtered = useMemo(() => {
    if (!deferredSearch) return inactives
    const q = deferredSearch.toLowerCase()
    return inactives.filter((c: any) => {
      const cf = c.custom_fields || {}
      return [
        c.name, c.vat_number, c.email, c.phone,
        c.billing_address?.city, c.billing_address?.state,
        cf.contacto, cf.codigo_cliente, cf.forma_pago,
        cf.telefono_2, cf.email_2,
      ].some(v => v?.toLowerCase().includes(q))
    })
  }, [inactives, deferredSearch])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null) }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sorted = useMemo(() => [...filtered].sort((a: any, b: any) => {
    if (!sortField || !sortDirection) return 0
    let valA = ''
    let valB = ''
    if (sortField === 'name') { valA = a.name || ''; valB = b.name || '' }
    else if (sortField === 'vat_number') { valA = a.vat_number || ''; valB = b.vat_number || '' }
    else if (sortField === 'phone') { valA = a.phone || ''; valB = b.phone || '' }
    else if (sortField === 'city') { valA = a.billing_address?.city || ''; valB = b.billing_address?.city || '' }
    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  }), [filtered, sortField, sortDirection])

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-500" /> Clientes Inactivos
          {isRevalidating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">
          {inactives.length} {inactives.length === 1 ? 'cliente marcado' : 'clientes marcados'} como inactivos
          {isRevalidating && <span className="text-gray-500 ml-2">· actualizando...</span>}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, NIF, email, teléfono, ciudad, contacto, código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-white dark:border-gray-300 dark:text-gray-900 dark:placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden bg-[#0d1b2a]/60 backdrop-blur-sm">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#1b2838]/80 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/30">
          <button onClick={() => handleSort('name')} className="col-span-3 flex items-center gap-1 hover:text-white transition-colors">
            Empresa
            {sortField === 'name' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('city')} className="col-span-2 flex items-center gap-1 hover:text-white transition-colors">
            Población
            {sortField === 'city' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('phone')} className="col-span-2 flex items-center gap-1 hover:text-white transition-colors">
            Teléfono
            {sortField === 'phone' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-2">Email</div>
          <button onClick={() => handleSort('vat_number')} className="col-span-1 flex items-center gap-1 hover:text-white transition-colors">
            NIF
            {sortField === 'vat_number' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            {isRevalidating ? (
              <>
                <Loader2 className="h-8 w-8 text-amber-500 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-400">Cargando clientes inactivos…</p>
              </>
            ) : (
              <>
                <UserMinus className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {searchQuery
                    ? 'No se encontraron resultados'
                    : 'No hay clientes inactivos. Marca un cliente como inactivo desde su ficha.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700/20">
            {sorted.map((client: any) => {
              const cf = client.custom_fields || {}
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 px-4 py-2.5 cursor-pointer transition-colors group bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500/60"
                >
                  {/* Company */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600">
                      {client.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">{client.name}</p>
                      {cf.codigo_cliente && <p className="text-[10px] text-gray-500">#{cf.codigo_cliente}</p>}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{client.billing_address?.city || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{client.phone || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{cf.contacto || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-gray-300 truncate">{client.email || cf.email_2 || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs text-gray-400 truncate">{client.vat_number || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          Mostrando {sorted.length} de {inactives.length} clientes inactivos
        </p>
      )}

      {selectedId && (
        <CompanyDetailModal
          companyId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => refetch()}
          accentColor="amber"
          defaultBadge={{ label: 'Inactivo', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }}
        />
      )}
    </div>
  )
}
