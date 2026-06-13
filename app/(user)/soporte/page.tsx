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

const SUPPORT_EMAIL = 'ruum.ruum.mx@gmail.com'
const SUPPORT_PHONE_DISPLAY = '+52 566 952 2178'
const SUPPORT_PHONE_LINK = '+525669522178'
const SUPPORT_WHATSAPP_DISPLAY = '5669522178'
const SUPPORT_WHATSAPP_URL = 'https://wa.me/525669522178?text=Hola%20Ruum-Ruum%2C%20necesito%20ayuda%20con%20mi%20servicio.'

export default function SoportePage() {
  const { showToast } = useAppStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [type, setType] = useState('problema_viaje')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    setError('')

    const response = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message }),
    })
    const payload = await response.json().catch(() => null) as {
      ok?: boolean
      error?: string
    } | null

    if (!response.ok || !payload?.ok) {
      setError(payload?.error ?? 'No pudimos enviar tu mensaje.')
      setSending(false)
      return
    }

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
            { emoji: '💬', label: 'WhatsApp', desc: SUPPORT_WHATSAPP_DISPLAY, href: SUPPORT_WHATSAPP_URL, target: '_blank' },
            { emoji: '📞', label: 'Llamar', desc: SUPPORT_PHONE_DISPLAY, href: `tel:${SUPPORT_PHONE_LINK}` },
            { emoji: '📧', label: 'Correo', desc: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}?subject=Soporte%20Ruum-Ruum` },
            { emoji: '🚨', label: 'Emergencia', desc: 'Asistencia telefónica', href: `tel:${SUPPORT_PHONE_LINK}` },
          ].map(({ emoji, label, desc, href, target }) => (
            <a
              key={label}
              className="quick-action"
              href={href}
              target={target}
              rel={target ? 'noopener noreferrer' : undefined}
              onClick={() => showToast(`Abriendo ${label.toLowerCase()}...`)}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, textDecoration: 'none' }}
            >
              <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13 }}>{label}</p>
                <p className="muted" style={{ fontSize: 11 }}>{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Enviar mensaje */}
      <section>
        <p className="kicker" style={{ marginBottom: 10 }}>Envíanos un mensaje</p>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field-group">
            <label className="field-label">Tipo de problema</label>
            <select className="field-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="problema_viaje">Problema con un viaje</option>
              <option value="incidente">Daño o incidente</option>
              <option value="pagos">Ayuda con pagos</option>
              <option value="evidencia">Ayuda con evidencia</option>
              <option value="cancelaciones">Cancelaciones</option>
              <option value="otro">Otro</option>
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
          {error && <p className="field-error">{error}</p>}
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
    </>
  )
}
