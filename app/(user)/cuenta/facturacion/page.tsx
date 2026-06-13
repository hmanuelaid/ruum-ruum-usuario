
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { clientLogger } from '@/lib/clientLogger'
import { useAppStore } from '@/lib/store'

// ─── Catálogos SAT ────────────────────────────────────────────────────────────

const REGIMENES_FISCALES = [
  { value: '', label: 'Selecciona régimen fiscal' },
  { value: '601', label: '601 – General de Ley Personas Morales' },
  { value: '603', label: '603 – Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 – Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: '606 – Arrendamiento' },
  { value: '607', label: '607 – Régimen de Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 – Demás Ingresos' },
  { value: '610', label: '610 – Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { value: '611', label: '611 – Ingresos por Dividendos (socios y accionistas)' },
  { value: '612', label: '612 – Personas Físicas con Actividades Empresariales y Profesionales' },
  { value: '614', label: '614 – Ingresos por Intereses' },
  { value: '615', label: '615 – Régimen de los ingresos por obtención de premios' },
  { value: '616', label: '616 – Sin obligaciones fiscales' },
  { value: '620', label: '620 – Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { value: '621', label: '621 – Incorporación Fiscal' },
  { value: '622', label: '622 – Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 – Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 – Coordinados' },
  { value: '625', label: '625 – Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { value: '626', label: '626 – Régimen Simplificado de Confianza (RESICO)' },
]

const USOS_CFDI = [
  { value: '', label: 'Selecciona uso de CFDI' },
  { value: 'G01', label: 'G01 – Adquisición de mercancias' },
  { value: 'G02', label: 'G02 – Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 – Gastos en general' },
  { value: 'I01', label: 'I01 – Construcciones' },
  { value: 'I02', label: 'I02 – Mobilario y equipo de oficina por inversiones' },
  { value: 'I03', label: 'I03 – Equipo de transporte' },
  { value: 'I04', label: 'I04 – Equipo de computo y accesorios' },
  { value: 'I05', label: 'I05 – Dados, troqueles, moldes, matrices y herramental' },
  { value: 'I06', label: 'I06 – Comunicaciones telefónicas' },
  { value: 'I07', label: 'I07 – Comunicaciones satelitales' },
  { value: 'I08', label: 'I08 – Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 – Honorarios médicos, dentales y gastos hospitalarios' },
  { value: 'D02', label: 'D02 – Gastos médicos por incapacidad o discapacidad' },
  { value: 'D03', label: 'D03 – Gastos funerales' },
  { value: 'D04', label: 'D04 – Donativo' },
  { value: 'D05', label: 'D05 – Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { value: 'D06', label: 'D06 – Aportaciones voluntarias al SAR' },
  { value: 'D07', label: 'D07 – Primas por seguros de gastos médicos' },
  { value: 'D08', label: 'D08 – Gastos de transportación escolar obligatoria' },
  { value: 'D09', label: 'D09 – Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { value: 'D10', label: 'D10 – Pagos por servicios educativos (colegiaturas)' },
  { value: 'S01', label: 'S01 – Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 – Pagos' },
  { value: 'CN01', label: 'CN01 – Nómina' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldGroup({
  label, hint, id, children, required,
}: {
  label: string; hint?: string; id: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{
        fontSize: 12, fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{hint}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 13, fontWeight: 700, color: 'var(--text)',
      margin: '8px 0 4px', paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </p>
  )
}

const isValidRFC = (rfc: string) =>
  /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)

const isValidEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FacturacionPage() {
  const router = useRouter()
  const { showToast } = useAppStore()
  const constanciaRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    rfc: '',
    razon_social: '',
    regimen_fiscal: '',
    cp_fiscal: '',
    uso_cfdi: '',
    correo_facturacion: '',
  })

  const [constanciaUrl, setConstanciaUrl]       = useState<string | null>(null)
  const [constanciaName, setConstanciaName]     = useState<string>('')
  const [constanciaUpload, setConstanciaUpload] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // ── Cargar datos via GET /api/billing ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/billing', { headers: { Accept: 'application/json' } })

        if (res.status === 401) { router.replace('/login?redirectTo=/cuenta/facturacion'); return }

        const payload = await res.json().catch(() => null) as
          | { ok: true;  data: Record<string, string | null> }
          | { ok: false; error?: string }
          | null

        if (!res.ok || !payload?.ok) {
          throw new Error(payload && !payload.ok ? (payload.error ?? 'Error al cargar datos.') : 'Error al cargar datos.')
        }

        const d = payload.data
        setForm({
          rfc:                (d.rfc                ?? '').toUpperCase(),
          razon_social:       (d.razon_social       ?? '').toUpperCase(),
          regimen_fiscal:     d.regimen_fiscal       ?? '',
          cp_fiscal:          d.cp_fiscal            ?? '',
          uso_cfdi:           d.uso_cfdi             ?? '',
          correo_facturacion: d.correo_facturacion   ?? '',
        })
        setConstanciaUrl(d.constancia_sat_url   ?? null)
        setConstanciaName(d.constancia_sat_name ?? '')

      } catch (err) {
        clientLogger.error('Facturacion load error:', err)
        setError(err instanceof Error ? err.message : 'No pudimos cargar tus datos de facturación.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const setField = useCallback((field: keyof typeof form, value: string) => {
    setForm(cur => ({ ...cur, [field]: value }))
  }, [])

  // ── Subir constancia via API route (Storage privado + URL firmada) ────────
  async function handleConstancia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      showToast('Solo se permiten PDF, JPG, PNG o WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('El archivo no debe superar 5 MB.')
      return
    }

    setConstanciaUpload(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/billing/constancia', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 401) { router.replace('/login?redirectTo=/cuenta/facturacion'); return }

      const payload = await res.json().catch(() => null) as
        | { ok: true; data: { constancia_sat_url: string; constancia_sat_name: string } }
        | { ok: false; error?: string }
        | null

      if (!res.ok || !payload?.ok) {
        throw new Error(payload && !payload.ok ? (payload.error ?? 'Error al guardar la constancia.') : 'Error al guardar la constancia.')
      }

      setConstanciaUrl(payload.data.constancia_sat_url)
      setConstanciaName(payload.data.constancia_sat_name)
      showToast('Constancia subida correctamente.')
    } catch (err) {
      clientLogger.error('Constancia upload error:', err)
      showToast(err instanceof Error ? err.message : 'No pudimos subir la constancia. Intenta de nuevo.')
    } finally {
      setConstanciaUpload(false)
      if (e.target) e.target.value = ''
    }
  }

  // ── Guardar via PATCH /api/billing → RPC update_billing_profile ───────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación optimista en el cliente (mismas reglas que el API route y la RPC)
    if (form.rfc && !isValidRFC(form.rfc)) {
      setError('RFC inválido. Verifica el formato (ej. GARM900101AB3).')
      return
    }
    if (form.correo_facturacion && !isValidEmail(form.correo_facturacion)) {
      setError('El correo para facturación no es válido.')
      return
    }
    if (form.cp_fiscal && !/^\d{5}$/.test(form.cp_fiscal)) {
      setError('El código postal fiscal debe tener exactamente 5 dígitos.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfc:                form.rfc.trim()                || null,
          razon_social:       form.razon_social.trim()       || null,
          regimen_fiscal:     form.regimen_fiscal            || null,
          cp_fiscal:          form.cp_fiscal.trim()          || null,
          uso_cfdi:           form.uso_cfdi                  || null,
          correo_facturacion: form.correo_facturacion.trim() || null,
        }),
      })

      const payload = await res.json().catch(() => null) as { ok: boolean; error?: string } | null

      if (res.status === 401) { router.replace('/login?redirectTo=/cuenta/facturacion'); return }
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error ?? 'No pudimos guardar los datos.')
      }

      showToast('Datos de facturación guardados.')
      router.push('/cuenta')
    } catch (err) {
      clientLogger.error('Facturacion save error:', err)
      setError(err instanceof Error ? err.message : 'No pudimos guardar los datos.')
    } finally {
      setSaving(false)
    }
  }, [form, router, showToast])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 16px',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Cargando datos de facturación…
        </p>
      </div>
    )
  }

  const isPdf = constanciaUrl?.includes('.pdf') || constanciaName.endsWith('.pdf')

  return (
    <>
      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Datos de facturación
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Información fiscal para tus comprobantes
          </p>
        </div>
      </div>

      {/* ── Tarjeta informativa ── */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 14px',
        background: 'rgba(26,124,250,.08)', border: '1px solid rgba(26,124,250,.2)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Estos datos se usarán para generar tu CFDI. Asegúrate de que coincidan
          exactamente con tu <strong style={{ color: 'var(--text)' }}>Constancia de Situación Fiscal</strong>.
        </p>
      </div>

      {/* ── Formulario ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 16px',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Sección: Datos fiscales ── */}
          <SectionTitle>Datos fiscales</SectionTitle>

          {/* RFC */}
          <FieldGroup label="RFC" id="rfc" hint="Persona física: 13 caracteres · Persona moral: 12 caracteres">
            <input
              id="rfc"
              name="rfc"
              className="field-input"
              value={form.rfc}
              onChange={e => setField('rfc', e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, ''))}
              placeholder="GARM900101AB3"
              maxLength={13}
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}
            />
          </FieldGroup>

          {/* Razón social */}
          <FieldGroup label="Razón social" id="razon_social"
            hint="Tal como aparece en tu Constancia de Situación Fiscal">
            <input
              id="razon_social"
              name="razon_social"
              className="field-input"
              value={form.razon_social}
              onChange={e => setField('razon_social', e.target.value.toUpperCase())}
              placeholder="GARCIA RAMIREZ MIGUEL"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
              maxLength={200}
            />
          </FieldGroup>

          {/* Régimen fiscal */}
          <FieldGroup label="Régimen fiscal" id="regimen_fiscal">
            <select
              id="regimen_fiscal"
              name="regimen_fiscal"
              className="field-input field-select"
              value={form.regimen_fiscal}
              onChange={e => setField('regimen_fiscal', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {REGIMENES_FISCALES.map(r => (
                <option key={r.value} value={r.value} disabled={r.value === ''}>
                  {r.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          {/* CP fiscal */}
          <FieldGroup label="Código Postal fiscal" id="cp_fiscal"
            hint="El que aparece en tu Constancia de Situación Fiscal (5 dígitos)">
            <input
              id="cp_fiscal"
              name="cp_fiscal"
              className="field-input"
              value={form.cp_fiscal}
              onChange={e => setField('cp_fiscal', e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="03100"
              inputMode="numeric"
              maxLength={5}
            />
          </FieldGroup>

          {/* Uso CFDI */}
          <FieldGroup label="Uso de CFDI" id="uso_cfdi">
            <select
              id="uso_cfdi"
              name="uso_cfdi"
              className="field-input field-select"
              value={form.uso_cfdi}
              onChange={e => setField('uso_cfdi', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {USOS_CFDI.map(u => (
                <option key={u.value} value={u.value} disabled={u.value === ''}>
                  {u.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          {/* Correo facturación */}
          <FieldGroup label="Correo para facturación" id="correo_facturacion"
            hint="A este correo te enviaremos tus facturas (puede ser diferente al de tu cuenta)">
            <input
              id="correo_facturacion"
              name="correo_facturacion"
              className="field-input"
              type="email"
              value={form.correo_facturacion}
              onChange={e => setField('correo_facturacion', e.target.value.trim())}
              placeholder="facturacion@empresa.com"
              inputMode="email"
            />
          </FieldGroup>

          {/* ── Sección: Constancia ── */}
          <SectionTitle>Constancia de Situación Fiscal</SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Vista previa / estado */}
            <div style={{
              border: `1.5px solid ${constanciaUrl ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: constanciaUrl ? 'rgba(34,197,94,.05)' : 'var(--surface-2)',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
              }}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>
                  {constanciaUrl ? (isPdf ? '📄' : '🖼️') : '📋'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: 'var(--text)' }}>
                    {constanciaUrl ? 'Constancia cargada' : 'Sin constancia'}
                  </p>
                  {constanciaName ? (
                    <p style={{
                      fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {constanciaName}
                    </p>
                  ) : (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      PDF, JPG o PNG · Máx 5 MB
                    </p>
                  )}
                </div>

                {/* Botón subir / cambiar */}
                <button
                  type="button"
                  onClick={() => constanciaRef.current?.click()}
                  disabled={constanciaUpload}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                    background: constanciaUrl ? 'var(--surface-2)' : 'var(--primary-dim)',
                    color: constanciaUrl ? 'var(--text-muted)' : 'var(--primary)',
                    border: `1px solid ${constanciaUrl ? 'var(--border)' : 'var(--primary)'}`,
                    fontSize: 12, fontWeight: 600,
                    cursor: constanciaUpload ? 'wait' : 'pointer', flexShrink: 0,
                  }}
                >
                  {constanciaUpload ? 'Subiendo…' : constanciaUrl ? 'Cambiar' : 'Subir'}
                </button>
              </div>

              {/* Preview imagen */}
              {constanciaUrl && !isPdf && (
                <div style={{ padding: '0 14px 12px' }}>
                  <img
                    src={constanciaUrl}
                    alt="Constancia de Situación Fiscal"
                    style={{
                      width: '100%', maxHeight: 160, objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)', display: 'block',
                    }}
                  />
                </div>
              )}

              {/* Link PDF */}
              {constanciaUrl && isPdf && (
                <div style={{ padding: '0 14px 12px' }}>
                  <a
                    href={constanciaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Ver constancia
                  </a>
                </div>
              )}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Puedes descargar tu constancia desde el portal del SAT en{' '}
              <a
                href="https://www.sat.gob.mx"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)', textDecoration: 'none' }}
              >
                sat.gob.mx
              </a>{' '}
              → Trámites → Constancia de Situación Fiscal.
            </p>
          </div>

          {/* Input file oculto */}
          <input
            ref={constanciaRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleConstancia}
          />

          {/* Error */}
          {error && (
            <p style={{
              fontSize: 12, color: 'var(--danger)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '10px 12px', margin: 0,
            }} role="alert">
              {error}
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar datos fiscales'}
          </button>
        </form>
      </div>
    </>
  )
}
