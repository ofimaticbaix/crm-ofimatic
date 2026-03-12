import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Admin emails that bypass all restrictions
const ADMIN_EMAILS = ['alex@ofimaticbaix.com', 'a.saumellortuno98@gmail.com']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas publicas que no requieren auth
  const publicPaths = ['/login', '/signup', '/auth/callback', '/trial-expired', '/api/v1/', '/api/webhooks/', '/invite/', '/admin']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path)) || request.nextUrl.pathname === '/'

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si ya esta logueado y va a login/signup, redirigir a dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin emails bypass all subscription checks
  if (user && ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return supabaseResponse
  }

  // Verificar trial/suscripcion para usuarios autenticados en rutas protegidas
  if (user && !isPublicPath) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id, workspaces(subscription_status, trial_ends_at)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membership) {
      const workspace = membership.workspaces as any
      const status = workspace?.subscription_status
      const trialEndsAt = workspace?.trial_ends_at

      // Trial expirado?
      const isTrialing = status === 'trialing'
      const trialExpired = isTrialing && trialEndsAt && new Date(trialEndsAt) < new Date()

      // Suscripcion bloqueada?
      const isBlocked = status === 'expired' || status === 'canceled' || status === 'inactive'

      if (trialExpired || isBlocked) {
        if (request.nextUrl.pathname !== '/trial-expired') {
          const url = request.nextUrl.clone()
          url.pathname = '/trial-expired'
          return NextResponse.redirect(url)
        }
      } else if (request.nextUrl.pathname === '/trial-expired') {
        // Si el trial esta activo, no dejar ver la pagina de expired
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
