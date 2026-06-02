'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

interface PaymentMethod {
  id: string
  type: 'tarjeta' | 'transferencia' | 'paypal' | 'oxxo' | 'mercadopago'
  label: string
  detail: string
  icon: string
  default: boolean
}

const MOCK_METHODS: PaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'tarjeta',
    label: 'Visa terminada en 4242',
    detail: 'Vence 12/26',
    icon: '💳',
    default: true,
  },
  {
    id: 'pm_002',
    type: 'paypal',
    label: 'PayPal',
    detail: 'carlos@ejemplo.com',
    icon: '🅿️',
    default: false,
  },
]

const ADD_OPTIONS: {
  type: PaymentMethod['type']
  icon: string
  label: string
  desc: string
}[] = [
  { type: 'tarjeta', icon: '💳', label: 'Tarjeta de débito o crédito', desc: 'Visa, Mastercard, AMEX' },
  { type: 'transferencia', icon: '🏦', label: 'Transferencia bancaria (SPEI)', desc: 'CLABE interbancaria' },
  { type: 'paypal', icon: '🅿️', label: 'PayPal', desc: 'Paga con tu cuenta PayPal' },
  { type: 'oxxo', icon: '🏪', label: 'OXXO Pay', desc: 'Paga en efectivo en OXXO' },
  { type: 'mercadopago', icon: '💙', label: 'Mercado Pago', desc: 'Saldo o tarjeta guardada' },
]

type Sheet = 'add_select' | 'add_card' | 'add_transfer' | null

