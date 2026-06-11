# Plan de Acción - Auditoría de Seguridad

**Generado:** 2026-06-11

---

## 🚨 Crítico (Hacer Hoy)

### 1. Remover Credencial Expuesta
**Tiempo:** 30 min  
**Impacto:** Prevenir abuso de API

```bash
# 1. Regenerar ORS_API_KEY en https://openrouteservice.org/
# 2. Actualizar .env.local con nueva clave
# 3. Remover valor de .env.example
# 4. Hacer commit y push
```

**Archivos a Cambiar:**
- [.env.example](.env.example) → Línea 9 vacía
- `.env.local` → Actualizar con nueva clave

---

## ⚠️ Alto (Semana 1)

### 2. Agregar Security Headers
**Tiempo:** 1 hora  
**Impacto:** Proteger contra clickjacking, XSS, MIME sniffing

**Archivo:** [next.config.ts](next.config.ts)

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
```

---

### 3. Implementar Email Verification
**Tiempo:** 2 horas  
**Impacto:** Prevenir registros falsos, mejorar deliverability

**Archivo:** [app/onboarding/registro/page.tsx](app/onboarding/registro/page.tsx) (revisar)

```typescript
// En el formulario de registro
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  }
});

if (!error) {
  showMessage('Verifica tu email antes de continuar');
}
```

---

### 4. Hacer Redis Obligatorio en Producción
**Tiempo:** 30 min  
**Impacto:** Rate limiting distribuido, prevenir bypass

**Archivo:** [lib/rateLimit.ts](lib/rateLimit.ts#L51-L55)

```typescript
function getRedisLimiter(config: RateLimitConfig) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  
  // Agregar:
  if (process.env.NODE_ENV === 'production' && (!url || !token)) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN son requeridos en producción'
    );
  }
  
  if (!url || !token) return null
  // ... resto del código
}
```

---

### 5. Redactar Logs Sensibles
**Tiempo:** 1 hora  
**Impacto:** Evitar exposición de datos en logs

**Archivo:** [lib/apiAuth.ts](lib/apiAuth.ts#L40-L41)

```typescript
// Cambiar:
console.error('Error in getAuthenticatedProfile:', error)

// A:
if (process.env.NODE_ENV === 'development') {
  console.error('Error in getAuthenticatedProfile:', error)
} else {
  console.error('Error in getAuthenticatedProfile: Database error')
}
```

---

## 📋 Medio (Semana 2-3)

### 6. Implementar Pre-Commit Hook para Secrets
**Tiempo:** 1 hora  
**Impacto:** Prevenir futuros leaks de credenciales

```bash
npm install --save-dev husky lint-staged

npx husky install
npx husky add .husky/pre-commit 'npm run pre-commit:check'
```

**Archivo a crear:** [.husky/pre-commit](.husky/pre-commit)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Buscar patterns de secretos comunes
if grep -r "PRIVATE_KEY=\|SECRET=\|API_KEY=.*[a-zA-Z0-9]\{20,\}" . --exclude-dir=.git --exclude=package-lock.json; then
  echo "❌ Posible secreto encontrado. No hacer commit."
  exit 1
fi

npm run lint
```

---

### 7. Agregar HTTPS Enforcement
**Tiempo:** 30 min  
**Impacto:** Garantizar comunicación encriptada

**Archivo:** [next.config.ts](next.config.ts)

```typescript
async redirects() {
  return process.env.NODE_ENV === 'production'
    ? [
        {
          source: '/:path*',
          has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
          destination: 'https://:host/:path*',
          permanent: true,
        }
      ]
    : []
}
```

---

### 8. Implementar Logging Estructurado
**Tiempo:** 2 horas  
**Impacto:** Auditoría, debugging, seguridad

```bash
npm install pino pino-pretty
```

**Archivo a crear:** [lib/logger.ts](lib/logger.ts)

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
});

export function redactSensitive(obj: any) {
  const sensitive = ['password', 'token', 'key', 'secret', 'apiKey'];
  const copy = { ...obj };
  sensitive.forEach(field => {
    if (copy[field]) copy[field] = '[REDACTED]';
  });
  return copy;
}
```

---

### 9. Agregar Timeouts en Queries DB
**Tiempo:** 1 hora  
**Impacto:** Prevenir request timeouts

**Archivo:** [lib/apiAuth.ts](lib/apiAuth.ts)

```typescript
function withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    )
  ]);
}

