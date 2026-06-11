'use client'

import { useEffect, useState, useCallback } from 'react'
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

const validatePhone = (phone: string): boolean => {
  if (!phone) return true
  return /^\+?[1-9]\d{1,14}$/.test(phone)
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { showToast } = useAppStore()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [form, setForm] = useState({
    name: '', phone: '', country: '', state: '', address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
              country: null,
              state: null,
              address: null,
            })
            .select('*')
            .single()

          if (createError) throw createError
          profile = newProfile
        } else if (profileError) {
          throw profileError
        }

        if (profile) {
          setForm({
            name: profile.name || '',
            phone: profile.phone || '',
            country: profile.country || '',
            state: profile.state || '',
            address: profile.address || '',
          })
          
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            country: profile.country || '',
            state: profile.state || '',
            address: profile.address || '',
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    if (form.phone && !validatePhone(form.phone)) {
      setError('Formato de teléfono inválido. Usa +525500000000')
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login?redirectTo=/cuenta/perfil')
        return
      }

      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          state: form.state.trim() || null,
          address: form.address.trim() || null,
        })
        .eq('auth_id', session.user.id)

      if (updateError) throw updateError

      setUser({
        ...user!,
        name: form.name.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        address: form.address.trim(),
      } as User)

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

  return (
    <>
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
          <FieldGroup label="Nombre completo *" id="name">
            <input
              id="name"
              name="name"
              className="field-input"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </FieldGroup>

          <FieldGroup label="Teléfono" hint="Formato internacional: +52 seguido del número" id="phone">
            <input
              id="phone"
              name="phone"
              className="field-input"
              type="tel"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="+525500000000"
            />
          </FieldGroup>

          <FieldGroup label="País" id="country">
            <input
              id="country"
              name="country"
              className="field-input"
              value={form.country}
              onChange={e => setField('country', e.target.value)}
              placeholder="Tu país"
            />
          </FieldGroup>

          <FieldGroup label="Estado / Provincia" id="state">
            <input
              id="state"
              name="state"
              className="field-input"
              value={form.state}
              onChange={e => setField('state', e.target.value)}
              placeholder="Tu estado o provincia"
            />
          </FieldGroup>

          <FieldGroup label="Dirección" id="address">
            <textarea
              id="address"
              name="address"
              className="field-input"
              value={form.address}
              onChange={e => setField('address', e.target.value)}
              placeholder="Tu dirección completa"
              rows={3}
              style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
            />
          </FieldGroup>

          {user?.email && (
            <FieldGroup label="Correo electrónico" hint="El correo no se puede modificar desde aquí." id="email">
              <input
                id="email"
                name="email"
                className="field-input"
                value={user.email}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </FieldGroup>
          )}

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