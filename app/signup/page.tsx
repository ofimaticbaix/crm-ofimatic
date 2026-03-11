'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">¡Cuenta creada!</h2>
            <p className="text-gray-400 mb-6">
              Revisa tu email para confirmar tu cuenta. Después podrás iniciar sesión.
            </p>
            <Link href="/login">
              <Button className="rounded-xl">Ir a Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Crear Cuenta</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Empieza a gestionar tu negocio</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Nombre completo</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
              />
            </div>
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
                placeholder="Mínimo 6 caracteres"
                required
                className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all h-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear Cuenta'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