// Uso:
const { data, error } = await withTimeout(
  supabase
    .from('app_users')
    .select('id, name, email, phone, country, state, address')
    .eq('auth_id', user.id)
    .maybeSingle()
);
```

---

## 🔧 Bajo (Mes 2)

### 10. Implementar Audit Trail
**Tiempo:** 4 horas  
**Impacto:** Rastrear acciones críticas

**Nueva tabla SQL:**
```sql
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action text not null,
  resource_type text not null,
  resource_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  status text check (status in ('success', 'failure')),
  created_at timestamptz not null default now()
);

create index audit_log_user_created_idx on public.audit_log(user_id, created_at desc);
```

---

### 11. Agregar 2FA Opcional
**Tiempo:** 4 horas  
**Impacto:** Seguridad adicional para usuarios sensibles

- Implementar TOTP con `speakeasy` o `qrcode`
- Guardar backup codes encriptados

---

### 12. Penetration Testing Simulado
**Tiempo:** 8 horas  
**Impacto:** Identificar vulnerabilidades sin pruebas reales

Revisar:
- OWASP Top 10 2021 contra endpoints
- Inyecciones SQL (aunque Supabase protege)
- XSS payloads en inputs
- CSRF tokens
- Ruta transversal en uploads

---

## 📊 Matriz de Priorización

| ID | Tarea | Severidad | Esfuerzo | ROI | Priority |
|----|-------|-----------|----------|-----|----------|
| 1 | Remover ORS_API_KEY | 🔴 CRÍTICO | 30min | MÁXIMO | P0 |
| 2 | Security Headers | 🟠 ALTO | 1h | ALTO | P1 |
| 3 | Email Verification | 🟠 ALTO | 2h | ALTO | P1 |
| 4 | Redis Obligatorio | 🟠 ALTO | 30min | ALTO | P1 |
| 5 | Redactar Logs | 🟠 ALTO | 1h | MEDIO | P1 |
| 6 | Pre-Commit Hooks | 🟡 MEDIO | 1h | MÁXIMO | P2 |
| 7 | HTTPS Enforce | 🟡 MEDIO | 30min | ALTO | P2 |
| 8 | Logger Estructurado | 🟡 MEDIO | 2h | MEDIO | P2 |
| 9 | DB Timeouts | 🟡 MEDIO | 1h | MEDIO | P2 |
| 10 | Audit Trail | 🟢 BAJO | 4h | BAJO | P3 |
| 11 | 2FA | 🟢 BAJO | 4h | BAJO | P3 |
| 12 | Pentesting | 🟢 BAJO | 8h | BAJO | P3 |

---

## 📅 Timeline Recomendado

### Semana 1 (Crítico)
```
Lunes:  Task 1 - Remover credencial
        Task 2 - Security Headers
Martes: Task 3 - Email Verification
Miercoles: Task 4 - Redis Obligatorio
Jueves: Task 5 - Redactar Logs
Viernes: Testing y Deployment
```

### Semana 2-3 (Alto)
```
Task 6 - Pre-Commit Hooks
Task 7 - HTTPS Enforcement
Task 8 - Logger Estructurado
Task 9 - DB Timeouts
Testing e integración
```

### Mes 2 (Bajo)
```
Task 10 - Audit Trail
Task 11 - 2FA
Task 12 - Pentesting
```

---

## ✅ Checklist de Validación

Después de cada tarea:

- [ ] Code review completado
- [ ] Tests actualizados
- [ ] Documentación actualizada
- [ ] Commit descriptivo con referencias
- [ ] PR creado y aprobado

---

## 🧪 Tests a Ejecutar

```bash
# Después de cambios críticos:
npm run lint
npm test
npm run build
npm run audit:security

# Nuevos tests recomendados:
npm run test:security  # (agregar)
npm run test:e2e       # (agregar)
```

---

## 🔗 Referencias

- [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [API Security - SANS](https://www.sans.org/white-papers/)

---

**Generado por:** Security Audit Tool  
**Última actualización:** 2026-06-11  
**Próxima revisión:** 2026-09-11

