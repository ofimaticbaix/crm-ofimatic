'use client'

import { useState, useDeferredValue, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, Building2, Users, Phone, Mail, MapPin, ChevronRight,
  Loader2, Filter, UserCheck, UserMinus, Lock, AlertTriangle, Plus,
  ChevronDown, ChevronUp, ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/lib/context/workspace-context'
import { type ClientListItem } from '@/lib/actions/client-detail'
import { useAllCompanies } from '@/lib/hooks/use-shared-data'
import { isInactiveCustomer, isActiveCustomer, isCustomer } from '@/lib/counts'
import { CompanyDetailModal } from '@/components/company-detail-modal'

type FilterType = 'todos' | 'activo' | 'inactivo'
type SortField = 'name' | 'vat_number' | 'phone' | 'city' | 'estado'
type SortDirection = 'asc' | 'desc' | null

export default function ClientsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [filterType, setFilterType] = useState<FilterType>('todos')
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: companies, loading: dataLoading, error, refetch } = useAllCompanies()
  // Adapter: shared dataset has the same shape we need (id, name, account_type,
  // custom_fields, vat_number, phone, email, billing_address, contacts, industry, created_at).
  // We just expose `city` for sort compatibility.
  const clients = useMemo<ClientListItem[]>(
    () => (companies || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      vat_number: c.vat_number,
      phone: c.phone,
      email: c.email,
      industry: c.industry,
      account_type: c.account_type,
      account_status: c.account_status,
      city: c.billing_address?.city || null,
      contact_count: c.contacts?.[0]?.count || c.contacts?.length || 0,
      created_at: c.created_at,
      custom_fields: c.custom_fields,
    })),
    [companies],
  )

  const loading = wsLoading || (dataLoading && !clients.length)

  // Only real customers live in Clientes (Activos + Inactivos).
  const allClients = useMemo<ClientListItem[]>(() => clients.filter(isCustomer), [clients])

  const isInactive = isInactiveCustomer

  const filtered = useMemo(() => allClients.filter((c) => {
    const matchesSearch = !deferredSearch || [
      c.name, c.vat_number, c.email, c.phone, c.city, c.industry,
      c.custom_fields?.codigo_cliente
    ].some(v => v?.toLowerCase().includes(deferredSearch.toLowerCase()))

    const matchesStatus =
      filterType === 'todos'
        ? true
        : filterType === 'inactivo'
          ? isInactive(c)
          : !isInactive(c)

    return matchesSearch && matchesStatus
  }), [allClients, deferredSearch, filterType])

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
    else if (sortField === 'city') { valA = a.city || ''; valB = b.city || '' }
    else if (sortField === 'estado') {
      // Activos antes que inactivos
      const orderA = isInactive(a) ? 1 : 0
      const orderB = isInactive(b) ? 1 : 0
      return sortDirection === 'asc' ? orderA - orderB : orderB - orderA
    }
    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  }), [filtered, sortField, sortDirection])

  // Stats — solo customers reales, separados por estado
  const totalClients = allClients.length
  const inactivos = allClients.filter(isInactive).length
  const activos = totalClients - inactivos

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5 bg-[#0a1628]/80 backdrop-blur-sm rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Vista global de tu cartera</p>
        </div>
        <Button size="sm" onClick={() => router.push('/companies')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> Nuevo Cliente
        </Button>
      </div>

      {/* Filtros — segmented control */}
      <div className="inline-flex w-full md:w-auto p-1 rounded-xl bg-gray-900/40 dark:bg-black/30 border border-gray-700/40 backdrop-blur-sm">
        {([
          { key: 'todos' as const,    label: 'Todos',     count: totalClients, Icon: Users,      activeBg: 'bg-blue-500',  dot: 'bg-blue-400' },
          { key: 'activo' as const,   label: 'Activos',   count: activos,      Icon: UserCheck,  activeBg: 'bg-green-500', dot: 'bg-green-400' },
          { key: 'inactivo' as const, label: 'Inactivos', count: inactivos,    Icon: UserMinus,  activeBg: 'bg-amber-500', dot: 'bg-amber-400' },
        ]).map(({ key, label, count, Icon, activeBg, dot }) => {
          const isActive = filterType === key
          return (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`flex-1 md:flex-initial relative flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${activeBg} text-white shadow-md`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, CIF, email, telefono, ciudad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-white dark:border-gray-300 dark:text-gray-900 dark:placeholder:text-gray-400"
        />
      </div>

      {/* Client List - Table style */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-white/5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          <button onClick={() => handleSort('name')} className="col-span-3 flex items-center gap-1 hover:text-white transition-colors">
            Razón Social
            {sortField === 'name' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('vat_number')} className="col-span-2 flex items-center gap-1 hover:text-white transition-colors">
            CIF/NIF
            {sortField === 'vat_number' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('phone')} className="col-span-2 flex items-center gap-1 hover:text-white transition-colors">
            Teléfono
            {sortField === 'phone' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('city')} className="col-span-2 flex items-center gap-1 hover:text-white transition-colors">
            Ciudad
            {sortField === 'city' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <button onClick={() => handleSort('estado')} className="col-span-1 flex items-center gap-1 hover:text-white transition-colors">
            Estado
            {sortField === 'estado' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
          </button>
          <div className="col-span-1 text-center">Cont.</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/20">
            {sorted.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedId(client.id)}
                className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors group"
              >
                {/* Name + avatar */}
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {client.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{client.name}</p>
                    {client.industry && <p className="text-[10px] text-gray-500 truncate">{client.industry}</p>}
                  </div>
                </div>

                {/* CIF */}
                <div className="col-span-2 flex items-center">
                  <span className="text-xs text-gray-300">{client.vat_number || '—'}</span>
                </div>

                {/* Phone */}
                <div className="col-span-2 flex items-center">
                  {client.phone ? (
                    <span className="text-xs text-gray-300 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gray-500" /> {client.phone}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </div>

                {/* City */}
                <div className="col-span-2 flex items-center">
                  {client.city ? (
                    <span className="text-xs text-gray-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-500" /> {client.city}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </div>

                {/* Estado badge */}
                <div className="col-span-1 flex items-center">
                  {isInactive(client) ? (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-[9px] px-1.5">
                      Inactivo
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[9px] px-1.5">
                      Activo
                    </Badge>
                  )}
                </div>

                {/* Contact count */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {client.contact_count}
                  </span>
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex items-center justify-end">
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      {sorted.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          Mostrando {sorted.length} de {totalClients} clientes
        </p>
      )}

      {selectedId && (
        <CompanyDetailModal
          companyId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => refetch()}
          accentColor="blue"
          defaultBadge={{ label: 'Cliente', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }}
        />
      )}
    </div>
  )
}
