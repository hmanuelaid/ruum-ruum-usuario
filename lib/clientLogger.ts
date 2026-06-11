const isProd = process.env.NODE_ENV === 'production'

type LogFn = (...args: unknown[]) => void

const noop: LogFn = () => {}

export const clientLogger = {
  error: isProd ? noop : ((...args: unknown[]) => console.error(...args)) as LogFn,
  warn: isProd ? noop : ((...args: unknown[]) => console.warn(...args)) as LogFn,
  info: isProd ? noop : ((...args: unknown[]) => console.info(...args)) as LogFn,
  debug: isProd ? noop : ((...args: unknown[]) => console.debug(...args)) as LogFn,
}

export default clientLogger
