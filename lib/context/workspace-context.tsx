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

interface WorkspaceData {
  workspaceId: string
  userId: string
  userEmail: string
  userName: string
  userInitials: string
  role: string
  workspaceName: string
  planId: string
  plan: PlanData | null
  subscriptionStatus: string
  trialEndsAt: string | null
  trialDaysLeft: number | null
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceData>({
  workspaceId: '',
  userId: '',
  userEmail: '',
  userName: '',
  userInitials: '',
  role: '',
  workspaceName: '',
  planId: 'starter',
  plan: null,
  subscriptionStatus: 'trialing',
  trialEndsAt: null,
  trialDaysLeft: null,
  loading: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>({
    workspaceId: '',
    userId: '',
    userEmail: '',
    userName: '',
    userInitials: '',
    role: '',
    workspaceName: '',
    planId: 'starter',
    plan: null,
    subscriptionStatus: 'trialing',
    trialEndsAt: null,
    trialDaysLeft: null,
    loading: true,
  })

  useEffect(() => {
    async function load() {
      try {
        // Single optimized call for workspace + profile
        const result = await getWorkspaceWithProfile()

        if (result.data) {
          const fullName = result.data.userName
          const parts = fullName.split(' ')
          const initials = parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : fullName.substring(0, 2).toUpperCase()

          const workspace = result.data.workspace
          const trialEndsAt = workspace?.trial_ends_at || null
          let trialDaysLeft: number | null = null
          if (trialEndsAt) {
            const diff = new Date(trialEndsAt).getTime() - Date.now()
            trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
          }

          setData({
            workspaceId: result.data.workspaceId,
            userId: result.data.userId,
            userEmail: result.data.userEmail || '',
            userName: fullName,
            userInitials: initials,
            role: result.data.role,
            workspaceName: workspace?.name || 'Mi Empresa',
            planId: result.data.planId || 'starter',
            plan: result.data.plan || null,
            subscriptionStatus: workspace?.subscription_status || 'trialing',
            trialEndsAt,
            trialDaysLeft,
            loading: false,
          })
        } else {
          console.error('Workspace load error:', result.error)
          setData(prev => ({ ...prev, loading: false }))
        }
      } catch (err) {
        console.error('WorkspaceContext error:', err)
        setData(prev => ({ ...prev, loading: false }))
      }
    }
    load()
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
