'use client'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { mockVehicles } from '@/lib/mock-data'

export default function CuentaPage() {
  const { user } = useAuthStore()
  const { showToast } = useAppStore()

  return (
    <>
      {/* Perfil */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--primary-dim)', display: 'grid',
          placeItems: 'center', fontSize: '1.8rem', flexShrink: 0,
        }}>👤</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 17 }}>{user?.name ?? 'Usuario'}</p>
          <p className="muted">{user?.phone}</p>
          <p className="muted">{user?.email}</p>
        </div>
        <button className="btn-mini" onClick={() => showToast('Editar perfil próximamente')} aria-label="Editar perfil">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
          </svg>
        </button>
      </div>

      {/* Mis vehículos */}
      <section>
        <div className="section-head" style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Mis vehículos</h2>
          <button className="btn-text" onClick={() => showToast('Agregar vehículo próximamente')}>+ Agregar</button>
        </div>
        <div className="stack">
          {mockVehicles.map(v => (
            <article key={v.id} className="list-card">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-dim)', display: 'grid', placeItems: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🚗</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{v.alias}</p>
                <p className="muted">{v.brand} {v.model} {v.year} · {v.plates}</p>
                <p className="muted" style={{ fontSize: 12 }}>{v.color} · {v.transmission === 'automatica' ? 'Automático' : 'Manual'}</p>
              </div>
              <button className="btn-mini" aria-label="Opciones">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Configuración */}
      <section>
        <div className="settings-group">
          <h3>Pago y facturación</h3>
          <button className="settings-row" onClick={() => showToast('Próximamente')}>Métodos de pago <span>›</span></button>
          <button className="settings-row" onClick={() => showToast('Próximamente')}>Facturación <span>›</span></button>
        </div>
        <div className="settings-group" style={{ marginTop: 16 }}>
          <h3>Soporte</h3>
          <button className="settings-row">Preguntas frecuentes <span>›</span></button>
          <button className="settings-row">Reportar problema <span>›</span></button>
          <button className="settings-row">Contactar soporte <span>›</span></button>
          <button className="settings-row">Términos y condiciones <span>›</span></button>
          <button className="settings-row">Aviso de privacidad <span>›</span></button>
        </div>
      </section>

      {/* Métricas rápidas */}
      <div className="metric-grid">
        <div className="metric-card">
          <p className="value">2</p>
          <p className="label">Viajes totales</p>
        </div>
        <div className="metric-card">
          <p className="value">$43,260</p>
          <p className="label">Total invertido</p>
        </div>
        <div className="metric-card">
          <p className="value">2</p>
          <p className="label">Vehículos</p>
        </div>
        <div className="metric-card">
          <p className="value">4.9 ⭐</p>
          <p className="label">Calificación</p>
        </div>
      </div>
    </>
  )
}