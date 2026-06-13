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

export default function FirmaElectronicaPage() {
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
          <h1 className="mb-2 text-2xl font-black">Acuerdo para el Uso de Firma Electrónica</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="mb-6 flex gap-4 rounded-[14px] border border-[#1a2845] bg-[#0c1428] p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(26,124,250,0.25)] bg-[rgba(26,124,250,0.12)] text-xl">
            ✍️
          </div>
          <div>
            <h2 className="mb-1 text-[17px] font-extrabold">Acuerdo para el Uso de Firma Electrónica</h2>
            <div className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</div>
          </div>
        </div>

        <Accordion num="1" title="Definición de Firma Electrónica" defaultOpen>
          <p>
            Se entenderá por &quot;Firma Electrónica&quot; cualquier mecanismo digital empleado dentro de la
            Plataforma mediante el cual una persona manifiesta su consentimiento, incluyendo:
          </p>
          <ul>
            <li>La selección de botones &quot;Aceptar&quot;, &quot;Confirmar&quot; o &quot;Estoy de acuerdo&quot; dentro de la app o panel.</li>
            <li>El registro de un código de verificación enviado para confirmar la identidad.</li>
            <li>El uso de credenciales de acceso, biometría del dispositivo u otros mecanismos de autenticación.</li>
            <li>La marca digital de inicio y término de un servicio realizada por el Conductor Certificado.</li>
          </ul>
        </Accordion>

        <Accordion num="2" title="Aceptación del Uso de Firma Electrónica">
          <p>Al crear una cuenta y utilizar la Plataforma, el Usuario y el Conductor Certificado aceptan expresamente que:</p>
          <ul>
            <li>Las acciones realizadas mediante su cuenta tienen el mismo valor que una manifestación por escrito y firmada de forma autógrafa.</li>
            <li>La aceptación de términos, condiciones, políticas, cotizaciones o documentos presentados a través de la Plataforma constituye consentimiento válido y vinculante.</li>
            <li>Es su responsabilidad mantener la confidencialidad de sus credenciales de acceso.</li>
          </ul>
        </Accordion>

        <Accordion num="3" title="Documentos Sujetos a Firma Electrónica">
          <ul>
            <li>Los Términos y Condiciones de Uso de la Plataforma.</li>
            <li>La Política de Cancelaciones y Reembolsos.</li>
            <li>El Consentimiento de Evidencias Fotográficas.</li>
            <li>El Consentimiento de Geolocalización.</li>
            <li>Cualquier acuerdo de prestación de servicios entre Ruum Ruum y el Conductor Certificado.</li>
            <li>Cotizaciones, confirmaciones de servicio y registros de inicio y término del traslado.</li>
          </ul>
        </Accordion>

        <Accordion num="4–7" title="Validez Jurídica, Integridad, Revocación y Aceptación">
          <h3>4. Validez y Efectos Jurídicos</h3>
          <p>
            Las partes reconocen que la Firma Electrónica empleada dentro de la Plataforma constituye
            un mecanismo válido para expresar su voluntad, con plenos efectos jurídicos entre las partes.
          </p>
          <p>
            Los registros electrónicos, incluyendo fecha, hora y, en su caso, dirección IP o identificador
            del dispositivo, podrán ser utilizados como evidencia de la manifestación de voluntad.
          </p>
          <h3>5. Integridad y Conservación de Registros</h3>
          <p>
            Ruum Ruum conservará los registros electrónicos durante el tiempo necesario para cumplir
            fines operativos, de soporte y obligaciones legales aplicables.
          </p>
          <h3>6. Revocación del Consentimiento</h3>
          <p>
            El Usuario o Conductor Certificado puede solicitar la revocación a través de los canales de
            soporte. La revocación podrá implicar la imposibilidad de continuar utilizando la Plataforma.
          </p>
          <h3>7. Aceptación</h3>
          <p>
            La creación de una cuenta y el uso de la Plataforma implica la aceptación plena del presente
            Acuerdo de Firma Electrónica.
          </p>
        </Accordion>

        <div className="mt-5 flex gap-4 rounded-[14px] border border-[rgba(26,124,250,0.2)] bg-[rgba(26,124,250,0.08)] p-5">
          <span className="shrink-0 text-2xl">✍️</span>
          <div>
            <p className="mb-1 text-[13px] font-bold">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] leading-relaxed text-[#6b82a8]">
              La creación de cuenta y el uso de Ruum Ruum implican la aceptación plena del presente Acuerdo.
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
