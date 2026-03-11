'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0a0b14]">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/images/background.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b14] via-[#0a0b14]/80 to-indigo-950/90" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[150px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Left side - Branding (hidden on mobile) */}
      <div className={`hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                OFIMATIC BAIX
              </span>
              <span className="text-[10px] text-gray-500">CRM Platform</span>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="max-w-md">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Gestiona tu negocio de forma{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              inteligente
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Un CRM moderno diseñado para equipos de ventas que necesitan resultados, no complicaciones.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {['Pipeline visual', 'Contactos ilimitados', 'Métricas en tiempo real', 'Importación masiva'].map((feature) => (
              <span
                key={feature}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex gap-8">
          {[
            { value: '100%', label: 'Privacidad' },
            { value: '<1min', label: 'Setup' },
            { value: '€0', label: 'Para empezar' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className={`w-full max-w-[420px] transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-3">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
              OFIMATIC BAIX
            </span>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-7 md:p-9 shadow-[0_0_80px_-20px_rgba(59,130,246,0.1)]">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
              <p className="text-sm text-gray-500 mt-1.5">Inicia sesión en tu cuenta</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/15 text-sm text-red-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/[0.06] transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 block">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/[0.06] transition-all text-sm pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-white/[0.06]">
              <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Crear cuenta gratis
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className={`mt-6 flex items-center justify-center gap-4 text-[11px] text-gray-600 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              SSL Seguro
            </span>
            <span className="w-px h-3 bg-gray-800" />
            <span>GDPR Compliant</span>
            <span className="w-px h-3 bg-gray-800" />
            <span>Datos en Europa</span>
          </div>
        </div>
      </div>
    </div>
  )
}
