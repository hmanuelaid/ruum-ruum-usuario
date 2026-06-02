import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PRIVATE_REDIRECT = '/login'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = PRIVATE_REDIRECT
    loginUrl.searchParams.set(
      'redirectTo',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )

    return NextResponse.redirect(loginUrl)
  }

  return response
}

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
  ],
}
