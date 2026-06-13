"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowLeft } from "lucide-react";

const sections = [
  {
    num: "1",
    title: "Objeto y Aceptación",
    content: (
      <>
        <p>
          Los presentes Términos y Condiciones regulan el acceso y uso de la Plataforma Ruum Ruum,
          plataforma digital de movilidad vehicular que conecta a Usuarios con Conductores Certificados
          para la prestación de servicios de traslado vehicular.
        </p>
        <p>
          Al registrarse o utilizar la Plataforma, el Usuario acepta íntegramente estos Términos.
          Si no está de acuerdo, deberá abstenerse de usar la Plataforma.
        </p>
      </>
    ),
  },
  {
    num: "2",
    title: "Definiciones",
    content: (
      <ul>
        <li><strong>Plataforma:</strong> aplicación móvil y/o sitio web de Ruum Ruum.</li>
        <li><strong>Usuario:</strong> persona que solicita un servicio de traslado vehicular.</li>
        <li><strong>Conductor Certificado:</strong> persona verificada por Ruum Ruum para prestar servicios de traslado.</li>
        <li><strong>Servicio:</strong> traslado vehicular coordinado a través de la Plataforma.</li>
        <li><strong>Cuenta:</strong> perfil registrado en la Plataforma por el Usuario o Conductor Certificado.</li>
      </ul>
    ),
  },
  {
    num: "3",
    title: "Registro y Cuenta",
    content: (
      <>
        <p>
          Para utilizar la Plataforma es necesario crear una Cuenta con información veraz, completa y actualizada.
          El Usuario es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades
          realizadas desde su Cuenta.
        </p>
        <p>
          Ruum Ruum se reserva el derecho de verificar la identidad de los usuarios y rechazar o cancelar
          registros que incumplan estos Términos.
        </p>
      </>
    ),
  },
  {
    num: "4–5",
    title: "Descripción del Servicio y Tarifas",
    content: (
      <>
        <h3>4. Descripción del Servicio</h3>
        <p>
          Ruum Ruum actúa como intermediario tecnológico entre el Usuario y el Conductor Certificado.
          El servicio incluye la asignación del conductor, monitoreo del traslado mediante geolocalización
          y registro de evidencia fotográfica del estado del vehículo.
        </p>
        <h3>5. Tarifas y Pagos</h3>
        <p>
          Las tarifas se calculan conforme a los parámetros mostrados en la aplicación antes de confirmar
          el servicio. El cobro se realiza a través de los métodos de pago habilitados en la Plataforma.
          Ruum Ruum emitirá el comprobante correspondiente al correo registrado.
        </p>
      </>
    ),
  },
  {
    num: "6–8",
    title: "Obligaciones del Usuario, Conductor y Ruum Ruum",
    content: (
      <>
        <h3>6. Obligaciones del Usuario</h3>
        <ul>
          <li>Proporcionar información veraz sobre el vehículo y el servicio requerido.</li>
          <li>Estar presente o designar a un responsable en el punto de origen y destino.</li>
          <li>Revisar el estado del vehículo al inicio y término del servicio.</li>
          <li>No transportar objetos ilícitos ni materiales peligrosos en el vehículo.</li>
        </ul>
        <h3>7. Obligaciones del Conductor Certificado</h3>
        <ul>
          <li>Conducir el vehículo con diligencia y respetando las normas de tránsito.</li>
          <li>Registrar la evidencia fotográfica requerida en cada etapa del servicio.</li>
          <li>No utilizar el vehículo para fines distintos al traslado contratado.</li>
          <li>Reportar de inmediato cualquier incidente o siniestro ocurrido durante el servicio.</li>
        </ul>
        <h3>8. Obligaciones de Ruum Ruum</h3>
        <ul>
          <li>Asignar Conductores Certificados verificados para la prestación del servicio.</li>
          <li>Proveer los mecanismos de seguimiento y evidencia fotográfica del traslado.</li>
          <li>Atender reclamaciones conforme a la Política de Cancelaciones y Reembolsos.</li>
        </ul>
      </>
    ),
  },
  {
    num: "9",
    title: "Cancelaciones e Incidentes",
    content: (
      <>
        <h3>9.1 Cancelación por el Usuario</h3>
        <p>
          El Usuario podrá cancelar una solicitud antes de que el Conductor Certificado haya iniciado
          el servicio, sujeto a los cargos de la Política de Cancelaciones.
        </p>
        <h3>9.2 Cancelación por el Conductor</h3>
        <p>
          El Conductor Certificado podrá rechazar o cancelar un servicio en los supuestos previstos
          por la Plataforma, sin que ello genere responsabilidad alguna para Ruum Ruum.
        </p>
        <h3>9.3 Reporte de Incidentes</h3>
        <p>
          Cualquier incidente ocurrido durante el traslado deberá ser reportado de forma inmediata
          a través de la aplicación.
        </p>
      </>
    ),
  },
  {
    num: "10–16",
    title: "Privacidad, Propiedad Intelectual, Responsabilidad y Jurisdicción",
    content: (
      <>
        <h3>10. Privacidad</h3>
        <p>
          Ruum Ruum recaba y trata los datos personales de conformidad con su Política de Privacidad
          y la legislación aplicable. El Usuario podrá ejercer sus derechos ARCO mediante los canales establecidos.
        </p>
        <h3>11. Propiedad Intelectual</h3>
        <p>
          La Plataforma, incluyendo su diseño, código fuente, logotipos, interfaces y contenidos, son
          propiedad exclusiva de Ruum Ruum o de sus licenciantes. Queda prohibida la reproducción o
          uso comercial no autorizado.
        </p>
        <h3>12. Limitación de Responsabilidad</h3>
        <p>
          Ruum Ruum no garantiza la disponibilidad ininterrumpida de la Plataforma. En la máxima medida
          permitida por la ley, Ruum Ruum no será responsable por pérdidas indirectas, fallos de
          conectividad ni actos u omisiones de los Conductores Certificados.
        </p>
        <h3>13. Modificaciones</h3>
        <p>
          Las modificaciones a estos Términos serán notificadas con al menos 15 días naturales de
          anticipación. El uso continuado constituirá su aceptación.
        </p>
        <h3>14. Suspensión de Cuenta</h3>
        <p>
          Ruum Ruum podrá suspender o cancelar una Cuenta por incumplimiento de los Términos, uso
          fraudulento, información falsa o requerimiento de autoridad competente.
        </p>
        <h3>15–16. Ley Aplicable y Contacto</h3>
        <p>
          Los Términos se rigen por las leyes de los Estados Unidos Mexicanos. Las controversias se
          someten a los tribunales competentes de la Ciudad de México. Para dudas o reclamaciones,
          contacta al equipo a través de la aplicación móvil.
        </p>
      </>
    ),
  },
];

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

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="py-6">
          <Link href="/cuenta" className="inline-flex items-center gap-2 text-[#6b82a8] text-sm hover:text-[#f0f4ff] transition-colors mb-6">
            <ArrowLeft size={16} /> Volver a Cuenta
          </Link>
          <p className="text-[11px] font-bold text-[#1A7CFA] tracking-widest uppercase mb-2">📋 Documentos Legales</p>
          <h1 className="text-2xl font-black mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="bg-[#0c1428] border border-[#1a2845] rounded-[14px] p-5 mb-6 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.25)] flex items-center justify-center text-xl flex-shrink-0">
            📄
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold mb-1">Términos y Condiciones de Uso</h2>
            <div className="flex gap-3 text-[12px] text-[#6b82a8] flex-wrap">
              <span>Versión 1.0 — Junio 2026</span>
              <span>Ruum Ruum Plataforma Digital</span>
            </div>
          </div>
        </div>

        {sections.map((s, i) => (
          <Accordion key={s.num} num={s.num} title={s.title} defaultOpen={i === 0}>
            {s.content}
          </Accordion>
        ))}

        <div className="mt-5 bg-[rgba(26,124,250,0.08)] border border-[rgba(26,124,250,0.2)] rounded-[14px] p-5 flex gap-4">
          <span className="text-2xl flex-shrink-0">✅</span>
          <div>
            <p className="text-[13px] font-bold mb-1">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] text-[#6b82a8] leading-relaxed">
              Al registrarte y utilizar Ruum Ruum aceptas íntegramente estos Términos y Condiciones de Uso.
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
