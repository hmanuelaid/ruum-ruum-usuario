'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ConfirmacionPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      gap: 24,
      opacity: visible ? 1 : 0,
      transition: 'opacity .4s ease',
    }}>
      {/* Icono animado */}
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'rgba(34,197,94,.15)',
        display: 'grid', placeItems: 'center',
        fontSize: '3rem',
        border: '3px solid var(--success)',
      }}>
        ✅
      </div>

      {/* Texto */}
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>
          ¡Traslado solicitado!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6 }}>
          Recibimos tu solicitud. Nuestro equipo la revisará y te asignará un conductor certificado en breve.
        </p>
      </div>

      {/* Qué sigue */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: 20,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>¿Qué sigue?</p>
        {[
          { emoji: '🔍', step: 'Revisión', desc: 'Validamos los detalles de tu solicitud' },
          { emoji: '👤', step: 'Conductor asignado', desc: 'Te notificamos quién traslada tu vehículo' },
          { emoji: '📸', step: 'Evidencia inicial', desc: 'Fotos del estado del auto antes de salir' },
          { emoji: '🚗', step: 'Traslado en curso', desc: 'Seguimiento hasta la entrega' },
        ].map(({ emoji, step, desc }) => (
          <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--primary-dim)',
              display: 'grid', placeItems: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>{emoji}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{step}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={() => router.push('/viajes')}>
          Ver mis viajes
        </button>
        <button className="btn-secondary" onClick={() => router.push('/inicio')}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}