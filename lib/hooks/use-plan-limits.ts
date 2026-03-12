'use client'

import { useWorkspace } from '@/lib/context/workspace-context'

export function usePlanLimits() {
  const { plan, planId, subscriptionStatus, trialDaysLeft } = useWorkspace()

  const hasFeature = (feature: string): boolean => {
    if (!plan?.features) return false
    return plan.features[feature] === true
  }

  const getLimit = (resource: 'max_users' | 'max_contacts' | 'max_companies' | 'max_deals' | 'max_pipelines'): number | null => {
    if (!plan) return 0
    return plan[resource]
  }

  const isUnlimited = (resource: 'max_users' | 'max_contacts' | 'max_companies' | 'max_deals' | 'max_pipelines'): boolean => {
    return getLimit(resource) === null
  }

  const isPlan = (id: string): boolean => planId === id

  const isTrialing = subscriptionStatus === 'trialing'
  const isActive = subscriptionStatus === 'active'

  return {
    plan,
    planId,
    hasFeature,
    getLimit,
    isUnlimited,
    isPlan,
    isTrialing,
    isActive,
    trialDaysLeft,
    subscriptionStatus,
  }
}
