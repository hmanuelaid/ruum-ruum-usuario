import Link from 'next/link'

const LEGAL_DOCUMENT_URL = '/legal/RuumRuum_Documentos_Legales_Base.docx'

const documents = [
  'Términos y condiciones',
  'Aviso de privacidad integral',
  'Política de cookies',
  'Política de cancelaciones',
  'Consentimiento de evidencias fotográficas',
  'Consentimiento de geolocalización',
  'Acuerdo de firma electrónica',
]

export default function LegalPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <Link href="/cuenta" className="btn-back">← Atrás</Link>
          <p className="eyebrow">Legal</p>
          <h1>Documentos legales</h1>
          <p className="muted">
            Consulta y descarga los documentos legales base de Ruum-Ruum by MoviliaX.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Documento completo</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Este archivo reúne las condiciones, avisos y consentimientos aplicables al uso del servicio.
        </p>
        <a
          className="btn-primary"
          href={LEGAL_DOCUMENT_URL}
          download
          style={{ display: 'inline-flex', textDecoration: 'none' }}
        >
          Descargar documentos legales
        </a>
      </section>

      <section className="card">
        <h2>Incluye</h2>
        <div className="stack" style={{ gap: 8 }}>
          {documents.map((document) => (
            <div
              key={document}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{document}</span>
              <span style={{ color: 'var(--text-muted)' }}>DOCX</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Accesos rápidos</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <Link className="btn-secondary" href="/terminos" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Ver términos y condiciones
          </Link>
          <Link className="btn-secondary" href="/privacidad" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Ver aviso de privacidad
          </Link>
        </div>
      </section>
    </main>
  )
}
