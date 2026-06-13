import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import styles from "./legal.module.css";

const LEGAL_DOCUMENT_URL = "/legal/RuumRuum_Documentos_Legales_Base.docx";

const legalDocuments = [
  {
    icon: "🍪",
    title: "Política de Cookies y Tecnologías de Rastreo",
    href: "/cookies",
    description: "Uso de cookies, analítica, rastreo y preferencias dentro de la Plataforma.",
  },
  {
    icon: "📜",
    title: "Términos y Condiciones de Uso",
    href: "/terminos",
    description: "Reglas generales para usuarios, conductores certificados y uso del servicio.",
  },
  {
    icon: "🔒",
    title: "Aviso de Privacidad Integral",
    href: "/privacidad",
    description: "Tratamiento de datos personales, finalidades, transferencias y derechos ARCO.",
  },
  {
    icon: "↩️",
    title: "Política de Cancelaciones y Reembolsos",
    href: "/cancelaciones",
    description: "Ventanas de cancelación, cargos aplicables, reembolsos y reclamaciones.",
  },
  {
    icon: "🚨",
    title: "Política de Incidentes y Siniestros",
    href: "/incidentes",
    description: "Procedimientos para daños, robos, retrasos, accidentes y reportes.",
  },
  {
    icon: "✍️",
    title: "Acuerdo para el Uso de Firma Electrónica",
    href: "/firma-electronica",
    description: "Consentimiento, validez jurídica e integridad de registros electrónicos.",
  },
  {
    icon: "📷",
    title: "Consentimiento de Evidencias Fotográficas",
    href: "/consentimiento-fotos",
    description: "Captura, uso, conservación y confidencialidad de evidencias del vehículo.",
  },
  {
    icon: "📍",
    title: "Consentimiento de Geolocalización",
    href: "/geolocalizacion",
    description: "Datos de ubicación recopilados para asignación, seguimiento y seguridad.",
  },
];

export default function LegalPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.logo}>
          Ruum<span>Ruum</span>
        </div>
        <div className={styles.badge}>
          Centro Legal · v1.0
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>
            📋 Documentos Legales
          </p>
          <h1>
            Centro Legal
            <br />
            Ruum Ruum
          </h1>
          <p className={styles.heroText}>
            Aquí encontrarás todos los documentos legales que rigen el uso de la Plataforma.
            Versión 1.0 — Junio 2026.
          </p>
        </section>

        <section className={styles.documentGrid}>
          {legalDocuments.map((document) => (
            <Link
              key={document.href}
              href={document.href}
              className={styles.documentCard}
            >
              <span className={styles.documentIcon}>
                {document.icon}
              </span>
              <span className={styles.documentBody}>
                <span className={styles.documentTitle}>
                  {document.title}
                </span>
                <span className={styles.documentMeta}>
                  Versión 1.0 — Junio 2026
                </span>
                <span className={styles.documentDescription}>
                  {document.description}
                </span>
              </span>
              <ArrowRight
                size={18}
                className={styles.documentArrow}
                aria-hidden="true"
              />
            </Link>
          ))}
        </section>

        <section className={styles.downloadCard}>
          <div className={styles.downloadHeader}>
            <span className={styles.downloadIcon}>📄</span>
            <div>
              <h2>Documento completo descargable</h2>
              <p>
                También puedes descargar el paquete legal base en formato DOCX.
              </p>
            </div>
          </div>
          <a
            className={styles.downloadButton}
            href={LEGAL_DOCUMENT_URL}
            download
          >
            <Download size={16} />
            Descargar documentos legales
          </a>
        </section>

        <div className={styles.versionRow}>
          <span className={styles.versionPill}>
            Vigente
          </span>
          <span className={styles.versionDate}>Versión 1.0 — Junio 2026</span>
        </div>
      </div>
    </main>
  );
}
