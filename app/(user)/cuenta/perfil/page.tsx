'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useAppStore } from '@/lib/store'
import type { User } from '@/lib/types'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
  country?: string | null
  state?: string | null
  address?: string | null
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export default function PerfilPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { showToast } = useAppStore()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    country: '',
    state: '',
    address: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/profile', {
          headers: { Accept: 'application/json' },
        })

        if (response.status === 401) {
          router.replace('/login?redirectTo=/cuenta/perfil')
          return
        }

        const payload = (await response.json().catch(() => null)) as ApiResponse<UserProfile> | null

        if (!response.ok || !payload?.ok) {
          throw new Error(
            payload && !payload.ok
              ? payload.error ?? 'No pudimos cargar tu perfil.'
              : 'No pudimos cargar tu perfil.',
          )
        }

        setForm({
          name: payload.data.name ?? '',
          phone: payload.data.phone ?? '',
          country: payload.data.country ?? '',
          state: payload.data.state ?? '',
          address: payload.data.address ?? '',
        })

        // ✅ Ahora todos los campos existen en el tipo User
        const updatedUser: User = {
          id: payload.data.id,
          name: payload.data.name,
          email: payload.data.email,
          phone: payload.data.phone ?? '',
          country: payload.data.country ?? '',
          state: payload.data.state ?? '',
          address: payload.data.address ?? '',
        }
        
        setUser(updatedUser)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos cargar tu perfil.')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [router, setUser])

  const setField = useCallback((field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    if (form.phone && !validatePhone(form.phone)) {
      setError('Formato de teléfono inválido. Usa formato internacional (+525500000000)')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          state: form.state.trim() || null,
          address: form.address.trim() || null,
        }),
      })

      const payload = (await response.json().catch(() => null)) as ApiResponse<UserProfile> | null

      if (response.status === 401) {
        router.replace('/login?redirectTo=/cuenta/perfil')
        return
      }

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload && !payload.ok
            ? payload.error ?? 'No pudimos guardar tu perfil.'
            : 'No pudimos guardar tu perfil.',
        )
      }

      // ✅ Actualizar todos los campos del usuario
      const updatedUser: User = {
        id: payload.data.id,
        name: payload.data.name,
        email: payload.data.email,
        phone: payload.data.phone ?? '',
        country: payload.data.country ?? '',
        state: payload.data.state ?? '',
        address: payload.data.address ?? '',
      }
      
      setUser(updatedUser)
      showToast('Perfil actualizado correctamente.')
      router.push('/cuenta')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu perfil.')
    } finally {
      setSaving(false)
    }
  }, [form.name, form.phone, form.country, form.state, form.address, router, setUser, showToast])

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <button className="btn-back" type="button" onClick={() => router.back()}>
            ← Atrás
          </button>

          <p className="eyebrow">Mi cuenta</p>
          <h1>Editar perfil</h1>
          <p className="muted">Actualiza tus datos personales.</p>
        </div>
      </section>

      <section className="card">
        {loading ? (
          <p className="muted">Cargando perfil…</p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-label">Nombre completo *</label>
            <input
              className="field-input"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Tu nombre"
              required
            />

            <label className="field-label">Teléfono</label>
            <input
              className="field-input"
              type="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              placeholder="+525500000000"
            />
            <p className="field-hint">Formato internacional: + código país y número</p>

            <label className="field-label">País</label>
            <input
              className="field-input"
              value={form.country}
              onChange={(event) => setField('country', event.target.value)}
              placeholder="Tu país"
            />

            <label className="field-label">Estado/Provincia</label>
            <input
              className="field-input"
              value={form.state}
              onChange={(event) => setField('state', event.target.value)}
              placeholder="Tu estado o provincia"
            />

            <label className="field-label">Dirección</label>
            <textarea
              className="field-input"
              value={form.address}
              onChange={(event) => setField('address', event.target.value)}
              placeholder="Tu dirección completa"
              rows={3}
            />

            {user?.email && (
              <>
                <label className="field-label">Correo electrónico</label>
                <input 
                  className="field-input" 
                  value={user.email} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <p className="field-hint">El correo electrónico no se puede modificar desde aquí.</p>
              </>
            )}

            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}

            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        )}
      </section>

      <style jsx>{`
        .field-hint {
          font-size: 0.75rem;
          color: #666;
          margin-top: -0.5rem;
          margin-bottom: 1rem;
        }
        textarea.field-input {
          resize: vertical;
          min-height: 80px;
        }
      `}</style>
    </main>
  )
}