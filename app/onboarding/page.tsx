'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState<'intro' | 'welcome'>('intro')

  if (step === 'intro') return <IntroScreen onContinue={() => setStep('welcome')} />
  return <WelcomeScreen />
}

/* ─── Pantalla 1: Intro ─── */
function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #060c1e 0%, #091224 55%, #0b1830 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '3.5rem 1.75rem 3rem',
      maxWidth: 430, margin: '0 auto',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: '2.5rem' }}>
        <RuumLogo />
        <p style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
          BY MOVILIAX
        </p>
      </div>

      {/* Línea acento */}
      <div style={{ width: 32, height: 3, background: '#1A7CFA', borderRadius: 2, marginBottom: '2rem' }} />

      {/* Headline */}
      <h1 style={{
        fontSize: '2rem', fontWeight: 900, lineHeight: 1.15,
        color: '#ffffff', margin: '0 0 1.25rem',
      }}>
        Mueve tu auto<br />sin soltar el control.
      </h1>

      {/* Descripción */}
      <p style={{
        fontSize: '0.95rem', lineHeight: 1.65,
        color: 'rgba(255,255,255,0.5)', margin: '0 0 2.5rem',
        maxWidth: 300,
      }}>
        Plataforma digital para traslados vehiculares con conductores certificados,
        evidencia en cada etapa y control total del viaje.
      </p>

      {/* Grid de features */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem 1rem', marginBottom: '3rem',
      }}>
        {FEATURES.map(f => (
          <FeatureItem key={f.label} icon={f.icon} label={f.label} />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Botón */}
      <button
        onClick={onContinue}
        style={{
          width: '100%', padding: '14px',
          background: '#1A7CFA',
          color: '#ffffff', fontWeight: 700, fontSize: 15,
          border: 'none', borderRadius: 14, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(26,124,250,0.4)',
        }}>
        Continuar
      </button>
    </div>
  )
}

/* ─── Pantalla 2: Bienvenida ─── */
function WelcomeScreen() {
  const router = useRouter()
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #060c1e 0%, #091224 55%, #0b1830 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '3.5rem 1.5rem 3rem',
      position: 'relative', overflow: 'hidden',
      maxWidth: 430, margin: '0 auto',
    }}>

      <div style={{
        position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,124,250,0.16) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', lineHeight: 1, position: 'relative', zIndex: 2 }}>
        <RuumLogo />
        <p style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
          BY MOVILIAX
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <RouteIllustration />
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: 0 }}>Bienvenido</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
            Inicia sesión para continuar
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%', padding: '14px',
            background: '#1A7CFA',
            color: '#ffffff', fontWeight: 700, fontSize: 15,
            border: 'none', borderRadius: 14, cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(26,124,250,0.4)',
          }}>
          Iniciar sesión
        </button>

        <button
          onClick={() => router.push('/onboarding/registro')}
          style={{
            width: '100%', padding: '14px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 15,
            border: '1.5px solid rgba(255,255,255,0.2)',
            borderRadius: 14, cursor: 'pointer',
          }}>
          Registrarme
        </button>
      </div>
    </div>
  )
}

/* ─── Feature item ─── */
const FEATURES = [
  { icon: 'shield-check', label: 'CONDUCTORES\nCERTIFICADOS' },
  { icon: 'camera',       label: 'EVIDENCIA EN\nCADA ETAPA' },
  { icon: 'map-pin',      label: 'TRAZABILIDAD\nEN TIEMPO REAL' },
  { icon: 'lock',         label: 'SEGURIDAD Y\nCONFIANZA' },
]

function FeatureItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        border: '1.5px solid rgba(26,124,250,0.35)',
        background: 'rgba(26,124,250,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Usamos SVG icons inline que coinciden con la imagen */}
        <FeatureIcon name={icon} />
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-line', lineHeight: 1.4,
      }}>
        {label}
      </span>
    </div>
  )
}

function FeatureIcon({ name }: { name: string }) {
  const s = { width: 22, height: 22, stroke: '#1A7CFA', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
 const icons: Record<string, React.ReactElement> = {
    'shield-check': (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M12 2L4 5v6c0 5 3.6 9.3 8 10.5C16.4 20.3 20 16 20 11V5l-8-3z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    'camera': (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <circle cx="12" cy="14" r="3"/>
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
    ),
    'map-pin': (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    'lock': (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="5" y="11" width="14" height="10" rx="2"/>
        <path d="M8 11V7a4 4 0 018 0v4"/>
        <circle cx="12" cy="16" r="1" fill="#1A7CFA"/>
      </svg>
    ),
  }
  return icons[name] ?? null
}

/* ─── Logo ─── */
function RuumLogo() {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 38, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff', textTransform: 'lowercase' }}>ruum</span>
      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 38, fontWeight: 900, letterSpacing: '-0.02em', color: '#1A7CFA', textTransform: 'lowercase', marginTop: -10 }}>ruum</span>
    </div>
  )
}

/* ─── Ilustración ruta ─── */
function RouteIllustration() {
  return (
    <svg viewBox="0 0 320 220" width="320" height="220" style={{ display: 'block' }}>
      <defs>
        <filter id="glow-line"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="car-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="M35 195 Q65 195 90 172 Q125 135 102 106 Q80 78 115 55 Q148 32 182 48 Q218 65 252 42 Q278 22 298 24" stroke="rgba(26,124,250,0.22)" strokeWidth="2" fill="none" strokeDasharray="5 5"/>
      <path d="M35 195 Q65 195 90 172 Q125 135 102 106 Q80 78 115 55 Q148 32 182 48 Q218 65 252 42 Q278 22 298 24" stroke="#1A7CFA" strokeWidth="1.5" fill="none" filter="url(#glow-line)" strokeDasharray="7 3"/>
      <circle cx="35" cy="195" r="6" fill="rgba(26,124,250,0.18)" stroke="#1A7CFA" strokeWidth="1.5"/>
      <circle cx="35" cy="195" r="2.5" fill="#1A7CFA"/>
      <circle cx="298" cy="24" r="5" fill="rgba(26,124,250,0.22)" stroke="#1A7CFA" strokeWidth="1.5"/>
      <circle cx="298" cy="24" r="2.5" fill="#1A7CFA"/>
      <circle cx="298" cy="24" r="10" fill="none" stroke="rgba(26,124,250,0.3)" strokeWidth="1">
        <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <g filter="url(#car-glow)">
        <rect x="94" y="97" width="32" height="16" rx="6" fill="#1A7CFA" opacity="0.9"/>
        <rect x="98" y="89" width="22" height="11" rx="4" fill="#5BA8FF" opacity="0.8"/>
        <circle cx="99" cy="113" r="4.5" fill="#091224" stroke="#1A7CFA" strokeWidth="1.5"/>
        <circle cx="117" cy="113" r="4.5" fill="#091224" stroke="#1A7CFA" strokeWidth="1.5"/>
        <ellipse cx="126" cy="101" rx="7" ry="3" fill="rgba(26,124,250,0.3)"/>
      </g>
    </svg>
  )
}
