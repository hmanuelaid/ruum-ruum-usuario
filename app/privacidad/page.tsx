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

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="py-6">
          <Link href="/cuenta" className="inline-flex items-center gap-2 text-[#6b82a8] text-sm hover:text-[#f0f4ff] transition-colors mb-6">
            <ArrowLeft size={16} /> Volver a Cuenta
          </Link>
          <p className="text-[11px] font-bold text-[#1A7CFA] tracking-widest uppercase mb-2">📋 Documentos Legales</p>
          <h1 className="text-2xl font-black mb-2">Aviso de Privacidad Integral</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026 · Cumplimiento LFPDPPP · INAI</p>
        </div>

        <div className="bg-[#0c1428] border border-[#1a2845] rounded-[14px] p-5 mb-6 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.25)] flex items-center justify-center text-xl flex-shrink-0">
            🔒
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold mb-1">Aviso de Privacidad Integral</h2>
            <div className="flex gap-3 text-[12px] text-[#6b82a8] flex-wrap">
              <span>Versión 1.0 — Junio 2026</span>
              <span>Cumplimiento LFPDPPP · INAI</span>
            </div>
          </div>
        </div>

        <Accordion num="1" title="Identidad del Responsable" defaultOpen>
          <p>
            Ruum Ruum, plataforma digital de movilidad vehicular, es responsable del tratamiento de sus datos personales.
            Para cualquier asunto relacionado con el presente Aviso, puede contactarnos a través de los canales habilitados
            en la aplicación móvil o en el sitio web oficial de la plataforma.
          </p>
        </Accordion>

        <Accordion num="2" title="Datos Personales que Recabamos">
          <h3>2.1 Usuarios</h3>
          <ul>
            <li><strong>Identificación y contacto:</strong> nombre completo, correo electrónico, teléfono, fotografía de perfil (opcional).</li>
            <li><strong>Datos del vehículo:</strong> marca, modelo, año, color, placa y número de serie (VIN).</li>
            <li><strong>Geolocalización:</strong> origen, destino y trazabilidad de la ruta durante el servicio.</li>
            <li><strong>Transaccionales:</strong> historial de servicios, métodos de pago (procesados por proveedores certificados), calificaciones.</li>
            <li><strong>Técnicos:</strong> tipo de dispositivo, sistema operativo, versión de la app, dirección IP y datos de sesión.</li>
          </ul>
          <h3>2.2 Conductores Certificados</h3>
          <ul>
            <li>Identificación oficial vigente (INE/IFE o pasaporte), comprobante de domicilio.</li>
            <li>Licencia de conducir vigente, CURP/NSS, antecedentes no penales.</li>
            <li>Historial de viajes, calificaciones recibidas, datos bancarios para pago de servicios.</li>
          </ul>
          <h3>2.3 Datos Sensibles</h3>
          <p>
            En el proceso de verificación de Conductores Certificados podrían recabarse antecedentes penales,
            tratados con medidas de seguridad reforzadas conforme a la LFPDPPP.
          </p>
        </Accordion>

        <Accordion num="3" title="Finalidades del Tratamiento">
          <h3>3.1 Finalidades Primarias (necesarias para el servicio)</h3>
          <ul>
            <li>Gestionar el registro y autenticación en la Plataforma.</li>
            <li>Procesar y coordinar solicitudes de traslado vehicular.</li>
            <li>Asignar Conductores Certificados y monitorear el traslado en tiempo real.</li>
            <li>Gestionar la evidencia fotográfica del estado del vehículo.</li>
            <li>Procesar los pagos por servicios prestados.</li>
            <li>Atender reportes de incidentes, reclamaciones y solicitudes de soporte.</li>
            <li>Validar identidad y documentación de Conductores Certificados.</li>
            <li>Dar cumplimiento a obligaciones legales y regulatorias aplicables.</li>
          </ul>
          <h3>3.2 Finalidades Secundarias (con consentimiento)</h3>
          <ul>
            <li>Enviar comunicaciones de marketing, promociones y novedades.</li>
            <li>Realizar encuestas de satisfacción y estudios de mercado.</li>
            <li>Personalizar la experiencia de uso en la Plataforma.</li>
            <li>Generar estadísticas e informes internos de operación.</li>
          </ul>
          <div className="mt-3 p-3 bg-[rgba(26,124,250,0.06)] border-l-2 border-[#1A7CFA] rounded-r-lg text-[13px] text-[#6b82a8]">
            Si no deseas que tus datos sean tratados para finalidades secundarias, puedes manifestarlo a través de los
            canales de contacto. La negativa no afectará la prestación del servicio principal.
          </div>
        </Accordion>

        <Accordion num="4" title="Transferencia de Datos Personales">
          <p>Ruum Ruum podrá transferir sus datos a:</p>
          <ul>
            <li>Proveedores de servicios tecnológicos (pago, almacenamiento, mapas y geolocalización) bajo acuerdos de confidencialidad.</li>
            <li>Autoridades competentes cuando lo requiera la ley o una resolución judicial.</li>
            <li>Socios comerciales o afiliadas para servicios complementarios, siempre con su consentimiento previo.</li>
          </ul>
          <p>Las transferencias que no requieren consentimiento son las previstas en el artículo 37 de la LFPDPPP.</p>
        </Accordion>

        <Accordion num="5" title="Derechos ARCO">
          <p>
            Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento de tus datos (derechos ARCO),
            así como a revocar el consentimiento otorgado.
          </p>
          <h3>5.1 Procedimiento</h3>
          <p>
            Envía una solicitud a través de los canales habilitados en la app, indicando: nombre completo, datos de contacto,
            documentos que acrediten tu identidad, y descripción clara del derecho que deseas ejercer.
          </p>
          <h3>5.2 Plazos de Respuesta</h3>
          <p>
            Ruum Ruum responderá en un plazo máximo de <strong>20 días hábiles</strong> a partir de la recepción,
            ampliable por 20 días hábiles adicionales en casos justificados.
          </p>
        </Accordion>

        <Accordion num="6–10" title="Revocación, Seguridad, Cookies, Cambios y Autoridad">
          <h3>6. Revocación del Consentimiento</h3>
          <p>
            El Titular podrá revocar el consentimiento en cualquier momento, salvo que el tratamiento sea necesario para
            cumplimiento legal o contractual. La revocación puede ocasionar la imposibilidad de continuar el servicio.
          </p>
          <h3>7. Seguridad de los Datos Personales</h3>
          <ul>
            <li>Cifrado de información en tránsito y en reposo.</li>
            <li>Control de acceso basado en roles para el personal de Ruum Ruum.</li>
            <li>Acuerdos de confidencialidad con proveedores y colaboradores.</li>
            <li>Auditorías periódicas de seguridad de la información.</li>
            <li>Protocolos de respuesta ante incidentes de seguridad.</li>
          </ul>
          <h3>8. Uso de Tecnologías de Rastreo</h3>
          <p>
            La Plataforma utiliza cookies, balizas web y píxeles de seguimiento. Consulta la Política de Cookies
            de Ruum Ruum para información detallada, disponible en la app y en el sitio web oficial.
          </p>
          <h3>9. Cambios al Aviso de Privacidad</h3>
          <p>
            Cualquier modificación se notificará con al menos 15 días de anticipación a través de la app y/o el sitio web oficial.
          </p>
          <h3>10. Autoridad Supervisora</h3>
          <p>
            Para asuntos sobre protección de datos: <strong>INAI</strong>, Insurgentes Sur 3211, Col. Insurgentes Cuicuilco,
            Alcaldía Coyoacán, C.P. 04530, Ciudad de México. Sitio web:{" "}
            <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-[#1A7CFA] underline">
              www.inai.org.mx
            </a>
          </p>
        </Accordion>

        <div className="mt-5 bg-[rgba(26,124,250,0.08)] border border-[rgba(26,124,250,0.2)] rounded-[14px] p-5 flex gap-4">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div>
            <p className="text-[13px] font-bold mb-1">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] text-[#6b82a8] leading-relaxed">
              El uso de la Plataforma implica la aceptación del presente Aviso de Privacidad Integral.
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
