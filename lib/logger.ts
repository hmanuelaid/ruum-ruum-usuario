import pino from 'pino'

const transport = process.env.NODE_ENV === 'development'
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
  : undefined

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
  redact: {
    paths: ['req.headers.authorization', 'res.headers.authorization', 'token', 'password', 'secret', 'apiKey'],
    remove: true,
  },
})

export function redactSensitive(obj: Record<string, unknown>) {
  const copy: Record<string, unknown> = { ...obj }
  const sensitive = ['password', 'token', 'key', 'secret', 'apiKey', 'access_token']
  for (const k of sensitive) {
    if (Object.prototype.hasOwnProperty.call(copy, k)) copy[k] = '[REDACTED]'
  }
  return copy
}

export default logger
