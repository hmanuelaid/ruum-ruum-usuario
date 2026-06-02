'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string }

export default function PerfilPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { showToast } = useAppStore()

  const [form, setForm] = useState({
    name: '',
    phone: '',
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
        })

        setUser({
          id: payload.data.id,
          name: payload.data.name,
          email: payload.data.email,
          phone: payload.data.phone ?? '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos cargar tu perfil.')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [router, setUser])

  function set(field: 'name' | 'phone', value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
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
          phone: form.phone.trim(),
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

      setUser({
        id: payload.data.id,
        name: payload.data.name,
        email: payload.data.email,
        phone: payload.data.phone ?? '',
      })

      showToast('Perfil actualizado.')
      router.push('/cuenta')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu perfil.')
    } finally {
      setSaving(false)
    }
  }

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
            <label className="field-label">Nombre completo</label>
            <input
              className="field-input"
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder="Tu nombre"
              required
            />

            <label className="field-label">Teléfono</label>
            <input
              className="field-input"
              type="tel"
              value={form.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder="+525500000000"
            />

            {user?.email && (
              <>
                <label className="field-label">Correo electrónico</label>
                <input className="field-input" value={user.email} disabled />
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
    </main>
  )
}
