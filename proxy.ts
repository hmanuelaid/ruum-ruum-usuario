// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasUserAccess } from '@/lib/auth-guards'

const PRIVATE_REDIRECT = '/login'
const USER_ROUTES = [
  '/inicio',
  '/solicitar',
  '/viajes',
  '/evidencia',
  '/soporte',
  '/notificaciones',
  '/cuenta',
  '/onboarding/documentos',
   '/api/profile',       
  '/api/user',    
]

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(cookie => {
    target.cookies.set(cookie)
  })
  return target
}

function redirectTo(request: NextRequest, path: string, authResponse: NextResponse) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = path
  loginUrl.search = ''
  loginUrl.searchParams.set('redirectTo', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return copyAuthCookies(authResponse, NextResponse.redirect(loginUrl))
}

export async function proxy(request: NextRequest) {
  if (!matchesRoute(request.nextUrl.pathname, USER_ROUTES)) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new NextResponse('Missing Supabase environment variables.', { status: 500 })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })

          Object.entries(headersToSet).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        },
      },
    },
  )

  // 🔥 MEJORA: Usar getSession en lugar de getUser para validación inicial
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return redirectTo(request, PRIVATE_REDIRECT, response)
  }

  // Solo si hay sesión, obtener el usuario completo
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return redirectTo(request, PRIVATE_REDIRECT, response)
  }

  if (!(await hasUserAccess(supabase, user))) {
    return redirectTo(request, PRIVATE_REDIRECT, response)
  }

  return response
}

export const middleware = proxy

export const config = {
  matcher: [
    '/inicio/:path*',
    '/solicitar/:path*',
    '/viajes/:path*',
    '/evidencia/:path*',
    '/soporte/:path*',
    '/notificaciones/:path*',
    '/cuenta/:path*',
    '/onboarding/documentos/:path*',
    '/api/profile',      // 
    '/api/user',         // 
  ],
}

