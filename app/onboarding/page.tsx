'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" style={{ width: 90, height: 90 }}>
        <circle cx="32" cy="32" r="30" fill="rgba(26,124,250,0.12)" stroke="rgba(26,124,250,0.3)" strokeWidth="1.5"/>
        <path d="M12 36 Q22 20 32 28 Q42 36 52 18" stroke="#1A7CFA" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="52" cy="18" r="4" fill="#1A7CFA"/>
        <path d="M28 40 L32 28 L36 40" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <rect x="22" y="42" width="20" height="8" rx="2" fill="rgba(26,124,250,0.3)" stroke="#1A7CFA" strokeWidth="1.5"/>
        <circle cx="25" cy="52" r="2.5" fill="#1A7CFA"/>
        <circle cx="39" cy="52" r="2.5" fill="#1A7CFA"/>
      </svg>
    ),
    tag: 'TRASLADOS CERTIFICADOS',
    title: 'Mueve tu auto\nsin soltar el control.',
    body: 'Solicita el traslado de tu vehículo con conductores certificados. Tú decides cuándo y a dónde.',
  },
  {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" style={{ width: 90, height: 90 }}>
        <circle cx="32" cy="32" r="30" fill="rgba(26,124,250,0.12)" stroke="rgba(26,124,250,0.3)" strokeWidth="1.5"/>
        <rect x="18" y="16" width="28" height="22" rx="3" stroke="#1A7CFA" strokeWidth="2" fill="none"/>
        <circle cx="32" cy="27" r="5" stroke="#ffffff" strokeWidth="2" fill="none"/>
        <path d="M22 44 L26 38 L30 42 L34 36 L38 40 L42 34 L42 44Z" fill="rgba(26,124,250,0.25)" stroke="#1A7CFA" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="32" cy="27" r="2" fill="#1A7CFA"/>
      </svg>
    ),
    tag: 'TRAZABILIDAD TOTAL',
    title: 'Evidencia en\ncada etapa.',
    body: 'Fotos, kilometraje y estatus en tiempo real. Tu vehículo documentado desde que lo entregamos hasta que lo recibes.',
  },
  {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" style={{ width: 90, height: 90 }}>
        <circle cx="32" cy="32" r="30" fill="rgba(26,124,250,0.12)" stroke="rgba(26,124,250,0.3)" strokeWidth="1.5"/>
        <path d="M32 14 L44 20 L44 34 C44 41 38 47 32 50 C26 47 20 41 20 34 L20 20 Z" stroke="#1A7CFA" strokeWidth="2" fill="rgba(26,124,250,0.15)" strokeLinejoin="round"/>
        <path d="M26 32 L30 36 L38 28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    tag: 'SEGURIDAD Y CONFIANZA',
    title: 'Confianza desde\nel primer viaje.',
    body: 'Conductores verificados, rutas registradas y soporte disponible. Ruum Ruum es tu plataforma de traslados de confianza.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const slide = SLIDES[current]

  function goTo(index: number) {
    if (animating || index === current) return
    setAnimating(true)
    setTimeout(() => { setCurrent(index); setAnimating(false) }, 200)
  }

  function next() {
    if (current < SLIDES.length - 1) goTo(current + 1)
    else router.push('/onboarding/registro')
  }

  // Swipe support
  useEffect(() => {
    let startX = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (dx < -50 && current < SLIDES.length - 1) goTo(current + 1)
      if (dx > 50 && current > 0) goTo(current - 1)
    }
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => { window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchend', onTouchEnd) }
  }, [current, animating])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #070d1f 0%, #0a1428 60%, #0c1a35 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0',
      position: 'relative',
      overflow: 'hidden',
      maxWidth: 430,
      margin: '0 auto',
    }}>

      {/* Decorative glow */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,124,250,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Skip */}
      <button
        onClick={() => router.push('/onboarding/registro')}
        style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
          padding: '6px 14px', borderRadius: 20, zIndex: 10,
        }}>
        Omitir
      </button>

      {/* Logo */}
      <div style={{ paddingTop: '3.5rem', textAlign: 'center' }}>
        <RuumLogo />
        <p style={{ fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          BY MOVILIAX
        </p>
      </div>

      {/* Slide content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 2rem 0',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        textAlign: 'center',
        gap: '1.25rem',
      }}>

        {/* Icon */}
        <div style={{
          width: 140, height: 140,
          background: 'rgba(26,124,250,0.08)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(26,124,250,0.2)',
        }}>
          {slide.icon}
        </div>

        {/* Tag */}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
          color: '#1A7CFA', textTransform: 'uppercase',
        }}>
          {slide.tag}
        </span>

        {/* Title */}
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2,
          color: '#ffffff', margin: 0,
          whiteSpace: 'pre-line',
        }}>
          {slide.title}
        </h1>

        {/* Body */}
        <p style={{
          fontSize: '0.9rem', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.55)', margin: 0,
          maxWidth: 300,
        }}>
          {slide.body}
        </p>
      </div>

      {/* Bottom section */}
      <div style={{
        width: '100%', padding: '2rem 1.5rem 3rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        alignItems: 'center',
      }}>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: i === current ? '#1A7CFA' : 'rgba(255,255,255,0.2)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          style={{
            width: '100%', padding: '1rem',
            background: '#1A7CFA',
            color: '#ffffff', fontWeight: 700, fontSize: '1rem',
            border: 'none', borderRadius: 14, cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(26,124,250,0.4)',
            transition: 'opacity 0.15s',
          }}>
          {current < SLIDES.length - 1 ? 'Siguiente' : 'Comenzar'}
        </button>

        {/* Already have account */}
        <button
          onClick={() => router.push('/login')}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontSize: 13,
            cursor: 'pointer', padding: 0,
          }}>
          Ya tengo una cuenta →
        </button>
      </div>
    </div>
  )
}

function RuumLogo() {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, lineHeight: 1 }}>
      <span style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em',
        color: '#ffffff',
        textTransform: 'lowercase',
      }}>ruum</span>
      <span style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em',
        color: '#1A7CFA',
        textTransform: 'lowercase',
        marginTop: -6,
      }}>ruum</span>
    </div>
  )
}