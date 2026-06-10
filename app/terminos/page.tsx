import Link from 'next/link'

export default function TerminosPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <Link href="/cuenta" className="btn-back">← Atrás</Link>
          <p className="eyebrow">Legal</p>
          <h1>Terminos y condiciones</h1>
          <p className="muted">Condiciones generales de uso del servicio Ruum Ruum.</p>
        </div>
      </section>

      <section className="card">
        <h2>Uso del servicio</h2>
        <p className="muted">
          El usuario debe proporcionar informacion veraz del vehiculo, ruta, contactos y
          documentos requeridos para coordinar el traslado.
        </p>
      </section>

      <section className="card">
        <h2>Traslados</h2>
        <p className="muted">
          Cada solicitud queda sujeta a validacion operativa, disponibilidad de conductores
          certificados y confirmacion de datos antes de iniciar el servicio.
        </p>
      </section>

      <section className="card">
        <h2>Soporte</h2>
        <p className="muted">
          Cualquier incidencia debe reportarse desde la seccion Soporte para su seguimiento.
        </p>
      </section>
    </main>
  )
}
