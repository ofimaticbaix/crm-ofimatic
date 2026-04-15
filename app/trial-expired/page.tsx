'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CreditCard, Check, Zap, Crown, LogOut, Loader2, ShieldAlert, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceYearly: 290,
    features: ['3 usuarios', '500 contactos', '100 empresas', '50 oportunidades', 'Import CSV/Excel', 'Email integration', 'Campos personalizados'],
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: 79,
    priceYearly: 790,
    popular: true,
    features: ['10 usuarios', '5,000 contactos', '500 empresas', 'Deals ilimitados', 'Asistente IA', 'WhatsApp integration', 'Reports avanzados', 'Acceso API'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceYearly: 1990,
    features: ['Usuarios ilimitados', 'Contactos ilimitados', 'Empresas ilimitadas', 'Deals ilimitados', 'White Label', 'Soporte prioritario', 'Todo incluido'],
  },
]

type AccountState = 'inactive' | 'expired' | 'loading'

export default function TrialExpiredPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [accountState, setAccountState] = useState<AccountState>('loading')

  useEffect(() => {
    setMounted(true)
    checkAccountState()
  }, [])

  const checkAccountState = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setAccountState('expired')
      return
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id, workspaces(subscription_status)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membership) {
      const workspace = membership.workspaces as any
      const status = workspace?.subscription_status
      if (status === 'inactive') {
        setAccountState('inactive')
      } else {
        setAccountState('expired')
      }
    } else {
      setAccountState('expired')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Inactive state - pending activation by admin
  if (accountState === 'inactive') {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex flex-col relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <span className="text-sm font-bold text-white tracking-wider">OFIMATIC BAIX</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/25">
            <ShieldAlert className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
            Tu cuenta esta pendiente de activacion
          </h1>
          <p className="text-gray-400 text-center max-w-lg mb-6">
            Tu registro se ha completado correctamente. Un administrador debe activar tu cuenta antes de que puedas acceder al CRM.
          </p>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 max-w-md w-full text-center">
            <Mail className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-300 mb-2">
              Para solicitar la activacion, contacta con el equipo comercial:
            </p>
            <a
              href="mailto:comercial@ofimaticbaix.com"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all mt-2"
            >
              <Mail className="h-4 w-4" />
              comercial@ofimaticbaix.com
            </a>
          </div>

          <p className="text-xs text-gray-600 mt-8 text-center">
            Recibiras un email de confirmacion cuando tu cuenta sea activada.
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (accountState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  // Expired/canceled state - show pricing plans
  return (
    <div className="min-h-screen bg-[#0a0b14] flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
          <span className="text-sm font-bold text-white tracking-wider">OFIMATIC BAIX</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Expired badge */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-6 shadow-2xl shadow-red-500/25">
          <Clock className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          Tu periodo de prueba ha finalizado
        </h1>
        <p className="text-gray-400 text-center max-w-lg mb-2">
          Los 14 dias de prueba gratuita han terminado. Elige un plan para seguir usando el CRM con todas tus funcionalidades y datos intactos.
        </p>
        <p className="text-sm text-emerald-400 text-center mb-8">
          Tus datos estan seguros y se mantienen al activar cualquier plan.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              billingPeriod === 'yearly'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Anual
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">-17%</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.price : Math.round(plan.priceYearly / 12 * 100) / 100
            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border transition-all hover:scale-[1.02] ${
                  plan.popular
                    ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold">
                      Recomendado
                    </span>
                  </div>
                )}

                <div className="text-center mb-5 mt-1">
                  <div className="flex items-center justify-center mb-2">
                    {plan.id === 'enterprise' ? (
                      <Crown className="h-6 w-6 text-amber-400" />
                    ) : plan.id === 'pro' ? (
                      <Zap className="h-6 w-6 text-amber-400" />
                    ) : (
                      <CreditCard className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-white">{price}&euro;</span>
                    <span className="text-sm text-gray-400">/mes</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-xs text-gray-500 mt-1">{plan.priceYearly}&euro;/ano</p>
                  )}
                </div>

                <div className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => toast.info(`Próximamente: Checkout Stripe para plan ${plan.name}`)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:brightness-110'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                  }`}
                >
                  Activar {plan.name}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-600 mt-8 text-center">
          Puedes cancelar en cualquier momento. Sin permanencia.
        </p>
      </div>
    </div>
  )
}
