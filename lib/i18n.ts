// ─── lib/i18n.ts ─────────────────────────────────────────────────────────────
import { usePrefsStore } from './store'

export const translations = {
  es: {
    // Cuenta / Perfil
    cuenta: 'Mi cuenta',
    editarPerfil: 'Editar perfil',
    datosPersonales: 'Datos personales',
    datosAcceso: 'Datos de acceso',
    domicilio: 'Domicilio',
    guardarCambios: 'Guardar cambios',
    guardando: 'Guardando…',
    subirFoto: 'Subir foto',
    cambiarFoto: 'Cambiar foto',
    subiendo: 'Subiendo…',
    // Settings
    configuracion: 'Configuración',
    cuenta_label: 'Cuenta',
    perfil: 'Perfil',
    misVehiculos: 'Mis vehículos',
    metodosPago: 'Métodos de pago',
    facturacion: 'Facturación',
    preferencias: 'Preferencias',
    notificaciones: 'Notificaciones',
    idioma: 'Idioma',
    legal: 'Legal',
    terminosCondiciones: 'Términos y condiciones',
    avisoPrivacidad: 'Aviso de privacidad',
    cerrarSesion: 'Cerrar sesión',
    cerrandoSesion: 'Cerrando sesión…',
    eliminarCuenta: 'Eliminar cuenta',
    // Footer
    version: 'Versión',
    // Idiomas
    espanol: 'Español',
    ingles: 'English',
  },
  en: {
    cuenta: 'My account',
    editarPerfil: 'Edit profile',
    datosPersonales: 'Personal data',
    datosAcceso: 'Access data',
    domicilio: 'Address',
    guardarCambios: 'Save changes',
    guardando: 'Saving…',
    subirFoto: 'Upload photo',
    cambiarFoto: 'Change photo',
    subiendo: 'Uploading…',
    configuracion: 'Settings',
    cuenta_label: 'Account',
    perfil: 'Profile',
    misVehiculos: 'My vehicles',
    metodosPago: 'Payment methods',
    facturacion: 'Billing',
    preferencias: 'Preferences',
    notificaciones: 'Notifications',
    idioma: 'Language',
    legal: 'Legal',
    terminosCondiciones: 'Terms and conditions',
    avisoPrivacidad: 'Privacy notice',
    cerrarSesion: 'Sign out',
    cerrandoSesion: 'Signing out…',
    eliminarCuenta: 'Delete account',
    version: 'Version',
    espanol: 'Español',
    ingles: 'English',
  },
} as const

export type TranslationKey = keyof typeof translations.es

export function useT() {
  const language = usePrefsStore((s) => s.language)
  return (key: TranslationKey): string => translations[language][key]
}