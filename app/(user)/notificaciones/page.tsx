'use client'
import { useState, useEffect } from 'react'

interface Notification {
  id: string
  title: string
  body: string
  type: 'trip' | 'evidence' | 'payment' | 'info'
  read: boolean
  timestamp: string
}

const TYPE_ICON: Record<string, string> = {
  trip: '🚗', evidence: '📸', payment: '💳', info: 'ℹ️',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  return `Hace ${Math.floor(hrs / 24)} días`
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => {
        setNotifications(Array.isArray(d.data) ? d.data : [])
        setError(d.ok === false ? d.error ?? 'No se pudieron cargar las notificaciones.' : '')
        setLoading(false)
      })
      .catch(() => {
        setNotifications([])
        setError('No se pudieron cargar las notificaciones.')
        setLoading(false)
      })
  }, [])

  async function markRead(id: string) {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!response.ok) return
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await Promise.all(notifications.filter(n => !n.read).map(n =>
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      })
    ))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifications.filter(n => !n.read).length

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <p className="muted">Cargando...</p>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Notificaciones</h2>
          {unread > 0 && <p className="muted">{unread} sin leer</p>}
        </div>
        {unread > 0 && (
          <button className="btn-text" onClick={markAllRead}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🔔</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin notificaciones</p>
          <p className="muted">Te avisaremos sobre el estado de tus traslados aquí.</p>
        </div>
      ) : (
        <div className="stack">
          {notifications.map(n => (
            <div key={n.id}
              className="list-card"
              style={{
                background: n.read ? 'var(--surface)' : 'var(--surface-2)',
                borderColor: n.read ? 'var(--border)' : 'var(--primary)',
                gap: 14, cursor: 'pointer',
              }}
              onClick={() => !n.read && markRead(n.id)}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: n.read ? 'var(--surface-2)' : 'var(--primary-dim)',
                display: 'grid', placeItems: 'center',
                fontSize: '1.3rem', flexShrink: 0,
              }}>
                {TYPE_ICON[n.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p style={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</p>
                  <p className="muted" style={{ fontSize: 11, flexShrink: 0 }}>{timeAgo(n.timestamp)}</p>
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>{n.body}</p>
              </div>
              {!n.read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--primary)', flexShrink: 0,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
