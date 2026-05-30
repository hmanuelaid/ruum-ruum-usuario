'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'

const FAQS = [
  { q: '¿Cuánto tiempo tarda el traslado?', a: 'Depende de la distancia. Traslados locales: 2-4 horas. Foráneos: según el destino. Te damos un estimado al confirmar.' },
  { q: '¿Qué incluye la evidencia?', a: 'Fotos exteriores e interiores, kilometraje, nivel de combustible y observaciones del conductor antes y después del traslado.' },
  { q: '¿Puedo cancelar mi solicitud?', a: 'Sí, puedes cancelar antes de que se asigne un conductor sin costo. Después puede aplicar un cargo.' },
  { q: '¿Cómo sé que mi auto está seguro?', a: 'Todos nuestros conductores están certificados. Documentamos el vehículo antes y después del traslado con evidencia fotográfica.' },
  { q: '¿Qué pasa si hay un daño?', a: 'Reporta el incidente desde la app. Nuestro equipo lo revisa con la evidencia disponible y te contacta en menos de 24 horas.' },
]

export default function SoportePage() {
  const { showToast } = useAppStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSending(false)
    setMessage('')
    showToast('Mensaje enviado. Te respondemos en menos de 2 horas.')
  }

  return (
    <>
      {/* Header */}
      <div className="card-hero" style={{ padding: '20px' }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>💬</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>¿Cómo podemos ayudarte?</h2>
        <p style={{ fontSize: 13, opacity: .8 }}>Soporte disponible todos los días de 7am a 10pm</p>
      </div>

      {/* Contacto rápido */}
      <section>
        <p className="kicker" style={{ marginBottom: 10 }}>Contacto directo</p>
        <div className="quick-actions" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          {[
            { emoji: '💬', label: 'Chat en vivo', desc: 'Respuesta inmediata', action: () => showToast('Iniciando chat...') },
            { emoji: '📞', label: 'Llamar', desc: '+52 55 8000 0000', action: () => showToast('Marcando...') },
            { emoji: '📧', label: 'Correo', desc: 'soporte@ruumruum.mx', action: () => showToast('Abriendo correo...') },
            { emoji: '🚨', label: 'Emergencia', desc: 'Asistencia 24/7', action: () => showToast('Conectando con emergencias...') },
          ].map(({ emoji, label, desc, action }) => (
            <button key={label} className="quick-action" onClick={action} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13 }}>{label}</p>
                <p className="muted" style={{ fontSize: 11 }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Enviar mensaje */}
      <section>
        <p className="kicker" style={{ marginBottom: 10 }}>Envíanos un mensaje</p>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field-group">
            <label className="field-label">Tipo de problema</label>
            <select className="field-select">
              <option>Problema con un viaje</option>
              <option>Daño o incidente</option>
              <option>Ayuda con pagos</option>
              <option>Ayuda con evidencia</option>
              <option>Cancelaciones</option>
              <option>Otro</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Describe tu problema</label>
            <textarea className="field-input" rows={4}
              placeholder="Cuéntanos qué pasó con detalle..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ resize: 'none' }} />
          </div>
          <button className="btn-primary" onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </div>
      </section>

      {/* FAQs */}
      <section>
        <p className="kicker" style={{ marginBottom: 10 }}>Preguntas frecuentes</p>
        <div className="stack">
          {FAQS.map((faq, i) => (
            <div key={i} className="card" style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{faq.q}</p>
                <span style={{
                  color: 'var(--primary)', fontSize: 18, flexShrink: 0,
                  transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform .2s',
                }}>+</span>
              </div>
              {openFaq === i && (
                <p className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Legal */}
      <section>
        <div className="settings-group">
          <h3>Legal</h3>
          <button className="settings-row">Términos y condiciones <span>›</span></button>
          <button className="settings-row">Aviso de privacidad <span>›</span></button>
          <button className="settings-row">Eliminar mi cuenta <span style={{ color: 'var(--danger)' }}>›</span></button>
        </div>
      </section>
    </>
  )
}