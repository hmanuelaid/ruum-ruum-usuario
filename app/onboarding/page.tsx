'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  { emoji: '🚗', title: 'Mueve tu auto sin soltar el control', body: 'Solicita el traslado de tu vehículo con conductores certificados. Tú decides cuándo y a dónde.' },
  { emoji: '📸', title: 'Evidencia en cada paso', body: 'Fotos, kilometraje y estatus en tiempo real. Tu vehículo documentado desde que lo entregamos hasta que lo recibes.' },
  { emoji: '🛡️', title: 'Confianza desde el primer viaje', body: 'Conductores verificados, rutas registradas y soporte disponible. Ruum Ruum es tu plataforma de traslados de confianza.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]

  function next() {
    if (current < SLIDES.length - 1) setCurrent(current + 1)
    else router.push('/onboarding/registro')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-skip" onClick={() => router.push('/onboarding/registro')}>Omitir</button>
      <div className="onboarding-card slide-card">
        <div className="slide-emoji">{slide.emoji}</div>
        <h1 className="onboarding-title">{slide.title}</h1>
        <p className="onboarding-sub">{slide.body}</p>
        <div className="dot-row">
          {SLIDES.map((_, i) => (
            <span key={i} className={`dot${i === current ? ' dot-active' : ''}`} />
          ))}
        </div>
        <button className="btn-primary" onClick={next}>
          {current < SLIDES.length - 1 ? 'Siguiente' : 'Comenzar'}
        </button>
      </div>
    </div>
  )
}