'use client'

import { useCallback } from 'react'
import { prefetchData } from './use-cached-data'
import { getContacts } from '@/lib/actions/contacts'
import { getCompanies } from '@/lib/actions/companies'
import { getDeals } from '@/lib/actions/deals'
import { getTasks } from '@/lib/actions/tasks'
import { getActivities } from '@/lib/actions/activities'
import { getFullMetrics } from '@/lib/actions/metrics'
import { getPlans, getWorkspaceUsage } from '@/lib/actions/plans'
import { getWorkspaceMembers, getWorkspaceInvitations } from '@/lib/actions/invitations'

// Map of routes to their prefetch functions
const routePrefetchers: Record<string, (workspaceId: string) => Promise<void>> = {
  '/contacts': async (workspaceId) => {
    await prefetchData(`contacts-${workspaceId}`, () => getContacts(workspaceId))
  },
  '/companies': async (workspaceId) => {
    await Promise.all([
      prefetchData(`companies-${workspaceId}`, () => getCompanies(workspaceId)),
      prefetchData(`deals-${workspaceId}`, () => getDeals(workspaceId), 60000),
    ])
  },
  '/deals': async (workspaceId) => {
    await Promise.all([
      prefetchData(`deals-${workspaceId}`, () => getDeals(workspaceId)),
      prefetchData(`companies-${workspaceId}`, () => getCompanies(workspaceId), 60000),
    ])
  },
  '/tasks': async (workspaceId) => {
    await Promise.all([
      prefetchData(`tasks-${workspaceId}`, () => getTasks(workspaceId)),
      prefetchData(`companies-${workspaceId}`, () => getCompanies(workspaceId), 60000),
      prefetchData(`contacts-${workspaceId}`, () => getContacts(workspaceId), 60000),
    ])
  },
  '/dashboard': async (workspaceId) => {
    await Promise.all([
      prefetchData(`dashboard-metrics-${workspaceId}`, () => getFullMetrics(workspaceId)),
      prefetchData(`tasks-${workspaceId}`, () => getTasks(workspaceId), 60000),
      prefetchData(`deals-${workspaceId}`, () => getDeals(workspaceId), 60000),
    ])
  },
  '/settings': async (workspaceId) => {
    await Promise.all([
      prefetchData('settings-plans', () => getPlans(), 60000),
      prefetchData(`settings-usage-${workspaceId}`, () => getWorkspaceUsage(workspaceId)),
      prefetchData(`settings-members-${workspaceId}`, () => getWorkspaceMembers(workspaceId)),
      prefetchData(`settings-invitations-${workspaceId}`, () => getWorkspaceInvitations(workspaceId)),
    ])
  },
  '/clients': async (workspaceId) => {
    await prefetchData(`clients-status-${workspaceId}`, () => getCompanies(workspaceId))
  },
  '/clients/activos': async (workspaceId) => {
    await prefetchData(`clients-status-${workspaceId}`, () => getCompanies(workspaceId))
  },
  '/clients/inactivos': async (workspaceId) => {
    await prefetchData(`clients-status-${workspaceId}`, () => getCompanies(workspaceId))
  },
  '/clients/cerrados': async (workspaceId) => {
    await prefetchData(`clients-status-${workspaceId}`, () => getCompanies(workspaceId))
  },
  '/metrics': async (workspaceId) => {
    await prefetchData(`dashboard-metrics-${workspaceId}`, () => getFullMetrics(workspaceId))
  },
}

export function usePrefetch(workspaceId: string | null) {
  const prefetch = useCallback((route: string) => {
    if (!workspaceId) return

    const prefetcher = routePrefetchers[route]
    if (prefetcher) {
      // Run prefetch in background, don't await
      prefetcher(workspaceId).catch(() => {
        // Silent fail - prefetch is best effort
      })
    }
  }, [workspaceId])

  return { prefetch }
}
