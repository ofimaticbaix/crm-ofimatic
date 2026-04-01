'use client'

import { useState } from 'react'
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
import { getClientsList, type ClientListItem } from '@/lib/actions/client-detail'
import { useCachedData } from '@/lib/hooks/use-cached-data'

type FilterType = 'todos' | 'customer' | 'prospect' | 'lead' | 'partner' | 'supplier'
type SortField = 'name' | 'vat_number' | 'phone' | 'city' | 'type'
type SortDirection = 'asc' | 'desc' | null

export default function ClientsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('todos')
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const { data: clients, loading: dataLoading, error } = useCachedData<ClientListItem[]>(
    `clients-list-${workspaceId}`,
    () => getClientsList(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId }
  )

  const loading = wsLoading || (dataLoading && !clients)

  // Filter
  const allClients: ClientListItem[] = clients || []
  const filtered = allClients.filter((c) => {
    const matchesSearch = !searchQuery || [
      c.name, c.vat_number, c.email, c.phone, c.city, c.industry,
      c.custom_fields?.codigo_cliente
    ].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'todos' || c.account_type === filterType

    return matchesSearch && matchesType
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null) }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const TYPE_ORDER: Record<string, number> = { customer: 0, prospect: 1, lead: 2, partner: 3, supplier: 4 }

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (!sortField || !sortDirection) return 0
    let valA = ''
    let valB = ''
    if (sortField === 'name') { valA = a.name || ''; valB = b.name || '' }
    else if (sortField === 'vat_number') { valA = a.vat_number || ''; valB = b.vat_number || '' }
    else if (sortField === 'phone') { valA = a.phone || ''; valB = b.phone || '' }
    else if (sortField === 'city') { valA = a.city || ''; valB = b.city || '' }
    else if (sortField === 'type') {
      const orderA = TYPE_ORDER[a.account_type || ''] ?? 99
      const orderB = TYPE_ORDER[b.account_type || ''] ?? 99
      return sortDirection === 'asc' ? orderA - orderB : orderB - orderA
    }
    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  })

  // Stats
  const totalClients = allClients.length
  const customers = allClients.filter(c => c.account_type === 'customer').length
  const prospects = allClients.filter(c => c.account_type === 'prospect').length
  const leads = allClients.filter(c => c.account_type === 'lead').length

  const accountTypeLabels: Record<string, string> = {
    customer: 'Cliente', prospect: 'Prospecto', lead: 'Lead', partner: 'Partner', supplier: 'Proveedor'
  }
  const accountTypeBadge: Record<string, string> = {
    customer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    partner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    supplier: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }

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
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            {totalClients} clientes · {customers} activos · {prospects} prospectos · {leads} leads
          </p>
        </div>
        <Button size="sm" onClick={() => router.push('/companies')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> Nuevo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => setFilterType('todos')} className="text-left">
          <Card className={`hover:shadow-xl transition-all ${filterType === 'todos' ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-3">
              <div className="text-xl font-bold text-white">{totalClients}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setFilterType('customer')} className="text-left">
          <Card className={`hover:shadow-xl transition-all ${filterType === 'customer' ? 'ring-2 ring-green-500' : ''}`}>
            <CardContent className="p-3">
              <div className="text-xl font-bold text-green-400">{customers}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Clientes</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setFilterType('prospect')} className="text-left">
          <Card className={`hover:shadow-xl transition-all ${filterType === 'prospect' ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-3">
              <div className="text-xl font-bold text-blue-400">{prospects}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Prospectos</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setFilterType('lead')} className="text-left">
          <Card className={`hover:shadow-xl transition-all ${filterType === 'lead' ? 'ring-2 ring-purple-500' : ''}`}>
            <CardContent className="p-3">
              <div className="text-xl font-bold text-purple-400">{leads}</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Leads</p>
            </CardContent>
          </Card>
        </button>
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
          <button onClick={() => handleSort('type')} className="col-span-1 flex items-center gap-1 hover:text-white transition-colors">
            Tipo
            {sortField === 'type' ? (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
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
                onClick={() => router.push(`/clients/${client.id}`)}
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

                {/* Type badge */}
                <div className="col-span-1 flex items-center">
                  <Badge className={`${accountTypeBadge[client.account_type || 'prospect']} rounded-full text-[9px] px-1.5`}>
                    {accountTypeLabels[client.account_type || 'prospect']}
                  </Badge>
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
    </div>
  )
}
