'use client'
import { useState } from 'react'
import { useAppStore, useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const APP_VERSION = '0.1.0'

const translations = {
  es: {
    configuracion: 'Configuración',
    cuenta_label: 'Cuenta',
    perfil: 'Perfil',
    misVehiculos: 'Mis vehículos',
    metodosPago: 'Métodos de pago',
    facturacion: 'Facturación',
    preferencias: 'Preferencias',
    notificaciones: 'Notificaciones',
    idioma: 'Idioma',
    legal: 'Legal',
    terminosCondiciones: 'Términos y condiciones',
    avisoPrivacidad: 'Aviso de privacidad',
    cerrandoSesion: 'Cerrando sesión',
    cerrarSesion: 'Cerrar sesión',
    eliminarCuenta: 'Eliminar cuenta',
    version: 'Versión',
  },
  en: {
    configuracion: 'Settings',
    cuenta_label: 'Account',
    perfil: 'Profile',
    misVehiculos: 'My vehicles',
    metodosPago: 'Payment methods',
    facturacion: 'Billing',
    preferencias: 'Preferences',
    notificaciones: 'Notifications',
    idioma: 'Language',
    legal: 'Legal',
    terminosCondiciones: 'Terms & Conditions',
    avisoPrivacidad: 'Privacy notice',
    cerrandoSesion: 'Signing out',
    cerrarSesion: 'Sign out',
    eliminarCuenta: 'Delete account',
    version: 'Version',
  },
} as const

export default function SettingsSheet() {
  const { settingsOpen, setSettingsOpen, showToast } = useAppStore()
  const { user, logout } = useAuthStore()
  const [language, setLanguage] = useState<'es' | 'en'>('es')
  const t = (key: keyof typeof translations.es) => translations[language][key]
  const [loggingOut, setLoggingOut] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeletingAccount(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      // Eliminar datos del usuario en app_users
      await supabase.from('app_users').delete().eq('auth_id', session.user.id)

      // Cerrar sesión (el admin delete requiere server-side; aquí limpiamos localmente)
      await supabase.auth.signOut()
      logout()
      setSettingsOpen(false)
      showToast('Cuenta eliminada. Lamentamos verte partir.')
      router.replace('/login')
      router.refresh()
    } catch {
      showToast('No pudimos eliminar tu cuenta. Contacta a soporte.')
      setDeletingAccount(false)
      setConfirmDelete(false)
    }
  }

  function goTo(path: string) {
    setSettingsOpen(false)
    router.push(path)
  }

  function toggleLanguage() {
    const next = language === 'es' ? 'en' : 'es'
    setLanguage(next)
    showToast(next === 'es' ? 'Idioma: Español' : 'Language: English')
  }

  return (
    <div
      className={`sheet-backdrop${settingsOpen ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSettingsOpen(false)
          setConfirmDelete(false)
        }
      }}
      inert={!settingsOpen}
    >
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2 id="settingsTitle">{t('configuracion')}</h2>
          <button className="btn-icon" onClick={() => { setSettingsOpen(false); setConfirmDelete(false) }} aria-label="Cerrar">
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
              <p className="muted">{user.phone || user.email}</p>
            </div>
          </div>
        )}

        {/* Cuenta */}
        <div className="settings-group">
          <h3>{t('cuenta_label')}</h3>
          <button className="settings-row" onClick={() => goTo('/cuenta/perfil')}>{t('perfil')} <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/cuenta/vehiculos')}>{t('misVehiculos')} <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/cuenta/pagos')}>{t('metodosPago')} <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/cuenta/facturacion')}>{t('facturacion')} <span>›</span></button>
        </div>

        {/* Preferencias */}
        <div className="settings-group">
          <h3>{t('preferencias')}</h3>
          <button className="settings-row" onClick={() => goTo('/notificaciones')}>
            {t('notificaciones')} <span>Activas</span>
          </button>
          <button
            className="settings-row"
            onClick={toggleLanguage}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <span>{t('idioma')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: language === 'es' ? 'var(--primary-dim)' : 'transparent',
                color: language === 'es' ? 'var(--primary)' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: language === 'es' ? 'var(--primary)' : 'var(--border)',
                borderRadius: 4, padding: '2px 6px',
              }}>ES</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: language === 'en' ? 'var(--primary-dim)' : 'transparent',
                color: language === 'en' ? 'var(--primary)' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: language === 'en' ? 'var(--primary)' : 'var(--border)',
                borderRadius: 4, padding: '2px 6px',
              }}>EN</span>
            </span>
          </button>
        </div>

        {/* Legal */}
        <div className="settings-group">
          <h3>{t('legal')}</h3>
          <button className="settings-row" onClick={() => goTo('/terminos')}>{t('terminosCondiciones')} <span>›</span></button>
          <button className="settings-row" onClick={() => goTo('/privacidad')}>{t('avisoPrivacidad')} <span>›</span></button>
        </div>

        {/* Cerrar sesión */}
        <button
          className="btn-secondary"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? t('cerrandoSesion') : t('cerrarSesion')}
        </button>

        {/* Eliminar cuenta */}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            style={{
              width: '100%', padding: '10px',
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 12,
              cursor: 'pointer', textDecoration: 'underline',
              marginTop: 4,
            }}
          >
            {t('eliminarCuenta')}
          </button>
        ) : (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            marginTop: 4,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', margin: '0 0 6px' }}>
              {language === 'es' ? '¿Confirmas eliminar tu cuenta?' : 'Confirm account deletion?'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              {language === 'es'
                ? 'Esta acción es irreversible. Se eliminarán todos tus datos.'
                : 'This action is irreversible. All your data will be deleted.'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1, padding: '9px', fontSize: 13, fontWeight: 600,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text)',
                }}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  flex: 1, padding: '9px', fontSize: 13, fontWeight: 700,
                  background: 'var(--danger)', border: 'none',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#fff',
                  opacity: deletingAccount ? 0.6 : 1,
                }}
              >
                {deletingAccount
                  ? (language === 'es' ? 'Eliminando…' : 'Deleting…')
                  : (language === 'es' ? 'Sí, eliminar' : 'Yes, delete')}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', fontFamily: 'JetBrains Mono, monospace' }}>
            {t('version')} {APP_VERSION}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
            © 2026 Ruum-Ruum by MoviliaX — HManuel Administración e Innovación Digital
          </p>
        </div>
      </aside>
    </div>
  )
}
