'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
            <h2 className="text-xl font-bold text-white">Iniciar Sesión</h2>
            <p className="text-sm text-gray-400 mt-1">Accede a tu CRM</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

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
                  placeholder="••••••••"
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
