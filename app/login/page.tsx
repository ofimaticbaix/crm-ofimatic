'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Accede a tu CRM</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all h-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
