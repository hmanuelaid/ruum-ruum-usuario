"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowLeft } from "lucide-react";

function Accordion({ num, title, children, defaultOpen = false }: {
  num: string; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#1a2845] rounded-[14px] overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#0c1428] hover:bg-[#111e38] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[#1A7CFA] bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.2)] rounded-md px-2 py-0.5">
            {num}
          </span>
          <span className="text-[14px] font-bold text-left">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-[#6b82a8] transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pt-3 pb-5 border-t border-[#1a2845] bg-[#0c1428] prose-ruum">
          {children}
        </div>
      )}
    </div>
  );
}

export default function IncidentesPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="py-6">
          <Link href="/cuenta" className="inline-flex items-center gap-2 text-[#6b82a8] text-sm hover:text-[#f0f4ff] transition-colors mb-6">
            <ArrowLeft size={16} /> Volver a Cuenta
          </Link>
          <p className="text-[11px] font-bold text-[#1A7CFA] tracking-widest uppercase mb-2">📋 Documentos Legales</p>
          <h1 className="text-2xl font-black mb-2">Política de Incidentes y Siniestros</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[14px] p-4 mb-6 flex gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-[13px] text-[#f59e0b] leading-relaxed">
            En situaciones de emergencia que pongan en riesgo la integridad física de las personas, contacta primero a los servicios de emergencia y posteriormente notifica el incidente a Ruum Ruum.
          </p>
        </div>

        <div className="bg-[#0c1428] border border-[#1a2845] rounded-[14px] p-5 mb-6 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.25)] flex items-center justify-center text-xl flex-shrink-0">
            🚨
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold mb-1">Política de Incidentes y Siniestros</h2>
            <div className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</div>
          </div>
        </div>

        <Accordion num="1" title="Principios Generales" defaultOpen>
          <p>
            Todos los servicios cuentan con registro de evidencia fotográfica y de geolocalización al inicio y término
            del traslado. Dicha evidencia constituye el principal medio de verificación para la atención de cualquier
            incidente o siniestro.
          </p>
          <ul>
            <li>Todo incidente debe reportarse a través de la app tan pronto como sea detectado, dentro de los plazos establecidos.</li>
            <li>La evidencia fotográfica del Inicio del Servicio se considera el estado base del vehículo para comparación.</li>
            <li>Ruum Ruum actuará como facilitador entre el Usuario y el Conductor Certificado, sin que ello implique responsabilidad directa salvo en los casos expresamente señalados en esta Política.</li>
          </ul>
        </Accordion>

        <Accordion num="2" title="Daños al Vehículo">
          <h3>2.1 Reporte de Daños</h3>
          <p>
            Si el Usuario identifica un daño que no estaba presente al momento de la entrega, deberá reportarlo mediante
            "Reportar problema" en la app, <strong>dentro de las 2 horas siguientes a la entrega</strong> en el punto de destino.
            El reporte debe incluir fotografías del daño y una descripción de su ubicación y características.
          </p>
          <h3>2.2 Evaluación y Resolución</h3>
          <p>Ruum Ruum comparará las fotografías con la evidencia registrada al inicio y término del servicio:</p>
          <ul>
            <li>Si la evidencia confirma que el daño ocurrió durante el traslado, se gestionará la reparación o compensación conforme al acuerdo con el Conductor Certificado.</li>
            <li>Si la evidencia muestra que el daño ya existía al Inicio del Servicio, o no es posible determinar su origen, no procederá compensación.</li>
            <li>La resolución se notificará dentro de <strong>10 días hábiles</strong> desde la recepción del reporte completo.</li>
          </ul>
          <div className="mt-3 p-3 bg-[rgba(26,124,250,0.06)] border-l-2 border-[#1A7CFA] rounded-r-lg text-[13px] text-[#6b82a8]">
            Se recomienda revisar y conservar la evidencia fotográfica generada al inicio y término del Servicio, disponible en el historial de viajes de la app.
          </div>
        </Accordion>

        <Accordion num="3" title="Robo">
          <h3>3.1 Robo del Vehículo Durante el Servicio</h3>
          <p>El Conductor Certificado deberá:</p>
          <ul>
            <li>Dar aviso inmediato a las autoridades competentes y presentar la denuncia correspondiente.</li>
            <li>Notificar el incidente a Ruum Ruum a través de los canales de soporte de la app.</li>
            <li>Proporcionar información sobre el lugar, hora, circunstancias del incidente y número de denuncia.</li>
          </ul>
          <h3>3.2 Robo de Objetos Personales</h3>
          <p>
            Ruum Ruum no se hace responsable por la pérdida, robo o daño de objetos personales dejados dentro del vehículo.
            Se recomienda retirar las pertenencias personales antes de entregar el vehículo para el Servicio.
          </p>
          <h3>3.3 Procedimiento Posterior</h3>
          <p>Una vez recibido el reporte, Ruum Ruum:</p>
          <ul>
            <li>Suspenderá el servicio activo y, en su caso, la cuenta del Conductor mientras se investiga.</li>
            <li>Brindará al Usuario la información de geolocalización y evidencia disponible para apoyar el proceso ante las autoridades.</li>
            <li>Cooperará con las autoridades competentes proporcionando los registros de la Plataforma.</li>
          </ul>
        </Accordion>

        <Accordion num="4" title="Llaves del Vehículo">
          <h3>4.1 Entrega y Resguardo de Llaves</h3>
          <p>
            Al Inicio del Servicio, el Usuario entrega las llaves al Conductor Certificado, quien las resguarda durante
            todo el traslado y las devuelve al Usuario o persona designada en el punto de destino al término del Servicio.
          </p>
          <h3>4.2 Pérdida de Llaves</h3>
          <p>En caso de pérdida durante el Servicio:</p>
          <ul>
            <li>El Conductor deberá reportar el incidente de inmediato a través de la app y canales de soporte.</li>
            <li>Ruum Ruum solicitará información sobre el momento, lugar de la pérdida y última ubicación registrada del vehículo.</li>
            <li>Los costos de duplicación, apertura o reprogramación serán evaluados conforme a la investigación.</li>
          </ul>
          <h3>4.3 Llaves Olvidadas dentro del Vehículo</h3>
          <p>
            Si al término del Servicio las llaves quedaron dentro del vehículo asegurado, el Conductor deberá reportarlo
            de inmediato y seguir las instrucciones del equipo de soporte para coordinar la entrega al Usuario.
          </p>
        </Accordion>

        <Accordion num="5" title="Retrasos">
          <h3>5.1 Retrasos del Conductor Certificado</h3>
          <p>Si el Conductor no llega al punto de origen en el tiempo estimado, el Usuario podrá:</p>
          <ul>
            <li>Consultar en tiempo real la ubicación y tiempo estimado de llegada actualizado.</li>
            <li>Cancelar el Servicio conforme a la Política de Cancelaciones sin cargo si el retraso supera el tiempo máximo establecido.</li>
          </ul>
          <h3>5.2 Retrasos Durante el Traslado</h3>
          <p>
            Los retrasos atribuibles a tráfico, condiciones climáticas, bloqueos viales u otras circunstancias ajenas al
            control del Conductor no constituyen incumplimiento, siempre que el Conductor mantenga informado al Usuario
            cuando sea posible.
          </p>
          <h3>5.3 Retrasos en la Entrega del Vehículo</h3>
          <p>
            Si el Conductor prevé un retraso significativo en la entrega, deberá notificarlo al Usuario a través de la app
            indicando el motivo. Los retrasos reiterados o no justificados podrán ser objeto de revisión conforme a los
            criterios de desempeño del acuerdo de prestación de servicios.
          </p>
        </Accordion>

        <Accordion num="6" title="Accidentes">
          <h3>6.1 Procedimiento Inmediato</h3>
          <p>En caso de accidente vial durante el Servicio, el Conductor deberá:</p>
          <ul>
            <li>Detener el vehículo en un lugar seguro y activar las señales de emergencia.</li>
            <li>Solicitar asistencia médica y/o de autoridades de tránsito si la situación lo requiere.</li>
            <li>Notificar el accidente a Ruum Ruum a través de la app o canales de soporte.</li>
            <li>Documentar el accidente con fotografías del vehículo, lugar de los hechos y reporte de tránsito.</li>
          </ul>
          <h3>6.2 Información a Reportar</h3>
          <ul>
            <li>Fecha, hora y ubicación del accidente.</li>
            <li>Descripción general de lo ocurrido.</li>
            <li>Evidencia fotográfica de los daños y del lugar de los hechos.</li>
            <li>Datos de contacto de los involucrados y número de parte vial o reporte de autoridad.</li>
          </ul>
          <h3>6.3 Atención por parte de Ruum Ruum</h3>
          <p>Una vez recibido el reporte, Ruum Ruum:</p>
          <ul>
            <li>Suspenderá el Servicio activo y, de ser necesario, gestionará la asignación de un Conductor alternativo.</li>
            <li>Notificará al Usuario sobre lo ocurrido y los siguientes pasos del proceso.</li>
            <li>Brindará acompañamiento durante el reporte ante las autoridades y, en su caso, la aseguradora.</li>
          </ul>
          <h3>6.4 Responsabilidad y Seguros</h3>
          <p>
            La responsabilidad derivada de un accidente se determinará conforme a las pólizas vigentes, el reporte de
            la autoridad de tránsito y el acuerdo de prestación de servicios con el Conductor Certificado. Ruum Ruum
            facilitará la información disponible sin asumir responsabilidad directa sobre los hechos del accidente.
          </p>
        </Accordion>

        <Accordion num="7–9" title="Canales de Reporte, Modificaciones y Aceptación">
          <h3>7. Canales de Reporte de Incidentes</h3>
          <ul>
            <li>Opción "Reportar problema" en el historial de viajes de la app móvil.</li>
            <li>Canales de soporte y atención al cliente de Ruum Ruum, para incidentes que requieran atención inmediata.</li>
          </ul>
          <h3>8. Modificaciones a la Política</h3>
          <p>
            Ruum Ruum podrá modificar esta Política en cualquier momento. Las modificaciones entran en vigor con su
            publicación en la app y/o el sitio web. El uso continuado constituye aceptación de las mismas.
          </p>
          <h3>9. Aceptación</h3>
          <p>
            El uso de la Plataforma, así como la solicitud o prestación de un servicio de traslado, implica la aceptación
            de la presente Política de Incidentes y Siniestros.
          </p>
        </Accordion>

        <div className="mt-5 bg-[rgba(26,124,250,0.08)] border border-[rgba(26,124,250,0.2)] rounded-[14px] p-5 flex gap-4">
          <span className="text-2xl flex-shrink-0">🚨</span>
          <div>
            <p className="text-[13px] font-bold mb-1">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] text-[#6b82a8] leading-relaxed">
              El uso de la Plataforma implica la aceptación de la presente Política de Incidentes y Siniestros.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#1a2845]">
          <span className="text-[11px] font-semibold text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] px-3 py-1 rounded-full">Vigente</span>
          <span className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</span>
        </div>
      </div>

      <style>{`
        .prose-ruum p { font-size:14px; color:#6b82a8; margin-bottom:10px; line-height:1.65; }
        .prose-ruum p:last-child { margin-bottom:0; }
        .prose-ruum strong { color:#f0f4ff; font-weight:600; }
        .prose-ruum h3 { font-size:13px; font-weight:700; color:#f0f4ff; margin:16px 0 8px; display:flex; align-items:center; gap:6px; }
        .prose-ruum h3::before { content:''; width:3px; height:14px; background:#1A7CFA; border-radius:2px; flex-shrink:0; display:inline-block; }
        .prose-ruum ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .prose-ruum li { font-size:13.5px; color:#6b82a8; padding:7px 10px 7px 28px; background:#111e38; border-radius:8px; position:relative; line-height:1.55; }
        .prose-ruum li::before { content:''; position:absolute; left:10px; top:50%; transform:translateY(-50%); width:5px; height:5px; border-radius:50%; background:#1A7CFA; }
        .prose-ruum li strong { color:#f0f4ff; }
      `}</style>
    </div>
  );
}