export default function MetodosPagoPage() {
  const router = useRouter()
  const { showToast } = useAppStore()
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_METHODS)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [transferForm, setTransferForm] = useState({ clabe: '', bank: '', alias: '' })
  const [loading, setLoading] = useState(false)

  function setDefault(id: string) {
    setMethods((current) => current.map((method) => ({ ...method, default: method.id === id })))
    showToast('Método predeterminado actualizado ✓')
  }

  function removeMethod(id: string) {
    setMethods((current) => current.filter((method) => method.id !== id))
    showToast('Método eliminado')
  }

  async function handleAddCard(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 900))

    const last4 = cardForm.number.replace(/\s/g, '').slice(-4)
    setMethods((current) => [
      ...current,
      {
        id: `pm_${Date.now()}`,
        type: 'tarjeta',
        label: `Tarjeta terminada en ${last4}`,
        detail: `Vence ${cardForm.expiry}`,
        icon: '💳',
        default: current.length === 0,
      },
    ])

    setCardForm({ number: '', name: '', expiry: '', cvv: '' })
    setSheet(null)
    setLoading(false)
    showToast('Tarjeta agregada ✓')
  }

  async function handleAddTransfer(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 700))

    setMethods((current) => [
      ...current,
      {
        id: `pm_${Date.now()}`,
        type: 'transferencia',
        label: transferForm.alias || 'Transferencia SPEI',
        detail: `CLABE: ****${transferForm.clabe.slice(-4)}`,
        icon: '🏦',
        default: current.length === 0,
      },
    ])

    setTransferForm({ clabe: '', bank: '', alias: '' })
    setSheet(null)
    setLoading(false)
    showToast('Cuenta SPEI agregada ✓')
  }

  function handleSelectAddType(type: PaymentMethod['type']) {
    if (type === 'tarjeta') {
      setSheet('add_card')
      return
    }

    if (type === 'transferencia') {
      setSheet('add_transfer')
      return
    }

    const option = ADD_OPTIONS.find((item) => item.type === type)

    setMethods((current) => [
      ...current,
      {
        id: `pm_${Date.now()}`,
        type,
        label: option?.label ?? type,
        detail: 'Conectado',
        icon: option?.icon ?? '💰',
        default: current.length === 0,
      },
    ])

    setSheet(null)
    showToast(`${option?.label ?? type} agregado ✓`)
  }

  function formatCard(value: string) {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(value: string) {
    return value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2')
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Métodos de pago</h1>
      </div>

      <section>
        <p className="kicker" style={{ marginBottom: 10 }}>Tus métodos guardados</p>
        {methods.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>💳</p>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin métodos guardados</p>
            <p className="muted" style={{ fontSize: 13 }}>Agrega un método para agilizar tus pagos.</p>
          </div>
        ) : (
          <div className="stack">
            {methods.map((method) => (
              <div
                key={method.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.4rem',
                    flexShrink: 0,
                  }}
                >
                  {method.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{method.label}</p>
                    {method.default && (
                      <span className="chip chip-success" style={{ fontSize: 10 }}>
                        Predeterminado
                      </span>
                    )}
                  </div>
                  <p className="muted" style={{ fontSize: 12 }}>{method.detail}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!method.default && (
                    <button
                      type="button"
                      className="btn-mini"
                      onClick={() => setDefault(method.id)}
                      title="Establecer como predeterminado"
                    >
                      ★
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-mini"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => removeMethod(method.id)}
                    title="Eliminar"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={14}
                      height={14}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        className="btn-primary"
        onClick={() => setSheet('add_select')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 18 }}>+</span> Agregar método de pago
      </button>

      <div className="card" style={{ background: 'var(--surface-2)', padding: '14px 16px' }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🔒 Pago seguro</p>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
          Tus datos de pago están encriptados y protegidos. Ruum Ruum nunca almacena
          números de tarjeta completos ni CVV.
        </p>
      </div>

      <div
        className={`sheet-backdrop${sheet === 'add_select' ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSheet(null)
        }}
      >
        <div className="sheet">
          <div className="sheet-handle" />
          <div className="sheet-header">
            <p style={{ fontWeight: 700, fontSize: 16 }}>Agregar método de pago</p>
            <button type="button" className="btn-icon" onClick={() => setSheet(null)}>✕</button>
          </div>
          <div className="stack">
            {ADD_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleSelectAddType(option.type)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  color: 'var(--text)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: '1.6rem', width: 36, textAlign: 'center' }}>{option.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{option.label}</p>
                  <p className="muted" style={{ fontSize: 12 }}>{option.desc}</p>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`sheet-backdrop${sheet === 'add_card' ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSheet(null)
        }}
      >
        <div className="sheet">
          <div className="sheet-handle" />
          <div className="sheet-header">
            <p style={{ fontWeight: 700, fontSize: 16 }}>💳 Agregar tarjeta</p>
            <button type="button" className="btn-icon" onClick={() => setSheet(null)}>✕</button>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
              borderRadius: 14,
              padding: '20px 22px',
              color: '#fff',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: 16 }}>Ruum Ruum</p>
              <span style={{ fontSize: 20 }}>💳</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'monospace' }}>
              {cardForm.number || '•••• •••• •••• ••••'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{cardForm.name || 'NOMBRE TITULAR'}</span>
              <span>{cardForm.expiry || 'MM/AA'}</span>
            </div>
          </div>

          <form onSubmit={handleAddCard} className="form-section">
            <div className="field-group">
              <label className="field-label">Número de tarjeta</label>
              <input
                className="field-input"
                placeholder="1234 5678 9012 3456"
                value={cardForm.number}
                inputMode="numeric"
                onChange={(event) => setCardForm((current) => ({
                  ...current,
                  number: formatCard(event.target.value),
                }))}
                maxLength={19}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Nombre del titular</label>
              <input
                className="field-input"
                placeholder="Como aparece en la tarjeta"
                value={cardForm.name}
                onChange={(event) => setCardForm((current) => ({
                  ...current,
                  name: event.target.value.toUpperCase(),
                }))}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field-group">
                <label className="field-label">Fecha de vencimiento</label>
                <input
                  className="field-input"
                  placeholder="MM/AA"
                  inputMode="numeric"
                  value={cardForm.expiry}
                  onChange={(event) => setCardForm((current) => ({
                    ...current,
                    expiry: formatExpiry(event.target.value),
                  }))}
                  maxLength={5}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">CVV</label>
                <input
                  className="field-input"
                  placeholder="•••"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={cardForm.cvv}
                  onChange={(event) => setCardForm((current) => ({
                    ...current,
                    cvv: event.target.value.replace(/\D/g, ''),
                  }))}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar tarjeta'}
            </button>
          </form>
        </div>
      </div>

      <div
        className={`sheet-backdrop${sheet === 'add_transfer' ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSheet(null)
        }}
      >
        <div className="sheet">
          <div className="sheet-handle" />
          <div className="sheet-header">
            <p style={{ fontWeight: 700, fontSize: 16 }}>🏦 Cuenta SPEI</p>
            <button type="button" className="btn-icon" onClick={() => setSheet(null)}>✕</button>
          </div>
          <form onSubmit={handleAddTransfer} className="form-section">
            <div className="field-group">
              <label className="field-label">CLABE interbancaria (18 dígitos)</label>
              <input
                className="field-input"
                placeholder="000000000000000000"
                inputMode="numeric"
                maxLength={18}
                value={transferForm.clabe}
                onChange={(event) => setTransferForm((current) => ({
                  ...current,
                  clabe: event.target.value.replace(/\D/g, ''),
                }))}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Banco</label>
              <select
                className="field-input"
                value={transferForm.bank}
                onChange={(event) => setTransferForm((current) => ({
                  ...current,
                  bank: event.target.value,
                }))}
              >
                <option value="">Selecciona tu banco</option>
                {[
                  'BBVA',
                  'Banamex',
                  'Santander',
                  'Banorte',
                  'HSBC',
                  'Scotiabank',
                  'Inbursa',
                  'Azteca',
                  'Spin by OXXO',
                  'Nu',
                  'Hey Banco',
                ].map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Alias (opcional)</label>
              <input
                className="field-input"
                placeholder="Ej. Mi cuenta BBVA"
                value={transferForm.alias}
                onChange={(event) => setTransferForm((current) => ({
                  ...current,
                  alias: event.target.value,
                }))}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar cuenta'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
