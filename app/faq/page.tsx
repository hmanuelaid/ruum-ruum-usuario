import Link from 'next/link'

const QUESTIONS = [
  {
    question: 'Como solicito un traslado?',
    answer: 'Inicia sesion, entra a Solicitar, captura vehiculo, ruta, horario y confirma la solicitud.',
  },
  {
    question: 'Puedo ver el estado de mi viaje?',
    answer: 'Si. Tus traslados aparecen en Viajes con el estado actualizado del proceso.',
  },
  {
    question: 'Donde consulto la evidencia?',
    answer: 'La evidencia inicial y final aparece en la seccion Evidencia cuando el conductor la registra.',
  },
  {
    question: 'Que hago si tengo un problema?',
    answer: 'Usa la seccion Soporte para enviar un reporte al equipo de atencion.',
  },
]

export default function FaqPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <Link href="/cuenta" className="btn-back">← Atrás</Link>
          <p className="eyebrow">Ayuda</p>
          <h1>Preguntas frecuentes</h1>
          <p className="muted">Respuestas rapidas sobre tus traslados.</p>
        </div>
      </section>

      <section className="stack">
        {QUESTIONS.map((item) => (
          <article className="card" key={item.question}>
            <h2>{item.question}</h2>
            <p className="muted">{item.answer}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
