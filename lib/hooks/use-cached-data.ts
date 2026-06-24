'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Global cache that persists between navigations
const cache = new Map<string, CacheEntry<unknown>>()

// Pending prefetch requests to avoid duplicates
const pendingPrefetch = new Set<string>()

// In-flight requests per key — dedupe simultaneous fetchData calls from multiple
// components subscribing to the same key (typical when sibling components mount
// together and request the same dataset).
const inflight = new Map<string, Promise<{ data: unknown; error: string | null }>>()

// Stale time in ms (30 seconds)
const STALE_TIME = 30 * 1000

interface UseCachedDataOptions {
  staleTime?: number
  enabled?: boolean
}

interface UseCachedDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isStale: boolean
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<{ data: T | null; error: string | null }>,
  deps: unknown[] = [],
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> {
  const { staleTime = STALE_TIME, enabled = true } = options

  const [data, setData] = useState<T | null>(() => {
    // Initialize with cached data if available
    const cached = cache.get(key) as CacheEntry<T> | undefined
    return cached?.data ?? null
  })
  const [loading, setLoading] = useState(() => {
    // Only show loading if no cached data
    return !cache.has(key)
  })
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled) return

    // Stale-while-revalidate: muestra caché al instante si existe,
    // pero SIEMPRE dispara un refetch en background para refrescar.
    const cached = cache.get(key) as CacheEntry<T> | undefined

    if (cached) {
      setData(cached.data)
      setLoading(false)
      setIsStale(true)
    }

    // Solo mostrar spinner si no había caché (primera carga)
    if (showLoading && !cached) {
      setLoading(true)
    }

    try {
      // Dedupe concurrent fetches for the same key across components
      let promise = inflight.get(key) as Promise<{ data: T | null; error: string | null }> | undefined
      if (!promise) {
        promise = fetcherRef.current()
        inflight.set(key, promise as Promise<{ data: unknown; error: string | null }>)
        promise.finally(() => inflight.delete(key))
      }
      const result = await promise

      if (result.error) {
        setError(result.error)
        if (!cached) setLoading(false)
      } else if (result.data !== null) {
        cache.set(key, { data: result.data, timestamp: Date.now() })
        setData(result.data)
        setError(null)
        setIsStale(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [key, enabled])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, ...deps])

  // Refrescar al volver a la pestaña/app
  useEffect(() => {
    if (!enabled) return
    const handler = () => {
      if (document.visibilityState === 'visible') fetchData(false)
    }
    document.addEventListener('visibilitychange', handler)
    window.addEventListener('focus', handler)
    return () => {
      document.removeEventListener('visibilitychange', handler)
      window.removeEventListener('focus', handler)
    }
  }, [enabled, fetchData])

  const refetch = useCallback(async () => {
    // Force refetch, invalidating cache
    cache.delete(key)
    setLoading(true)
    await fetchData(true)
  }, [key, fetchData])

  return { data, loading, error, refetch, isStale }
}

// Utility to invalidate cache for a specific key pattern
export function invalidateCache(keyPattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(keyPattern)) {
      cache.delete(key)
    }
  }
}

// Utility to clear all cache
export function clearAllCache() {
  cache.clear()
}

// Prefetch data in background - won't block UI, silent errors
export async function prefetchData<T>(
  key: string,
  fetcher: () => Promise<{ data: T | null; error: string | null }>,
  staleTime: number = STALE_TIME
): Promise<void> {
  // Skip if already cached and fresh
  const cached = cache.get(key) as CacheEntry<T> | undefined
  if (cached && Date.now() - cached.timestamp < staleTime) {
    return
  }

  // Skip if already prefetching, or if a live fetch for the same key is already in flight
  if (pendingPrefetch.has(key) || inflight.has(key)) {
    return
  }

  pendingPrefetch.add(key)

  try {
    const promise = fetcher()
    inflight.set(key, promise as Promise<{ data: unknown; error: string | null }>)
    const result = await promise
    if (result.data !== null) {
      cache.set(key, { data: result.data, timestamp: Date.now() })
    }
  } catch {
    // Silent fail - prefetch is best effort
  } finally {
    pendingPrefetch.delete(key)
    inflight.delete(key)
  }
}

// Check if data is cached
export function isCached(key: string): boolean {
  return cache.has(key)
}

// Get cached data directly (for SSR hydration or sync access)
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key) as CacheEntry<T> | undefined
  return cached?.data ?? null
}
