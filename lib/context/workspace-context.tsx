'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getWorkspaceWithProfile } from '@/lib/actions/workspace'

interface PlanData {
  id: string
  name: string
  max_users: number | null
  max_contacts: number | null
  max_companies: number | null
  max_deals: number | null
  max_pipelines: number | null
  features: Record<string, boolean>
}

// Forma cruda devuelta por getWorkspaceWithProfile — la que el server passa al
// provider para evitar el flash de defaults en la primera renderización.
export interface WorkspaceInitialPayload {
  userId: string
  userEmail: string | null | undefined
  userName: string
  workspaceId: string
  role: string
  workspace: any
  plan: PlanData | null
  planId: string
}

interface WorkspaceData {
  workspaceId: string
  userId: string
  userEmail: string
  userName: string
  userInitials: string
  role: string
  workspaceName: string
  appSubtitle: string | null
  logoUrl: string | null
  backgroundUrl: string | null
  backgroundColor: 'white' | 'black' | 'image' | 'default' | null
  planId: string
  plan: PlanData | null
  subscriptionStatus: string
  trialEndsAt: string | null
  trialDaysLeft: number | null
  loading: boolean
  refresh: () => Promise<void>
}

const EMPTY_DATA: WorkspaceData = {
  workspaceId: '',
  userId: '',
  userEmail: '',
  userName: '',
  userInitials: '',
  role: '',
  workspaceName: '',
  appSubtitle: null,
  logoUrl: null,
  backgroundUrl: null,
  backgroundColor: null,
  planId: 'starter',
  plan: null,
  subscriptionStatus: 'trialing',
  trialEndsAt: null,
  trialDaysLeft: null,
  loading: true,
  refresh: async () => {},
}

const WorkspaceContext = createContext<WorkspaceData>(EMPTY_DATA)

function buildData(payload: WorkspaceInitialPayload): Omit<WorkspaceData, 'refresh' | 'loading'> {
  const fullName = payload.userName
  const parts = fullName.split(' ')
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : fullName.substring(0, 2).toUpperCase()

  const workspace = payload.workspace
  const trialEndsAt = workspace?.trial_ends_at || null
  let trialDaysLeft: number | null = null
  if (trialEndsAt) {
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return {
    workspaceId: payload.workspaceId,
    userId: payload.userId,
    userEmail: payload.userEmail || '',
    userName: fullName,
    userInitials: initials,
    role: payload.role,
    workspaceName: workspace?.name || 'Mi Empresa',
    appSubtitle: workspace?.app_subtitle || null,
    logoUrl: workspace?.logo_url || null,
    backgroundUrl: workspace?.background_url || null,
    backgroundColor: workspace?.background_color || null,
    planId: payload.planId || 'starter',
    plan: payload.plan || null,
    subscriptionStatus: workspace?.subscription_status || 'trialing',
    trialEndsAt,
    trialDaysLeft,
  }
}

export function WorkspaceProvider({
  children,
  initialData,
}: {
  children: ReactNode
  initialData?: WorkspaceInitialPayload | null
}) {
  // Si el server nos pasó datos, los usamos como initial state — sin loading,
  // sin flash de "OFIMATIC BAIX" o background.png.
  const [data, setData] = useState<WorkspaceData>(() => {
    if (initialData) {
      return { ...EMPTY_DATA, ...buildData(initialData), loading: false }
    }
    return EMPTY_DATA
  })

  const load = async () => {
    try {
      const result = await getWorkspaceWithProfile()
      if (result.data) {
        setData(prev => ({
          ...prev,
          ...buildData(result.data!),
          loading: false,
        }))
      } else {
        console.error('Workspace load error:', result.error)
        setData(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      console.error('WorkspaceContext error:', err)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    setData(prev => ({ ...prev, refresh: load }))
    // Si ya teníamos datos del server, no hace falta volver a cargarlos en el
    // primer render. El refresh manual sigue disponible para mutaciones.
    if (!initialData) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <WorkspaceContext.Provider value={data}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
