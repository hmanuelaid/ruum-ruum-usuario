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

export default function ConsentimientoFotosPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="py-6">
          <Link href="/cuenta" className="inline-flex items-center gap-2 text-[#6b82a8] text-sm hover:text-[#f0f4ff] transition-colors mb-6">
            <ArrowLeft size={16} /> Volver a Cuenta
          </Link>
          <p className="text-[11px] font-bold text-[#1A7CFA] tracking-widest uppercase mb-2">📋 Documentos Legales</p>
          <h1 className="text-2xl font-black mb-2">Consentimiento de Evidencias Fotográficas</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="bg-[#0c1428] border border-[#1a2845] rounded-[14px] p-5 mb-6 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.25)] flex items-center justify-center text-xl flex-shrink-0">
            📷
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold mb-1">Consentimiento para la Toma y Uso de Evidencias Fotográficas</h2>
            <div className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</div>
          </div>
        </div>

        <Accordion num="1" title="Qué Evidencias se Generan" defaultOpen>
          <p>Como parte del proceso operativo de cada servicio, la Plataforma y/o el Conductor Certificado podrán generar:</p>
          <ul>
            <li>Fotografías del estado general del vehículo al Inicio del Servicio (exterior e interior).</li>
            <li>Fotografías del odómetro y nivel de combustible al inicio y al término del servicio.</li>
            <li>Fotografías de cualquier daño, desperfecto o condición relevante detectada antes o después del traslado.</li>
            <li>Fotografías del vehículo al momento de la entrega en el punto de destino.</li>
            <li>Capturas relacionadas con la ubicación o entorno inmediato del vehículo, cuando sea necesario para documentar el servicio.</li>
          </ul>
        </Accordion>

        <Accordion num="2" title="Finalidad del Uso de las Evidencias">
          <ul>
            <li>Documentar el estado del vehículo antes, durante y después del traslado.</li>
            <li>Servir como respaldo en caso de reclamaciones, controversias o solicitudes de reembolso.</li>
            <li>Permitir la validación y seguimiento operativo del servicio por parte del equipo de Ruum Ruum.</li>
            <li>Brindar mayor seguridad, transparencia y trazabilidad al Usuario y al Conductor Certificado.</li>
          </ul>
        </Accordion>

        <Accordion num="3–4" title="Consentimiento del Usuario y del Conductor">
          <h3>3. Consentimiento del Usuario</h3>
          <p>Al solicitar un servicio a través de la Plataforma, el Usuario acepta y consiente que:</p>
          <ul>
            <li>El vehículo sea fotografiado por el Conductor Certificado en los momentos descritos en la Sección 1.</li>
            <li>Las fotografías sean almacenadas en los sistemas de Ruum Ruum durante el tiempo necesario para cumplir las finalidades indicadas.</li>
            <li>Las fotografías puedan ser consultadas por el equipo de operaciones y soporte de Ruum Ruum para atención de reclamaciones o incidencias.</li>
          </ul>
          <h3>4. Consentimiento del Conductor Certificado</h3>
          <p>Al aceptar la prestación de servicios mediante la Plataforma, el Conductor Certificado consiente que:</p>
          <ul>
            <li>Está obligado a tomar las fotografías requeridas en cada etapa del servicio, conforme a los procedimientos establecidos.</li>
            <li>Las fotografías que tome formarán parte del expediente operativo del traslado y podrán ser utilizadas conforme a esta Política.</li>
            <li>Ruum Ruum podrá utilizar dichas evidencias para la validación de su desempeño y la resolución de reclamaciones.</li>
          </ul>
        </Accordion>

        <Accordion num="5–6" title="Tratamiento, Conservación y Confidencialidad">
          <h3>5. Tratamiento y Conservación</h3>
          <p>
            Las evidencias fotográficas se almacenan de forma segura en los servidores o sistemas designados por Ruum Ruum.
            El acceso está limitado al personal autorizado para fines de operación, soporte, validación de incidencias y
            atención de reclamaciones.
          </p>
          <p>
            Se conservarán durante el plazo necesario para atender reclamaciones, procesos de validación y obligaciones legales,
            y serán eliminadas o anonimizadas una vez concluido dicho plazo, salvo disposición legal en contrario.
          </p>
          <h3>6. Confidencialidad</h3>
          <p>
            Ruum Ruum se compromete a no divulgar, compartir ni utilizar las evidencias fotográficas para fines distintos a
            los descritos, salvo que medie requerimiento de autoridad competente o consentimiento expreso adicional del
            Usuario o del Conductor Certificado.
          </p>
        </Accordion>

        <div className="mt-5 bg-[rgba(26,124,250,0.08)] border border-[rgba(26,124,250,0.2)] rounded-[14px] p-5 flex gap-4">
          <span className="text-2xl flex-shrink-0">📷</span>
          <div>
            <p className="text-[13px] font-bold mb-1">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] text-[#6b82a8] leading-relaxed">
              El uso de la Plataforma Ruum Ruum, así como la solicitud o prestación de un servicio de traslado,
              implica la aceptación del presente Consentimiento de Evidencias Fotográficas.
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
