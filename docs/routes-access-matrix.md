# Matriz de acceso de rutas

Esta matriz documenta la intención de acceso de las rutas principales de Ruum Ruum Usuario.

## Públicas

| Ruta | Propósito | Responsable |
| --- | --- | --- |
| `/` | Entrada pública / redirección inicial | Producto |
| `/login` | Inicio de sesión y recuperación | Auth |
| `/onboarding` | Presentación inicial | Producto |
| `/onboarding/registro` | Registro de usuario | Auth |
| `/onboarding/documentos` | Carga inicial de documentos posterior a registro | Onboarding |
| `/terminos` | Términos y condiciones | Legal |
| `/privacidad` | Aviso de privacidad | Legal |
| `/legal` | Descarga de documentos legales base | Legal |
| `/faq` | Preguntas frecuentes | Soporte |
| `/reset-password` | Restablecimiento de contraseña | Auth |

## Autenticadas

| Ruta | Propósito | Responsable |
| --- | --- | --- |
| `/inicio` | Dashboard del usuario | Producto |
| `/solicitar` | Wizard de solicitud de traslado | Operaciones |
| `/solicitar/confirmacion` | Confirmación de solicitud | Operaciones |
| `/viajes` | Historial y estado de viajes | Operaciones |
| `/evidencia` | Evidencia del traslado | Operaciones |
| `/notificaciones` | Notificaciones del usuario | Producto |
| `/soporte` | Formulario y canales de soporte | Soporte |
| `/cuenta` | Configuración de cuenta | Cuenta |
| `/cuenta/perfil` | Perfil y foto de usuario | Cuenta |
| `/cuenta/vehiculos` | Vehículos guardados | Cuenta |
| `/cuenta/pagos` | Métodos de pago | Pagos |
| `/cuenta/facturacion` | Datos fiscales y constancia | Facturación |

## APIs Autenticadas

| Ruta | Propósito | Responsable |
| --- | --- | --- |
| `/api/profile` | Perfil de usuario | Cuenta |
| `/api/profile/avatar` | Foto de perfil privada | Cuenta |
| `/api/vehicles` | Vehículos del usuario | Cuenta |
| `/api/documents` | Documentos privados | Onboarding |
| `/api/documents/upload` | Carga de documentos privados | Onboarding |
| `/api/documents/signed-url` | URLs firmadas para documentos | Onboarding |
| `/api/billing` | Datos fiscales | Facturación |
| `/api/billing/constancia` | Constancia fiscal privada | Facturación |
| `/api/notifications` | Notificaciones | Producto |
| `/api/support` | Solicitudes de soporte | Soporte |
| `/api/trips/request` | Creación de solicitudes de viaje | Operaciones |
| `/api/trips/quote` | Cotización canónica de traslado | Operaciones |
| `/api/quote` | Compatibilidad: reexporta `/api/trips/quote` | Operaciones |

## Eliminadas o no productivas

| Ruta | Estado | Motivo |
| --- | --- | --- |
| `/api/debug` | Eliminada | No debe exponer datos de sesión en producción. |
