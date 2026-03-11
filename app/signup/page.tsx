'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b14] p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-green-500/15 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/3 -right-20 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        </div>

        <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-9 shadow-[0_0_80px_-20px_rgba(16,185,129,0.1)] text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-green-500/25 animate-[bounce_2s_ease-in-out_1]">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Cuenta creada!</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Hemos enviado un email de confirmación.<br />
              Revísalo para activar tu cuenta.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:brightness-110 transition-all group"
            >
              Ir a Iniciar Sesión
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0a0b14]">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/images/background.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b14] via-[#0a0b14]/80 to-indigo-950/90" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Left side - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 relative z-10 flex-col items-center justify-center p-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                OFIMATIC BAIX
              </span>
              <span className="text-[10px] text-gray-500">CRM Platform</span>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Empieza a{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              vender más
            </span>{' '}
            hoy mismo
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Crea tu cuenta gratis en menos de un minuto. Sin tarjeta de crédito, sin compromisos.
          </p>

          {/* What you get */}
          <div className="mt-8 space-y-3 text-left inline-block">
            {[
              'Pipeline de ventas visual con Kanban',
              'Gestión de contactos y empresas ilimitada',
              'Importación desde CSV, Excel y Access',
              'Métricas y dashboards en tiempo real',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mt-10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Más de 100 empresas confían en nosotros</span>
          </div>
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
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-7 md:p-9 shadow-[0_0_80px_-20px_rgba(99,102,241,0.1)]">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white">Crear Cuenta</h2>
              <p className="text-sm text-gray-500 mt-1.5">Empieza gratis, actualiza cuando quieras</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/15 text-sm text-red-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 block">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/[0.06] transition-all text-sm"
                />
              </div>

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
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
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
                    Crear Cuenta Gratis
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-gray-600 text-center mt-4">
              Al crear tu cuenta aceptas los términos de servicio y política de privacidad
            </p>

            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Iniciar sesión
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
