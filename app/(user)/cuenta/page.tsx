'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
}

type Vehicle = {
  id: string
  vehicle_brand?: string | null
  vehicle_model?: string | null
  vehicle_year?: number | null
  vehicle_plates?: string | null
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string }

export default function CuentaPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, setUser, logout } = useAuthStore()
  const { showToast } = useAppStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function loadAccount() {
      setLoading(true)
      setError('')

      try {
        const [profileResponse, vehiclesResponse] = await Promise.all([
          fetch('/api/profile', { headers: { Accept: 'application/json' } }),
          fetch('/api/vehicles', { headers: { Accept: 'application/json' } }),
        ])

        if (profileResponse.status === 401 || vehiclesResponse.status === 401) {
          router.replace('/login')
          return
        }

        const profilePayload =
          (await profileResponse.json().catch(() => null)) as ApiResponse<UserProfile> | null

        const vehiclesPayload =
          (await vehiclesResponse.json().catch(() => null)) as ApiResponse<Vehicle[]> | null

        if (!profileResponse.ok || !profilePayload?.ok) {
          throw new Error(
            profilePayload && !profilePayload.ok
              ? profilePayload.error ?? 'No pudimos cargar tu perfil.'
              : 'No pudimos cargar tu perfil.',
          )
        }

        if (!vehiclesResponse.ok || !vehiclesPayload?.ok) {
          throw new Error(
            vehiclesPayload && !vehiclesPayload.ok
              ? vehiclesPayload.error ?? 'No pudimos cargar tus vehículos.'
              : 'No pudimos cargar tus vehículos.',
          )
        }

        setProfile(profilePayload.data)
        setVehicles(vehiclesPayload.data)

        setUser({
          id: profilePayload.data.id,
          name: profilePayload.data.name,
          email: profilePayload.data.email,
          phone: profilePayload.data.phone ?? '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos cargar tu cuenta.')
      } finally {
        setLoading(false)
      }
    }

    void loadAccount()
  }, [router, setUser])

  async function handleLogout() {
    if (signingOut) return

    setSigningOut(true)

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      showToast('No pudimos cerrar sesión. Intenta de nuevo.')
      setSigningOut(false)
      return
    }

    logout()
    router.replace('/login')
    router.refresh()
  }

  function comingSoon(label: string) {
    showToast(`${label} estará disponible próximamente.`)
  }

  const displayName = profile?.name ?? user?.name ?? 'Usuario'
  const displayEmail = profile?.email ?? user?.email ?? ''
  const displayPhone = profile?.phone ?? user?.phone ?? ''

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Mi cuenta</p>
          <h1>Configuración</h1>
          <p className="muted">
            Administra tu perfil, vehículos, soporte y preferencias de Ruum Ruum.
          </p>
        </div>
      </section>

      {error && (
        <section className="card" role="alert">
          <p style={{ color: 'var(--danger)', fontWeight: 700 }}>No pudimos cargar tu cuenta</p>
          <p className="muted">{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </section>
      )}

      {loading ? (
        <section className="card">
          <p className="muted">Cargando configuración…</p>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="profile-summary">
              <div className="avatar-circle" aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2>{displayName}</h2>
                {displayEmail && <p className="muted">{displayEmail}</p>}
                {displayPhone && <p className="muted">{displayPhone}</p>}
              </div>
            </div>

            <div className="settings-list">
              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/cuenta/perfil')}
              >
                <span>
                  <strong>Editar perfil</strong>
                  <small>Actualiza tus datos personales</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>

              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/cuenta/vehiculos')}
              >
                <span>
                  <strong>Mis vehículos</strong>
                  <small>
                    {vehicles.length > 0
                      ? `${vehicles.length} vehículo${vehicles.length === 1 ? '' : 's'} registrado${
                          vehicles.length === 1 ? '' : 's'
                        }`
                      : 'Agrega o administra tus vehículos'}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Pagos y facturación</h2>

            <div className="settings-list">
              <button className="settings-row" onClick={() => router.push('/cuenta/pagos')}>Mis pagos <span>›</span></button>

              <button
                type="button"
                className="settings-row"
                onClick={() => comingSoon('Métodos de pago')}
              >
                <span>
                  <strong>Métodos de pago</strong>
                  <small>Disponible próximamente</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>

              <button
                type="button"
                className="settings-row"
                onClick={() => comingSoon('Facturación')}
              >
                <span>
                  <strong>Facturación</strong>
                  <small>Disponible próximamente</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Ayuda</h2>

            <div className="settings-list">
              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/soporte')}
              >
                <span>
                  <strong>Contactar soporte</strong>
                  <small>Habla con nuestro equipo</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>

              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/soporte?tipo=incidencia')}
              >
                <span>
                  <strong>Reportar problema</strong>
                  <small>Cuéntanos qué ocurrió</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>

              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/faq')}
              >
                <span>
                  <strong>Preguntas frecuentes</strong>
                  <small>Consulta respuestas rápidas</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Legal</h2>

            <div className="settings-list">
              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/terminos')}
              >
                <span>
                  <strong>Términos y condiciones</strong>
                  <small>Consulta las reglas del servicio</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>

              <button
                type="button"
                className="settings-row"
                onClick={() => router.push('/privacidad')}
              >
                <span>
                  <strong>Aviso de privacidad</strong>
                  <small>Conoce cómo protegemos tus datos</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </section>

          <section className="card">
            <button
              type="button"
              className="btn-danger"
              onClick={handleLogout}
              disabled={signingOut}
            >
              {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </section>
        </>
      )}
    </main>
  )
}