import { redirect } from 'next/navigation'
import { acceptInvitation } from '@/lib/actions/invitations'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="max-w-md w-full mx-4 p-8 rounded-2xl bg-gray-900 border border-gray-800 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Enlace invalido</h1>
          <p className="text-gray-400 mb-6">El enlace de invitacion no es valido.</p>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
            Ir al inicio
          </a>
        </div>
      </div>
    )
  }

  const result = await acceptInvitation(token)

  // Si no esta autenticado, redirigir a login con redirect
  if (result.error === 'not_authenticated') {
    redirect(`/login?redirect=/invite/${token}`)
  }

  // Si fue exitoso, redirigir al dashboard
  if (result.data) {
    redirect('/dashboard')
  }

  // Mostrar error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full mx-4 p-8 rounded-2xl bg-gray-900 border border-gray-800 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">No se pudo aceptar la invitacion</h1>
        <p className="text-gray-400 mb-6">{result.error}</p>
        <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
          Ir al inicio
        </a>
      </div>
    </div>
  )
}
