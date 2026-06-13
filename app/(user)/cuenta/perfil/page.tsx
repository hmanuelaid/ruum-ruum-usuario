'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { clientLogger } from '@/lib/clientLogger'
import { createBrowserClient } from '@supabase/ssr'
import { useAuthStore, useAppStore } from '@/lib/store'
import type { User } from '@/lib/types'

function FieldGroup({ label, hint, id, children }: { label: string; hint?: string; id: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{
        fontSize: 12, fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{hint}</p>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 13, fontWeight: 700, color: 'var(--text)',
      margin: '8px 0 4px', paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </p>
  )
}

const toUpper = (v: string) => v.toUpperCase()

export default function PerfilPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { showToast } = useAppStore()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [form, setForm] = useState({
    // Datos personales
    nombres: '',
    apellidos: '',
    curp: '',
    phone: '',
    // Domicilio
    calle: '',
    numero: '',
    colonia: '',
    municipio: '',
    estado: '',
    codigoPostal: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError('')
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          router.replace('/login?redirectTo=/cuenta/perfil')
          return
        }

        setUserEmail(session.user.email || '')

        const { data, error: profileError } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()

        let profile = data

        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('app_users')
            .insert({
              auth_id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email,
              phone: session.user.user_metadata?.phone || '',
            })
            .select('*')
            .single()

          if (createError) throw createError
          profile = newProfile
        } else if (profileError) {
          throw profileError
        }

        if (profile) {
          // Intentar separar nombre guardado en nombre/apellido si se guardó junto
          const fullName: string = profile.name || ''
          const parts = fullName.split(' ')
          const storedNombres: string = profile.nombres || (parts.length > 0 ? parts[0] : '')
          const storedApellidos: string = profile.apellidos || (parts.length > 1 ? parts.slice(1).join(' ') : '')

          // Parsear address en campos individuales
          const address: string = profile.address || ''
          let calle = '', numero = '', colonia = '', municipio = '', estado = '', codigoPostal = ''
          if (profile.calle !== undefined) {
            calle = profile.calle || ''
            numero = profile.numero || ''
            colonia = profile.colonia || ''
            municipio = profile.municipio || ''
            estado = profile.state || profile.estado || ''
            codigoPostal = profile.codigo_postal || ''
          } else if (address) {
            // Compatibilidad con el campo address antiguo
            calle = address
          }

          setAvatarUrl(null)
          if (profile.avatar_url) {
            if (/^https?:\/\//i.test(profile.avatar_url)) {
              setAvatarUrl(profile.avatar_url)
            } else {
              const avatarRes = await fetch('/api/profile/avatar', { headers: { Accept: 'application/json' } })
              const avatarPayload = await avatarRes.json().catch(() => null) as
                | { ok: true; data: { avatar_url: string | null } }
                | { ok: false; error?: string }
                | null

              if (avatarRes.ok && avatarPayload?.ok) {
                setAvatarUrl(avatarPayload.data.avatar_url)
              }
            }
          }
          setForm({
            nombres: storedNombres.toUpperCase(),
            apellidos: storedApellidos.toUpperCase(),
            curp: (profile.curp || '').toUpperCase(),
            phone: profile.phone || '',
            calle: calle.toUpperCase(),
            numero: numero.toUpperCase(),
            colonia: colonia.toUpperCase(),
            municipio: municipio.toUpperCase(),
            estado: estado.toUpperCase(),
            codigoPostal: codigoPostal.toUpperCase(),
          })

          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
          } as User)
        }
      } catch (err) {
        clientLogger.error('Error loading profile:', err)
        setError(err instanceof Error ? err.message : 'No pudimos cargar tu perfil.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, setUser, supabase])

  const setField = useCallback((field: keyof typeof form, value: string) => {
    setForm(cur => ({ ...cur, [field]: value }))
  }, [])

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten imágenes (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no debe superar 5 MB.')
      return
    }

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 401) {
        router.replace('/login?redirectTo=/cuenta/perfil')
        return
      }

      const payload = await res.json().catch(() => null) as
        | { ok: true; data: { avatar_url: string } }
        | { ok: false; error?: string }
        | null

      if (!res.ok || !payload?.ok) {
        throw new Error(payload && !payload.ok ? (payload.error ?? 'No pudimos subir la foto.') : 'No pudimos subir la foto.')
      }

      setAvatarUrl(payload.data.avatar_url)
      showToast('Foto actualizada.')
    } catch (err) {
      clientLogger.error('Avatar upload error:', err)
      showToast(err instanceof Error ? err.message : 'No pudimos subir la foto. Intenta de nuevo.')
    } finally {
      setAvatarUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombres.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.apellidos.trim()) { setError('Los apellidos son obligatorios.'); return }

    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login?redirectTo=/cuenta/perfil')
        return
      }

      const fullName = `${form.nombres.trim()} ${form.apellidos.trim()}`.replace(/\s+/g, ' ')

      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          name: fullName,
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          curp: form.curp.trim() || null,
          phone: form.phone.trim() || null,
          calle: form.calle.trim() || null,
          numero: form.numero.trim() || null,
          colonia: form.colonia.trim() || null,
          municipio: form.municipio.trim() || null,
          state: form.estado.trim() || null,
          codigo_postal: form.codigoPostal.trim() || null,
          address: [form.calle, form.numero, form.colonia, form.municipio, form.estado, form.codigoPostal]
            .filter(Boolean).join(', ') || null,
        })
        .eq('auth_id', session.user.id)

      if (updateError) throw updateError

      setUser({ ...user!, name: fullName, phone: form.phone.trim() } as User)
      showToast('Perfil actualizado correctamente.')
      router.push('/cuenta')
    } catch (err) {
      clientLogger.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu perfil.')
    } finally {
      setSaving(false)
    }
  }, [form, router, setUser, showToast, supabase, user])

  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 16px',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Cargando perfil…</p>
      </div>
    )
  }

  const initials = [form.nombres[0], form.apellidos[0]].filter(Boolean).join('') || 'U'

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Editar perfil
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Actualiza tus datos personales
          </p>
        </div>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 16px',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Tarjeta de foto ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, padding: '20px 16px',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                overflow: 'hidden', background: 'var(--primary-dim)',
                border: '3px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Avatar desde URL firmada temporal de Supabase Storage.
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>
                    {initials}
                  </span>
                )}
                {avatarUploading && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                  }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>…</span>
                  </div>
                )}
              </div>
              {/* Badge cámara */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Cambiar foto"
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--primary)', border: '2px solid var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: 'var(--text)' }}>
                {form.nombres || 'Tu nombre'} {form.apellidos}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {userEmail}
              </p>
            </div>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                fontSize: 12, fontWeight: 600,
                color: 'var(--primary)', background: 'var(--primary-dim)',
                border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                padding: '6px 16px', cursor: 'pointer',
              }}
            >
              {avatarUploading ? 'Subiendo…' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* ── Sección: Datos de acceso ── */}
          <SectionTitle>Datos de acceso</SectionTitle>

          <FieldGroup label="Correo electrónico" hint="El correo no se puede modificar desde aquí." id="email">
            <input
              id="email"
              name="email"
              className="field-input"
              value={userEmail}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </FieldGroup>

          {/* ── Sección: Datos personales ── */}
          <SectionTitle>Datos personales</SectionTitle>

          <FieldGroup label="Nombre(s) *" id="nombres">
            <input
              id="nombres"
              name="nombres"
              className="field-input"
              value={form.nombres}
              onChange={e => setField('nombres', toUpper(e.target.value))}
              placeholder="JUAN CARLOS"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </FieldGroup>

          <FieldGroup label="Apellido(s) *" id="apellidos">
            <input
              id="apellidos"
              name="apellidos"
              className="field-input"
              value={form.apellidos}
              onChange={e => setField('apellidos', toUpper(e.target.value))}
              placeholder="GARCÍA LÓPEZ"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </FieldGroup>

          <FieldGroup label="CURP" id="curp">
            <input
              id="curp"
              name="curp"
              className="field-input"
              value={form.curp}
              onChange={e => setField('curp', toUpper(e.target.value))}
              placeholder="GARL900101HMCRZN08"
              maxLength={18}
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}
            />
          </FieldGroup>

          <FieldGroup label="Teléfono" hint="10 dígitos, sin código de país" id="phone">
            <input
              id="phone"
              name="phone"
              className="field-input"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={e => setField('phone', e.target.value.replace(/[^\d\s-]/g, ''))}
              placeholder="55 0000 0000"
            />
          </FieldGroup>

          {/* ── Sección: Domicilio ── */}
          <SectionTitle>Domicilio</SectionTitle>

          <FieldGroup label="Calle" id="calle">
            <input
              id="calle"
              name="calle"
              className="field-input"
              value={form.calle}
              onChange={e => setField('calle', toUpper(e.target.value))}
              placeholder="AV. INSURGENTES SUR"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </FieldGroup>

          <FieldGroup label="Número" id="numero">
            <input
              id="numero"
              name="numero"
              className="field-input"
              value={form.numero}
              onChange={e => setField('numero', toUpper(e.target.value))}
              placeholder="123 INT 4B"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </FieldGroup>

          <FieldGroup label="Colonia" id="colonia">
            <input
              id="colonia"
              name="colonia"
              className="field-input"
              value={form.colonia}
              onChange={e => setField('colonia', toUpper(e.target.value))}
              placeholder="DEL VALLE"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </FieldGroup>

          <FieldGroup label="Municipio / Alcaldía" id="municipio">
            <input
              id="municipio"
              name="municipio"
              className="field-input"
              value={form.municipio}
              onChange={e => setField('municipio', toUpper(e.target.value))}
              placeholder="BENITO JUÁREZ"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </FieldGroup>

          <FieldGroup label="Estado" id="estado">
            <input
              id="estado"
              name="estado"
              className="field-input"
              value={form.estado}
              onChange={e => setField('estado', toUpper(e.target.value))}
              placeholder="CIUDAD DE MÉXICO"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </FieldGroup>

          <FieldGroup label="Código Postal" id="codigoPostal">
            <input
              id="codigoPostal"
              name="codigoPostal"
              className="field-input"
              value={form.codigoPostal}
              onChange={e => setField('codigoPostal', e.target.value.replace(/[^\dA-Za-z]/g, '').toUpperCase())}
              placeholder="03100"
              inputMode="numeric"
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
            />
          </FieldGroup>

          {error && (
            <p style={{
              fontSize: 12, color: 'var(--danger)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '10px 12px', margin: 0,
            }} role="alert">
              {error}
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </>
  )
}
