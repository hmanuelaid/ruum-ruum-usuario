import Link from 'next/link'

export default function PrivacidadPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <Link href="/cuenta" className="btn-back">← Atrás</Link>
          <p className="eyebrow">Legal</p>
          <h1>Aviso de privacidad</h1>
          <p className="muted">Resumen de como protegemos tus datos dentro de Ruum Ruum.</p>
        </div>
      </section>

      <section className="card">
        <h2>Datos que usamos</h2>
        <p className="muted">
          Usamos tus datos de contacto, vehiculo, ruta y documentos para operar, validar y
          dar seguimiento a tus traslados.
        </p>
      </section>

      <section className="card">
        <h2>Proteccion</h2>
        <p className="muted">
          Los documentos se almacenan en un bucket privado y se consultan mediante accesos
          temporales autenticados.
        </p>
      </section>

      <section className="card">
        <h2>Contacto</h2>
        <p className="muted">
          Para solicitudes relacionadas con privacidad, contacta al equipo desde Soporte.
        </p>
      </section>
    </main>
  )
}
