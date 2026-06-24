'use client'

// Shared, cached, single-source-of-truth hooks for the entities the CRM counts:
// companies and deals. Any page that displays counters or lists derived from
// these tables MUST consume these hooks so the same dataset is reused.
//
// Sincronización en dos niveles:
//   1) BroadcastChannel — entre pestañas del MISMO usuario, instantáneo.
//   2) Supabase Realtime — entre USUARIOS distintos del mismo workspace, así
//      Ferran ve los cambios que hace Rafael y al revés sin refrescar.

import { useEffect, useRef } from 'react'
import { useCachedData, invalidateCache } from '@/lib/hooks/use-cached-data'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getCompanies } from '@/lib/actions/companies'
import { getDeals } from '@/lib/actions/deals'
import { getContacts } from '@/lib/actions/contacts'
import { createClient } from '@/lib/supabase/client'

const COMPANIES_KEY = (ws: string) => `all-companies-${ws}`
const DEALS_KEY = (ws: string) => `all-deals-${ws}`
const CONTACTS_KEY = (ws: string) => `all-contacts-${ws}`

const BC_NAME = 'crm-data-sync'

// Lazy BroadcastChannel — broadcasts mutations across open tabs so every
// window stays in sync without manual refresh.
let _bc: BroadcastChannel | null = null
function getBC(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null
  if (!_bc) _bc = new BroadcastChannel(BC_NAME)
  return _bc
}

// Suscribe a una tabla por workspace y dispara onChange con un debounce de
// 300ms para evitar refetcheos en cascada cuando llegan muchos eventos.
function useRealtimeTable(
  table: 'companies' | 'deals' | 'contacts' | 'activities',
  workspaceId: string | undefined,
  onChange: () => void,
) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null

    const channel = supabase
      .channel(`${table}-${workspaceId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => onChangeRef.current(), 300)
        },
      )
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [workspaceId, table])
}

export function useAllCompanies() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const result = useCachedData<any[]>(
    workspaceId ? COMPANIES_KEY(workspaceId) : '',
    () => getCompanies(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId },
  )

  // Listen for cross-tab updates
  useEffect(() => {
    const bc = getBC()
    if (!bc || !workspaceId) return
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'companies-changed' && ev.data?.workspaceId === workspaceId) {
        result.refetch()
      }
    }
    bc.addEventListener('message', handler)
    return () => bc.removeEventListener('message', handler)
  }, [workspaceId, result])

  // Realtime: cambios de OTROS usuarios disparan refetch automáticamente.
  useRealtimeTable('companies', workspaceId, () => result.refetch())

  // Wrap refetch so any caller that triggers it ALSO broadcasts the change to
  // other open tabs and invalidates legacy caches still in use.
  const refetch = async () => {
    invalidateCache('clients-list')
    invalidateCache('clients-status')
    invalidateCache('companies-customers')
    invalidateCache('companies-leads')
    invalidateCache('companies-')
    await result.refetch()
    const bc = getBC()
    if (bc && workspaceId) bc.postMessage({ type: 'companies-changed', workspaceId })
  }

  return { ...result, refetch, loading: wsLoading || (result.loading && !result.data) }
}

export function useAllDeals() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const result = useCachedData<any[]>(
    workspaceId ? DEALS_KEY(workspaceId) : '',
    () => getDeals(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId },
  )

  useEffect(() => {
    const bc = getBC()
    if (!bc || !workspaceId) return
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'deals-changed' && ev.data?.workspaceId === workspaceId) {
        result.refetch()
      }
    }
    bc.addEventListener('message', handler)
    return () => bc.removeEventListener('message', handler)
  }, [workspaceId, result])

  useRealtimeTable('deals', workspaceId, () => result.refetch())

  const refetch = async () => {
    invalidateCache('deals-')
    await result.refetch()
    const bc = getBC()
    if (bc && workspaceId) bc.postMessage({ type: 'deals-changed', workspaceId })
  }

  return { ...result, refetch, loading: wsLoading || (result.loading && !result.data) }
}

export function useAllContacts() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const result = useCachedData<any[]>(
    workspaceId ? CONTACTS_KEY(workspaceId) : '',
    () => getContacts(workspaceId),
    [workspaceId],
    { enabled: !!workspaceId },
  )

  useEffect(() => {
    const bc = getBC()
    if (!bc || !workspaceId) return
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'contacts-changed' && ev.data?.workspaceId === workspaceId) {
        result.refetch()
      }
    }
    bc.addEventListener('message', handler)
    return () => bc.removeEventListener('message', handler)
  }, [workspaceId, result])

  useRealtimeTable('contacts', workspaceId, () => result.refetch())

  const refetch = async () => {
    invalidateCache('contacts-')
    await result.refetch()
    const bc = getBC()
    if (bc && workspaceId) bc.postMessage({ type: 'contacts-changed', workspaceId })
  }

  return { ...result, refetch, loading: wsLoading || (result.loading && !result.data) }
}

// Invalidate the shared companies cache + broadcast to other open tabs.
// Call this after any mutation that changes a company (create, update, delete).
export function invalidateAllCompanies(workspaceId?: string) {
  invalidateCache('all-companies')
  // Also nuke legacy keys still in use by older code paths so nothing is left stale
  invalidateCache('companies-')
  invalidateCache('clients-list')
  invalidateCache('clients-status')
  const bc = getBC()
  if (bc && workspaceId) bc.postMessage({ type: 'companies-changed', workspaceId })
}

export function invalidateAllDeals(workspaceId?: string) {
  invalidateCache('all-deals')
  invalidateCache('deals-')
  const bc = getBC()
  if (bc && workspaceId) bc.postMessage({ type: 'deals-changed', workspaceId })
}
