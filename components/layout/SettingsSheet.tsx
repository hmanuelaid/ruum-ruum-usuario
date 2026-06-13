'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsSheet() {
  const { settingsOpen, setSettingsOpen, showToast } = useAppStore()
  const { user, logout } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      showToast('No se pudo cerrar sesión. Intenta de nuevo.')
      setLoggingOut(false)
      return
    }

    logout()
    setSettingsOpen(false)
    router.replace('/login')
    router.refresh()
  }

  function goTo(path: string) {
    setSettingsOpen(false)
    router.push(path)
  }

  return (
    <div
      className={`sheet-backdrop${settingsOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
      inert={!settingsOpen}
    >
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2 id="settingsTitle">Configuración</h2>
          <button className="btn-icon" onClick={() => setSettingsOpen(false)} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {user && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-dim)', display: 'grid', placeItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
              👤
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{user.name}</p>
              <p className="muted">{user.phone}</p>
            </div>
          </div>
        )}

        <div className="settings-group">
          <h3>Cuenta</h3>
          <button className="settings-row" onClick={() => goTo('/cuenta/perfil')}>Perfil <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/cuenta/vehiculos')}>Mis vehículos <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/cuenta/pagos')}>Métodos de pago <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/cuenta/pagos')}>Facturación <span>›</span></button>
        </div>

        <div className="settings-group">
          <h3>Preferencias</h3>
          <button className="settings-row" onClick={() => goTo('/notificaciones')}>Notificaciones <span>Activas</span></button>
          <button className="settings-row" onClick={() => showToast('Idioma disponible próximamente.')}>Idioma <span>Español</span></button>
        </div>

        <div className="settings-group">
          <h3>Legal</h3>
          <button className="settings-row" onClick={() => showToast('Términos y condiciones estará disponible próximamente.')}>Términos y condiciones <span>›</span></button>
          <button className="settings-row" onClick={() => showToast('Aviso de privacidad estará disponible próximamente.')}>Aviso de privacidad <span>›</span></button>
        </div>

        <button className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </aside>
    </div>
  )
}