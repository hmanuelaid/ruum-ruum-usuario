// middleware.ts — App: GeneraViajes (Usuario)
// Ubicación: raíz del proyecto (mismo nivel que /app)
// Protege todas las rutas autenticadas antes de que React cargue

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas públicas que NO requieren sesión
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]

// Rutas de API públicas (ej. webhooks)
const PUBLIC_API_ROUTES = ['/api/webhooks']

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
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

  // ⚠️ IMPORTANTE: Usar getUser() — verifica contra el servidor de Auth.
  // NUNCA usar getSession() aquí — lee solo del storage y puede ser manipulado.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Permitir rutas públicas sin sesión
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )
  const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isPublicRoute || isPublicApi) {
    // Si ya tiene sesión activa e intenta acceder a /login → redirigir al home
    if (user && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Sin sesión → redirigir a login guardando la ruta original
  if (!user || error) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Sesión válida → continuar
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas EXCEPTO:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos con extensión (ej. .svg, .png)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}