'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentWorkspace, getUserProfile } from '@/lib/actions/workspace'

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
        const [wsResult, profileResult] = await Promise.all([
          getCurrentWorkspace().catch(() => ({ data: null, error: 'Failed' })),
          getUserProfile().catch(() => ({ data: null, error: 'Failed' })),
        ])

        if (wsResult.data) {
          const fullName = profileResult.data?.full_name || wsResult.data.userEmail?.split('@')[0] || 'Usuario'
          const parts = fullName.split(' ')
          const initials = parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : fullName.substring(0, 2).toUpperCase()

          const workspace = wsResult.data.workspace
          const trialEndsAt = workspace?.trial_ends_at || null
          let trialDaysLeft: number | null = null
          if (trialEndsAt) {
            const diff = new Date(trialEndsAt).getTime() - Date.now()
            trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
          }

          setData({
            workspaceId: wsResult.data.workspaceId,
            userId: wsResult.data.userId,
            userEmail: wsResult.data.userEmail || '',
            userName: fullName,
            userInitials: initials,
            role: wsResult.data.role,
            workspaceName: workspace?.name || 'Mi Empresa',
            planId: wsResult.data.planId || 'starter',
            plan: wsResult.data.plan || null,
            subscriptionStatus: workspace?.subscription_status || 'trialing',
            trialEndsAt,
            trialDaysLeft,
            loading: false,
          })
        } else {
          console.error('Workspace load error:', wsResult.error)
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
