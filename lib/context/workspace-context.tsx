'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentWorkspace, getUserProfile } from '@/lib/actions/workspace'

interface WorkspaceData {
  workspaceId: string
  userId: string
  userEmail: string
  userName: string
  userInitials: string
  role: string
  workspaceName: string
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
    loading: true,
  })

  useEffect(() => {
    async function load() {
      const [wsResult, profileResult] = await Promise.all([
        getCurrentWorkspace(),
        getUserProfile(),
      ])

      if (wsResult.data) {
        const fullName = profileResult.data?.full_name || wsResult.data.userEmail?.split('@')[0] || 'Usuario'
        const parts = fullName.split(' ')
        const initials = parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : fullName.substring(0, 2).toUpperCase()

        setData({
          workspaceId: wsResult.data.workspaceId,
          userId: wsResult.data.userId,
          userEmail: wsResult.data.userEmail || '',
          userName: fullName,
          userInitials: initials,
          role: wsResult.data.role,
          workspaceName: wsResult.data.workspace?.name || 'Mi Empresa',
          loading: false,
        })
      } else {
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
