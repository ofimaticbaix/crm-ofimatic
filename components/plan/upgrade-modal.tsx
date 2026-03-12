'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Zap, Crown, ArrowRight, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  currentLimit: number
  currentUsage: number
  planName: string
}

const featureLabels: Record<string, string> = {
  contacts: 'contactos',
  companies: 'empresas',
  deals: 'oportunidades',
  users: 'usuarios',
  pipelines: 'pipelines',
}

const planLimits: Record<string, Record<string, number | null>> = {
  Pro: {
    contacts: 5000,
    companies: 500,
    deals: 1000,
    users: 10,
    pipelines: 5,
  },
  Enterprise: {
    contacts: null,
    companies: null,
    deals: null,
    users: null,
    pipelines: null,
  },
}

function formatLimit(value: number | null): string {
  if (value === null) return 'Ilimitado'
  return value.toLocaleString('es-ES')
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  feature,
  currentLimit,
  currentUsage,
  planName,
}: UpgradePlanModalProps) {
  const label = featureLabels[feature] || feature
  const usagePercent = currentLimit > 0 ? Math.min((currentUsage / currentLimit) * 100, 100) : 100

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg border border-white/10 bg-white/5 backdrop-blur-xl dark:bg-black/40 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-6">
          {/* Header with warning */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-lg font-semibold text-white dark:text-white">
                Limite alcanzado
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Has alcanzado el limite de {currentLimit.toLocaleString('es-ES')} {label} en tu plan {planName}
              </p>
            </div>
          </div>

          {/* Usage bar */}
          <div className="space-y-2 p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 capitalize">{label}</span>
              <span className="font-mono text-white font-medium">
                {currentUsage.toLocaleString('es-ES')}/{currentLimit.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {usagePercent >= 100
                ? 'Has usado todos los recursos disponibles'
                : `${Math.round(usagePercent)}% utilizado`}
            </p>
          </div>

          {/* Upgrade options */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Planes disponibles
            </p>

            {/* Pro Plan */}
            {planName !== 'Pro' && planName !== 'Enterprise' && (
              <div className="group relative p-4 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Pro</p>
                      <p className="text-xs text-gray-400">
                        {formatLimit(planLimits.Pro[feature] ?? null)} {label}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            )}

            {/* Enterprise Plan */}
            {planName !== 'Enterprise' && (
              <div className="group relative p-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Enterprise</p>
                      <p className="text-xs text-gray-400">
                        {formatLimit(planLimits.Enterprise[feature] ?? null)} {label}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              asChild
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:brightness-110 transition-all shadow-lg shadow-blue-500/25 border-0"
            >
              <Link href="/settings/billing" className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                Mejorar Plan
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 px-6 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
