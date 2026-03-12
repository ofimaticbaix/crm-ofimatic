'use client'

import { Zap, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface UpgradeBannerProps {
  message: string
  current?: number
  max?: number | null
  feature?: string
  dismissible?: boolean
}

export function UpgradeBanner({ message, current, max, feature, dismissible = true }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
        <Zap className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{message}</p>
        {current !== undefined && max !== null && max !== undefined && (
          <p className="text-xs text-gray-400 mt-0.5">
            Usando {current} de {max} disponibles
          </p>
        )}
      </div>
      <Link
        href="/settings/billing"
        className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-amber-500/25"
      >
        Mejorar Plan
      </Link>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  hasFeature: boolean
}

export function FeatureGate({ feature, children, fallback, hasFeature }: FeatureGateProps) {
  if (hasFeature) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-2xl">
        <Link
          href="/settings/billing"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg"
        >
          <Zap className="h-4 w-4" />
          Disponible en plan superior
        </Link>
      </div>
    </div>
  )
}
