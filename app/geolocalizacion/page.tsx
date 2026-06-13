"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

function Accordion({
  num,
  title,
  children,
  defaultOpen = false,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3 overflow-hidden rounded-[14px] border border-[#1a2845]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-[#0c1428] px-5 py-4 transition-colors hover:bg-[#111e38]"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-[rgba(26,124,250,0.2)] bg-[rgba(26,124,250,0.12)] px-2 py-0.5 text-[11px] font-bold text-[#1A7CFA]">
            {num}
          </span>
          <span className="text-left text-[14px] font-bold">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#6b82a8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="prose-ruum border-t border-[#1a2845] bg-[#0c1428] px-5 pb-5 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function GeolocalizacionPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="mx-auto max-w-2xl px-4 pb-20">
        <div className="py-6">
          <Link
            href="/legal"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#6b82a8] transition-colors hover:text-[#f0f4ff]"
          >
            <ArrowLeft size={16} /> Volver al Centro Legal
          </Link>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#1A7CFA]">
            📋 Documentos Legales
          </p>
          <h1 className="mb-2 text-2xl font-black">Consentimiento de Geolocalización</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="mb-6 flex gap-4 rounded-[14px] border border-[#1a2845] bg-[#0c1428] p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(26,124,250,0.25)] bg-[rgba(26,124,250,0.12)] text-xl">
            📍
          </div>
          <div>
            <h2 className="mb-1 text-[17px] font-extrabold">Consentimiento para el Uso de Datos de Geolocalización</h2>
            <div className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</div>
          </div>
        </div>

        <Accordion num="1" title="Datos de Ubicación que se Recopilan" defaultOpen>
          <ul>
            <li>Ubicación del Usuario al momento de generar una Solicitud de Traslado para determinar el punto de origen.</li>
            <li>Ubicación en tiempo real del Conductor Certificado durante el trayecto y durante el traslado.</li>
            <li>Ruta seguida durante el servicio, incluyendo puntos intermedios relevantes.</li>
            <li>Ubicación del vehículo al momento de la entrega en el punto de destino.</li>
          </ul>
        </Accordion>

        <Accordion num="2" title="Finalidad del Tratamiento">
          <ul>
            <li>Asignar al Conductor Certificado disponible más adecuado para atender la solicitud.</li>
            <li>Permitir al Usuario monitorear en tiempo real el avance del traslado.</li>
            <li>Calcular tiempos estimados de llegada, distancias recorridas y tarifas aplicables.</li>
            <li>Documentar la ruta efectivamente seguida como respaldo en caso de reclamaciones.</li>
            <li>Mejorar la operación, seguridad y eficiencia general de la Plataforma.</li>
          </ul>
        </Accordion>

        <Accordion num="3–4" title="Consentimiento del Usuario y del Conductor">
          <h3>3. Consentimiento del Usuario</h3>
          <p>
            El Usuario consiente que la aplicación acceda a los servicios de ubicación del dispositivo
            para determinar el punto de origen, utilizarla en la asignación del Conductor y el seguimiento del servicio.
          </p>
          <h3>4. Consentimiento del Conductor Certificado</h3>
          <p>
            El Conductor Certificado consiente que su ubicación en tiempo real sea compartida con la
            Plataforma y, durante un servicio activo, con el Usuario correspondiente. Ruum Ruum podrá
            utilizar los datos de ubicación de manera agregada para fines de análisis operativo.
          </p>
        </Accordion>

        <Accordion num="5–7" title="Control, Conservación y Confidencialidad">
          <h3>5. Control sobre los Servicios de Ubicación</h3>
          <p>
            El Usuario y el Conductor pueden gestionar los permisos de ubicación desde la configuración
            de su dispositivo móvil. La desactivación puede impedir parcial o totalmente el uso de la Plataforma.
          </p>
          <h3>6. Conservación y Protección</h3>
          <p>
            Los datos de geolocalización se almacenan de forma segura y se conservan durante el tiempo
            necesario para las finalidades descritas y el cumplimiento de obligaciones legales.
          </p>
          <h3>7. Confidencialidad y Compartición con Terceros</h3>
          <p>
            Los datos de geolocalización no serán compartidos con terceros ajenos a la operación de la
            Plataforma, salvo que sea necesario para prestar el servicio, exista requerimiento de autoridad
            competente o se cuente con consentimiento expreso adicional.
          </p>
        </Accordion>

        <div className="mt-5 flex gap-4 rounded-[14px] border border-[rgba(26,124,250,0.2)] bg-[rgba(26,124,250,0.08)] p-5">
          <span className="shrink-0 text-2xl">📍</span>
          <div>
            <p className="mb-1 text-[13px] font-bold">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] leading-relaxed text-[#6b82a8]">
              El uso de la aplicación y la activación de los servicios de ubicación requeridos para operar la Plataforma implica la aceptación del presente Consentimiento.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-[#1a2845] pt-4">
          <span className="rounded-full border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-3 py-1 text-[11px] font-semibold text-[#22c55e]">
            Vigente
          </span>
          <span className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</span>
        </div>
      </div>
    </div>
  );
}
