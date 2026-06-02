// app/onboarding/verificacion/page.tsx
'use client'
import { useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

type RegistrationData = {
  name?: string
  phone?: string
  email?: string
}

function subscribeToStoredPhone() {
  return () => undefined
}

function getStoredPhone() {
  return sessionStorage.getItem('reg_phone') ?? ''
}

function getServerPhone() {
  return ''
}

export default function VerificacionPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const phone = useSyncExternalStore(subscribeToStoredPhone, getStoredPhone, getServerPhone)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...code]; next[i] = val; setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  function getRegistrationData(): RegistrationData | null {
    const raw = sessionStorage.getItem('reg_data')
    if (!raw) return null

    try {
      return JSON.parse(raw) as RegistrationData
    } catch {
      return null
    }
  }

  async function resendCode() {
    const reg = getRegistrationData()
    if (!reg?.phone) {
      setError('No encontramos el teléfono de registro. Vuelve a iniciar el registro.')
      return
    }

    setResending(true)
    setError('')

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: reg.phone,
      options: {
        channel: 'sms',
        data: {
          name: reg.name,
          email: reg.email,
        },
      },
    })

    if (otpError) {
      setError(`No pudimos reenviar el código: ${otpError.message}`)
    }

    setResending(false)
  }

  async function verify() {
    if (code.join('').length < 6) { setError('Ingresa los 6 dígitos'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    setError('')

    const reg = getRegistrationData()

    if (!reg?.email || !reg.name || !reg.phone) {
      setError('No encontramos los datos de registro. Vuelve a iniciar el registro.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const token = code.join('')

    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      phone: reg.phone,
      token,
      type: 'sms',
    })

    if (otpError || !otpData.user) {
      setError(otpError?.message ?? 'Código inválido o vencido.')
      setLoading(false)
      return
    }

    const phoneVerifiedAt = otpData.user.phone_confirmed_at ?? new Date().toISOString()
    const authId = otpData.user.id

    const { error: accountError } = await supabase.auth.updateUser({
      email: reg.email,
      password,
      data: {
        name: reg.name,
        user_type: 'personal',
      },
    })

    if (accountError) {
      await supabase.auth.signOut()
      setPassword('')
      setError(`Teléfono verificado, pero no se pudo crear la cuenta: ${accountError.message}`)
      setLoading(false)
      return
    }

    // 2. Verificar si ya existe perfil en app_users
    const { data: existing, error: existingError } = await supabase
      .from('app_users')
      .select('id, name, phone, email')
      .eq('auth_id', authId)
      .maybeSingle()

    if (existingError) {
      setError(`No se pudo consultar el perfil: ${existingError.message}`)
      setLoading(false)
      return
    }

    if (existing) {
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from('app_users')
        .update({
          name: reg.name,
          email: reg.email,
          phone: reg.phone,
          phone_verified_at: phoneVerifiedAt,
          identity_status: 'phone_verified',
        })
        .eq('id', existing.id)
        .select('id, name, phone, email')
        .single()

      if (updateProfileError) {
        setError(`No se pudo actualizar el perfil: ${updateProfileError.message}`)
        setLoading(false)
        return
      }

      sessionStorage.removeItem('reg_phone')
      sessionStorage.removeItem('reg_data')
      setPassword('')
      setUser({
        id: updatedProfile.id,
        name: updatedProfile.name,
        phone: updatedProfile.phone ?? '',
        email: updatedProfile.email,
      })
      router.push('/onboarding/documentos')
      return
    }

    // 3. Crear perfil en app_users con estado de identidad derivado del OTP verificado.
    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .insert({
        auth_id: authId,
        name: reg.name,
        email: reg.email,
        phone: reg.phone ?? '',
        phone_verified_at: phoneVerifiedAt,
        identity_status: 'phone_verified',
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

    sessionStorage.removeItem('reg_phone')
    sessionStorage.removeItem('reg_data')
    setPassword('')
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
        <p className="onboarding-sub">Ingresa el código que enviamos a <strong>{phone || 'tu teléfono'}</strong> y crea tu contraseña</p>

        <div className="otp-row">
          {code.map((d, i) => (
            <input key={i} ref={el => { inputs.current[i] = el }}
              className="otp-box" maxLength={1} value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} inputMode="numeric" />
          ))}
        </div>

        <label className="field-label">Contraseña</label>
        <input
          className="field-input"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && <p className="field-error">{error}</p>}

        <button className="btn-primary" onClick={verify} disabled={loading}>
          {loading ? 'Verificando…' : 'Verificar y continuar'}
        </button>
        <button className="btn-ghost" onClick={resendCode} disabled={loading || resending}>
          {resending ? 'Reenviando…' : 'Reenviar código'}
        </button>
      </div>
    </div>
  )
}
