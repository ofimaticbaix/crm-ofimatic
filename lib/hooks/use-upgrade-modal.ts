'use client'

import { useState, useCallback } from 'react'

interface UpgradeModalState {
  isOpen: boolean
  feature: string
  currentLimit: number
  currentUsage: number
  planName: string
}

export function useUpgradeModal() {
  const [state, setState] = useState<UpgradeModalState>({
    isOpen: false,
    feature: '',
    currentLimit: 0,
    currentUsage: 0,
    planName: '',
  })

  const showUpgradeModal = useCallback(
    (feature: string, currentLimit: number, currentUsage: number, planName: string) => {
      setState({ isOpen: true, feature, currentLimit, currentUsage, planName })
    },
    []
  )

  const hideUpgradeModal = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    ...state,
    showUpgradeModal,
    hideUpgradeModal,
  }
}
