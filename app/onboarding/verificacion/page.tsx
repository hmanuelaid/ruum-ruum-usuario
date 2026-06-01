// app/onboarding/verificacion/page.tsx
'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function VerificacionPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const phone = typeof window !== 'undefined' ? sessionStorage.getItem('reg_phone') ?? '' : ''

  function handleInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...code]; next[i] = val; setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  async function verify() {
    if (code.join('').length < 6) { setError('Ingresa los 6 dígitos'); return }
    setLoading(true)
    setError('')

    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('reg_data') : null
    const reg = raw ? JSON.parse(raw) as {
      name?: string; phone?: string; email?: string; password?: string
    } : null

    if (!reg?.email || !reg.password || !reg.name) {
      setError('No encontramos los datos de registro. Vuelve a iniciar el registro.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    let authId: string | undefined

    // 1. Crear cuenta en auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: reg.email,
      password: reg.password,
    })

    if (signUpError) {
      // Si ya existe, intentar login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: reg.email,
        password: reg.password,
      })
      if (signInError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      authId = signInData.user.id
    } else {
      authId = signUpData.user?.id
    }

    if (!authId) {
      setError('No se pudo crear la sesión del usuario.')
      setLoading(false)
      return
    }

    // 2. Verificar si ya existe perfil en app_users
    const { data: existing } = await supabase
      .from('app_users')
      .select('id, name, phone, email')
      .eq('auth_id', authId)
      .maybeSingle()

    if (existing) {
      setUser({ id: existing.id, name: existing.name, phone: existing.phone ?? '', email: existing.email })
      router.push('/onboarding/documentos')
      return
    }

    // 3. Crear perfil en app_users — aquí es donde aparece en el admin
    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .insert({
        auth_id: authId,
        name: reg.name,
        email: reg.email,
        phone: reg.phone ?? '',
        type: 'personal',
        status: 'activo',
      })
      .select('id, name, phone, email')
      .single()

    if (profileError) {
      setError(`No se pudo crear el perfil: ${profileError.message}`)
      setLoading(false)
      return
    }

    setUser({ id: profile.id, name: profile.name, phone: profile.phone ?? '', email: profile.email })
    setLoading(false)
    router.push('/onboarding/documentos')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 2 de 3</div>
        <h1 className="onboarding-title">Confirma tus datos</h1>
        <p className="onboarding-sub">Ingresa el código que enviamos a <strong>{phone || 'tu teléfono'}</strong></p>

        <div className="otp-row">
          {code.map((d, i) => (
            <input key={i} ref={el => { inputs.current[i] = el }}
              className="otp-box" maxLength={1} value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} inputMode="numeric" />
          ))}
        </div>

        {error && <p className="field-error">{error}</p>}

        <button className="btn-primary" onClick={verify} disabled={loading}>
          {loading ? 'Creando tu cuenta…' : 'Continuar'}
        </button>
        <button className="btn-ghost" onClick={() => router.push('/onboarding/documentos')}>
          Omitir verificación
        </button>
      </div>
    </div>
  )
}