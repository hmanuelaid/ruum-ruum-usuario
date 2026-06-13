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

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-[#f0f4ff]">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="py-6">
          <Link href="/cuenta" className="inline-flex items-center gap-2 text-[#6b82a8] text-sm hover:text-[#f0f4ff] transition-colors mb-6">
            <ArrowLeft size={16} /> Volver a Cuenta
          </Link>
          <p className="text-[11px] font-bold text-[#1A7CFA] tracking-widest uppercase mb-2">📋 Documentos Legales</p>
          <h1 className="text-2xl font-black mb-2">Política de Cookies y Tecnologías de Rastreo</h1>
          <p className="text-sm text-[#6b82a8]">Versión 1.0 — Junio 2026</p>
        </div>

        <div className="bg-[#0c1428] border border-[#1a2845] rounded-[14px] p-5 mb-6 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(26,124,250,0.12)] border border-[rgba(26,124,250,0.25)] flex items-center justify-center text-xl flex-shrink-0">
            🍪
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold mb-1">Política de Cookies y Tecnologías de Rastreo</h2>
            <div className="text-[12px] text-[#6b82a8]">Versión 1.0 — Junio 2026</div>
          </div>
        </div>

        <Accordion num="1" title="¿Qué son las Cookies?" defaultOpen>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del Usuario cuando accede a un
            sitio web o aplicación. Permiten que la Plataforma reconozca el dispositivo, recuerde preferencias y recopile
            información sobre cómo se utiliza el servicio.
          </p>
          <p>Ruum Ruum también puede utilizar tecnologías similares como:</p>
          <ul>
            <li><strong>Balizas web (web beacons):</strong> imágenes de un píxel que detectan si un correo fue abierto o si se accedió a una página.</li>
            <li><strong>Identificadores de dispositivo:</strong> identificadores únicos asociados al dispositivo móvil del Usuario.</li>
            <li><strong>Almacenamiento local:</strong> localStorage y sessionStorage del navegador para datos locales.</li>
            <li><strong>SDKs de análisis y publicidad:</strong> integrados en la app móvil para recopilar datos de uso.</li>
          </ul>
        </Accordion>

        <Accordion num="2" title="Tipos de Cookies que Utilizamos">
          <h3>2.1 Cookies Estrictamente Necesarias</h3>
          <p>Indispensables para el funcionamiento de la Plataforma. No requieren consentimiento.</p>
          <ul>
            <li>Gestión de sesión y autenticación de la Cuenta.</li>
            <li>Mantenimiento de preferencias de seguridad.</li>
            <li>Funcionamiento del proceso de solicitud de traslado.</li>
            <li>Prevención de fraudes y verificación de identidad.</li>
          </ul>
          <h3>2.2 Cookies de Rendimiento y Analítica</h3>
          <p>Recopilan información sobre el uso de la Plataforma para mejorar su funcionamiento. Los datos son agregados y anónimos.</p>
          <ul>
            <li>Páginas más visitadas y flujos de navegación dentro de la app.</li>
            <li>Tiempo de carga y errores técnicos.</li>
            <li>Patrones de uso y métricas de rendimiento.</li>
          </ul>
          <p><strong>Herramientas:</strong> Google Analytics, Firebase Analytics, Mixpanel u otras equivalentes.</p>
          <h3>2.3 Cookies de Funcionalidad</h3>
          <ul>
            <li>Idioma y región seleccionados.</li>
            <li>Preferencias de notificaciones.</li>
            <li>Historial de búsquedas y configuraciones de la aplicación.</li>
            <li>Dirección de origen frecuente u otros datos de preferencia.</li>
          </ul>
          <h3>2.4 Cookies de Marketing y Publicidad</h3>
          <p>Requieren consentimiento expreso del Usuario.</p>
          <ul>
            <li>Seguimiento de conversiones de campañas digitales.</li>
            <li>Personalización de anuncios basada en el comportamiento en la Plataforma.</li>
            <li>Compartición de datos con redes publicitarias de terceros (con consentimiento).</li>
            <li>Análisis de audiencias para campañas en redes sociales.</li>
          </ul>
          <h3>2.5 Cookies de Geolocalización</h3>
          <ul>
            <li>Determinar el punto de origen y destino del traslado.</li>
            <li>Monitorear la ruta del Conductor Certificado en tiempo real.</li>
            <li>Calcular tiempos estimados y tarifas del servicio.</li>
          </ul>
        </Accordion>

        <Accordion num="3" title="Cookies de Terceros">
          <p>Algunos terceros pueden instalar cookies a través de nuestra Plataforma. Entre ellos:</p>
          <ul>
            <li><strong>Google LLC</strong> — Google Maps, Firebase, Google Analytics.</li>
            <li><strong>Meta Platforms, Inc.</strong> — píxel de Facebook para publicidad.</li>
            <li><strong>Proveedores de pagos</strong> — cookies de seguridad antifraude.</li>
            <li><strong>Plataformas de atención al cliente</strong> y chatbots.</li>
          </ul>
          <p>Ruum Ruum no controla las cookies de terceros. Consulta sus respectivas políticas de privacidad para más información.</p>
        </Accordion>

        <Accordion num="4" title="Duración de las Cookies">
          <h3>4.1 Cookies de Sesión</h3>
          <p>Temporales, se eliminan al cerrar la aplicación o el navegador. Se usan principalmente para mantener la sesión activa.</p>
          <h3>4.2 Cookies Persistentes</h3>
          <ul>
            <li><strong>Funcionalidad y preferencias:</strong> hasta 12 meses.</li>
            <li><strong>Analítica:</strong> hasta 24 meses.</li>
            <li><strong>Marketing:</strong> hasta 12 meses.</li>
          </ul>
        </Accordion>

        <Accordion num="5" title="Gestión y Control de Cookies">
          <h3>5.1 En la Aplicación Móvil</h3>
          <p>Desde la sección de Privacidad o Configuración de Datos en la app, el Usuario puede:</p>
          <ul>
            <li>Otorgar o revocar el permiso de geolocalización.</li>
            <li>Activar o desactivar notificaciones.</li>
            <li>Gestionar las preferencias de cookies de marketing y analítica.</li>
          </ul>
          <h3>5.2 En el Navegador</h3>
          <p>La mayoría de los navegadores permiten bloquear cookies, eliminar las almacenadas o recibir notificaciones antes de instalarlas. Deshabilitar ciertas cookies puede afectar el funcionamiento de la Plataforma.</p>
          <h3>5.3 Herramientas de Opt-out de Terceros</h3>
          <ul>
            <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#1A7CFA] underline">tools.google.com/dlpage/gaoptout</a></li>
            <li><strong>Meta (Facebook):</strong> Configuración de anuncios en la plataforma de Meta.</li>
            <li><strong>NAI:</strong> <a href="http://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-[#1A7CFA] underline">optout.networkadvertising.org</a></li>
          </ul>
        </Accordion>

        <Accordion num="6–10" title="Consentimiento, Datos, Seguridad y Contacto">
          <h3>6. Consentimiento</h3>
          <p>Al usar la Plataforma por primera vez se mostrará un aviso de cookies para aceptar, rechazar o personalizar el uso de cookies no esenciales. El consentimiento puede retirarse en cualquier momento desde configuración de privacidad.</p>
          <h3>7. Datos Recabados a través de Cookies</h3>
          <ul>
            <li>Dirección IP y datos de red.</li>
            <li>Tipo de dispositivo, sistema operativo y versión del navegador o aplicación.</li>
            <li>Páginas o pantallas visitadas y tiempo de permanencia.</li>
            <li>Acciones realizadas dentro de la Plataforma (clics, solicitudes, búsquedas).</li>
            <li>Fecha y hora de acceso y fuente de tráfico.</li>
          </ul>
          <h3>8. Seguridad</h3>
          <p>Ruum Ruum implementa medidas de seguridad para proteger la información recopilada a través de cookies frente a accesos no autorizados o divulgaciones indebidas.</p>
          <h3>9. Modificaciones</h3>
          <p>Ruum Ruum podrá actualizar esta Política para reflejar cambios en las tecnologías, legislación o servicios. Las modificaciones relevantes serán notificadas a través de la Plataforma.</p>
          <h3>10. Contacto</h3>
          <p>Para dudas sobre cookies y tecnologías de rastreo, contacta a Ruum Ruum a través de los canales habilitados en la aplicación móvil o el sitio web oficial.</p>
        </Accordion>

        <div className="mt-5 bg-[rgba(26,124,250,0.08)] border border-[rgba(26,124,250,0.2)] rounded-[14px] p-5 flex gap-4">
          <span className="text-2xl flex-shrink-0">🍪</span>
          <div>
            <p className="text-[13px] font-bold mb-1">Aceptación mediante uso de la Plataforma</p>
            <p className="text-[12px] text-[#6b82a8] leading-relaxed">
              El uso de la Plataforma implica la aceptación de la presente Política de Cookies.
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
