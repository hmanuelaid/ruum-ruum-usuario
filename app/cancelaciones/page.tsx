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

export default function CancelacionesPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="py-6">
          <Link href="/cuenta" className="inline-flex items-center gap-2 text-[#6b82a8] text-sm hover:text-[#f0f4ff] transition-colors mb-6">
            <ArrowLeft size={16} /> Volver a Cuenta
          </Link>
          <p className="text-[11px] font-bold text-[#1A7CFA] tracking-widest uppercase mb-2">📋 Documentos Legales</p>
          <h1 className="text-2xl font-black mb-2">Política de Cancelaciones y Reembolsos</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="bg-[#0c1428] border border-[#1a2845] rounded-[14px] p-5 mb-6 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.25)] flex items-center justify-center text-xl flex-shrink-0">
            ↩️
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold mb-1">Política de Cancelaciones y Reembolsos</h2>
            <div className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</div>
          </div>
        </div>

        <Accordion num="1" title="Definiciones Relevantes" defaultOpen>
          <ul>
            <li><strong>Solicitud de Traslado:</strong> petición de servicio generada por el Usuario con información del vehículo, origen, destino y tarifa.</li>
            <li><strong>Confirmación del Servicio:</strong> momento en que el Conductor Certificado acepta la solicitud.</li>
            <li><strong>Inicio del Servicio:</strong> momento en que el Conductor llega al origen, registra evidencia fotográfica y marca el traslado como iniciado.</li>
            <li><strong>Cancelación:</strong> acción de anular una Solicitud de Traslado antes o durante su ejecución.</li>
            <li><strong>Cargo por Cancelación:</strong> monto cobrado al Usuario según el momento de la cancelación.</li>
            <li><strong>Reembolso:</strong> devolución total o parcial del monto cobrado según las condiciones de esta Política.</li>
          </ul>
        </Accordion>

        <Accordion num="2" title="Cancelación por el Usuario">
          <h3>2.1 Ventanas de Cancelación y Cargos Aplicables</h3>
          <p>El Usuario podrá cancelar en cualquier momento antes del Inicio del Servicio. Los cargos varían según el momento:</p>
          <div className="overflow-x-auto mt-3 mb-3 rounded-[10px] border border-[#1a2845]">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#111e38]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-[#1A7CFA] uppercase tracking-wide border-b border-[#1a2845]">Momento de cancelación</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-[#1A7CFA] uppercase tracking-wide border-b border-[#1a2845]">Cargo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[rgba(26,40,69,0.6)]">
                  <td className="px-4 py-3 text-[#6b82a8]">Antes de la Confirmación del Servicio</td>
                  <td className="px-4 py-3 text-[#22c55e] font-semibold">Sin cargo — reembolso total</td>
                </tr>
                <tr className="border-b border-[rgba(26,40,69,0.6)]">
                  <td className="px-4 py-3 text-[#6b82a8]">Hasta 5 min después de la Confirmación</td>
                  <td className="px-4 py-3 text-[#f0f4ff]">Sin cargo — reembolso total</td>
                </tr>
                <tr className="border-b border-[rgba(26,40,69,0.6)]">
                  <td className="px-4 py-3 text-[#6b82a8]">Entre 5 y 15 min después de la Confirmación</td>
                  <td className="px-4 py-3 text-[#f59e0b]">Cargo parcial (según tarifa)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#6b82a8]">Después de 15 min o tras el Inicio del Servicio</td>
                  <td className="px-4 py-3 text-[#ef4444]">Cargo total por cancelación</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3>2.2 Cómo Cancelar</h3>
          <p>La cancelación se realiza desde la app en el detalle del servicio activo, opción "Cancelar servicio". No se aceptan cancelaciones por canales no oficiales.</p>
          <h3>2.3 Cancelaciones Frecuentes</h3>
          <p>Ruum Ruum se reserva el derecho de suspender temporalmente la Cuenta de un Usuario con cancelaciones excesivas, notificándolo previamente.</p>
        </Accordion>

        <Accordion num="3" title="Cancelación por el Conductor Certificado">
          <h3>3.1 Supuestos de Cancelación</h3>
          <ul>
            <li>Imposibilidad de localizar el punto de origen dentro del tiempo establecido.</li>
            <li>Condiciones del vehículo que impidan la realización segura del traslado, debidamente reportadas.</li>
            <li>Emergencia personal o fuerza mayor, con reporte inmediato a operaciones de Ruum Ruum.</li>
            <li>Incumplimiento del Usuario de las condiciones pactadas para el traslado.</li>
          </ul>
          <h3>3.2 Efectos de la Cancelación por el Conductor</h3>
          <p>Ruum Ruum iniciará la búsqueda de un conductor alternativo. Si no hay disponibilidad, el Usuario recibirá reembolso total. Las cancelaciones injustificadas o frecuentes pueden derivar en suspensión del Conductor.</p>
        </Accordion>

        <Accordion num="4" title="Cancelación por Ruum Ruum">
          <p>Ruum Ruum podrá cancelar sin responsabilidad en los siguientes casos:</p>
          <ul>
            <li>Fuerza mayor o caso fortuito (desastres naturales, contingencias de salud, bloqueos extraordinarios).</li>
            <li>Detección de actividad fraudulenta o sospechosa.</li>
            <li>Incumplimiento de Términos y Condiciones por parte del Usuario.</li>
            <li>Fallo técnico grave que impida la asignación o monitoreo del servicio.</li>
            <li>Imposibilidad de procesar el pago del servicio.</li>
          </ul>
          <p>En todos estos casos, salvo fraude o incumplimiento del Usuario, se otorgará reembolso total.</p>
        </Accordion>

        <Accordion num="5" title="Política de Reembolsos">
          <h3>5.1 Plazos de Procesamiento</h3>
          <ul>
            <li><strong>Tarjetas de crédito o débito:</strong> 5 a 10 días hábiles (sujeto a la institución bancaria).</li>
            <li><strong>Monedero digital en la app:</strong> dentro de las 24 horas siguientes a la confirmación.</li>
            <li><strong>Transferencia bancaria:</strong> 3 a 7 días hábiles.</li>
          </ul>
          <h3>5.2 Método de Reembolso</h3>
          <p>El reembolso se realiza por el mismo método de pago original. En casos excepcionales puede acordarse otro método habilitado en la Plataforma.</p>
          <h3>5.3 Reembolsos por Servicio Deficiente</h3>
          <p>Si el servicio no cumplió las condiciones acordadas (daño documentado, ruta incompleta, conducta inapropiada), el Usuario puede solicitar reembolso parcial o total mediante el proceso de reclamación de la Sección 6.</p>
          <h3>5.4 Cargos No Reembolsables</h3>
          <ul>
            <li>Cargos por cancelación según la tabla de la Sección 2.1.</li>
            <li>Cargos por servicios plenamente concluidos y entregados de conformidad.</li>
            <li>Comisiones de procesamiento de pago aplicadas por terceros, cuando aplique.</li>
          </ul>
        </Accordion>

        <Accordion num="6" title="Proceso de Reclamaciones">
          <h3>6.1 Cómo Presentar una Reclamación</h3>
          <p>Desde el historial de viajes en la app, seleccionar "Reportar problema". La reclamación debe incluir:</p>
          <ul>
            <li>Descripción del motivo de la reclamación.</li>
            <li>Evidencia de soporte (fotografías, capturas u otros documentos relevantes).</li>
            <li>El monto que considera debe ser reembolsado y la justificación.</li>
          </ul>
          <h3>6.2 Plazos para Presentar una Reclamación</h3>
          <p>Las reclamaciones deben presentarse dentro de los <strong>5 días hábiles</strong> siguientes a la fecha de conclusión del servicio o del cargo aplicado.</p>
          <h3>6.3 Resolución</h3>
          <p>Ruum Ruum analizará cada reclamación individualmente considerando la evidencia disponible. La resolución se notificará en un máximo de <strong>10 días hábiles</strong> desde la recepción completa. La decisión es definitiva en primera instancia, sin perjuicio del derecho del Usuario de acudir a instancias legales o de protección al consumidor.</p>
        </Accordion>

        <Accordion num="7" title="Servicios Programados con Anticipación">
          <ul>
            <li><strong>Más de 24 horas antes:</strong> sin cargo, reembolso total.</li>
            <li><strong>Entre 12 y 24 horas antes:</strong> cargo del 10%, reembolso del 90%.</li>
            <li><strong>Entre 6 y 12 horas antes:</strong> cargo del 25%, reembolso del 75%.</li>
            <li><strong>Menos de 6 horas antes:</strong> se aplican los cargos de la tabla general (Sección 2.1).</li>
          </ul>
        </Accordion>

        <Accordion num="8–10" title="Corporativos, Modificaciones y Contacto">
          <h3>8. Servicios Corporativos o de Alto Volumen</h3>
          <p>Las empresas con contrato corporativo se rigen por sus condiciones específicas. En caso de silencio del contrato, se aplica supletoriamente esta Política.</p>
          <h3>9. Modificaciones a la Política</h3>
          <p>Ruum Ruum notificará cambios con al menos 10 días naturales de anticipación cuando impliquen condiciones menos favorables. El uso continuado constituye aceptación.</p>
          <h3>10. Contacto y Soporte</h3>
          <ul>
            <li>Sección de Ayuda o Soporte dentro de la aplicación móvil.</li>
            <li>Canales de atención al cliente habilitados en el sitio web oficial de Ruum Ruum.</li>
          </ul>
        </Accordion>

        <div className="mt-5 bg-[rgba(26,124,250,0.08)] border border-[rgba(26,124,250,0.2)] rounded-[14px] p-5 flex gap-4">
          <span className="text-2xl flex-shrink-0">↩️</span>
          <div>
            <p className="text-[13px] font-bold mb-1">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] text-[#6b82a8] leading-relaxed">
              El uso de la Plataforma implica la aceptación de la presente Política de Cancelaciones y Reembolsos.
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
