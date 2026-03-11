'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-green-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Cuenta creada!</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Revisa tu email para confirmar tu cuenta.<br />Después podrás iniciar sesión.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all text-center"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-4">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-wider uppercase">
            OFIMATIC BAIX
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">CRM Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Crear Cuenta</h2>
            <p className="text-sm text-gray-400 mt-1">Empieza a gestionar tu negocio</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5 uppercase tracking-wider">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Crear Cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
