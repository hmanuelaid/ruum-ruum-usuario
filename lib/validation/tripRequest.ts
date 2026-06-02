import type {
  Contact,
  Location,
  ServiceType,
  TransmissionType,
  VehicleType,
} from '@/lib/types'

export type FieldErrors = Record<string, string>

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors }

export type ValidatedVehicleInput = {
  id?: string
  alias?: string
  brand: string
  model: string
  year: number
  color?: string
  plates: string
  vin?: string
  type: VehicleType
  transmission: TransmissionType
  condition?: string
}

export type ValidatedRouteInput = {
  origin: Location
  destination: Location
  originContact: Contact
  destinationContact: Contact
  specialInstructions?: string
}

export type ValidatedTripRequestPayload = ValidatedRouteInput & {
  serviceType: ServiceType
  vehicle: ValidatedVehicleInput
  asap: boolean
  scheduledAt?: string
}

const SERVICE_TYPES = [
  'personal',
  'empresarial',
  'agencia',
  'lote',
  'flotilla',
  'entrega_cliente',
  'recuperacion',
  'especial',
] as const

const VEHICLE_TYPES = ['sedan', 'suv', 'pickup', 'van', 'moto', 'otro'] as const
const TRANSMISSION_TYPES = ['automatica', 'manual'] as const

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLATES_RE = /^[A-Z0-9]{5,8}$/
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validationOk<T>(data: T): ValidationResult<T> {
  return { ok: true, data }
}

function validationError<T>(errors: FieldErrors): ValidationResult<T> {
  return { ok: false, errors }
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

function requiredText(
  value: unknown,
  minLength: number,
  maxLength: number,
): string | null {
  const text = cleanText(value)
  if (text.length < minLength || text.length > maxLength) return null
  return text
}

function optionalText(value: unknown, maxLength: number): string | undefined | null {
  const text = cleanText(value)
  if (!text) return undefined
  if (text.length > maxLength) return null
  return text
}

export function normalizePhone(value: unknown): string | null {
  const raw = cleanText(value)
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if ((digits.startsWith('044') || digits.startsWith('045')) && digits.length === 13) {
    digits = `52${digits.slice(3)}`
  }
  if (digits.startsWith('521') && digits.length === 13) {
    digits = `52${digits.slice(3)}`
  }
  if (digits.length === 10) {
    digits = `52${digits}`
  }

  return /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : null
}

export function normalizePlates(value: unknown): string | null {
  const normalized = cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  return PLATES_RE.test(normalized) ? normalized : null
}

export function normalizeVin(value: unknown): string | undefined | null {
  const raw = cleanText(value)
  if (!raw) return undefined
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return VIN_RE.test(normalized) ? normalized : null
}

export function normalizeVehicleYear(value: unknown): number | null {
  const raw = typeof value === 'number' ? String(value) : cleanText(value)
  if (!/^\d{4}$/.test(raw)) return null

  const year = Number(raw)
  const maxYear = new Date().getFullYear() + 1
  return year >= 1900 && year <= maxYear ? year : null
}

function normalizeAddress(value: unknown): string | null {
  const text = requiredText(value, 10, 240)
  if (!text || !/[\p{L}\d]/u.test(text)) return null
  return text
}

function normalizeContactName(value: unknown): string | null {
  const text = requiredText(value, 2, 80)
  if (!text || !/[\p{L}]/u.test(text)) return null
  return text
}

function isAllowed<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value)
}

function assignNestedErrors(prefix: string, errors: FieldErrors, target: FieldErrors) {
  for (const [field, message] of Object.entries(errors)) {
    target[`${prefix}.${field}`] = message
  }
}

export function firstValidationError(errors: FieldErrors): string {
  return Object.values(errors)[0] ?? 'Revisa los datos capturados.'
}

export function validateVehicleInput(input: unknown): ValidationResult<ValidatedVehicleInput> {
  const vehicle = isRecord(input) ? input : {}
  const errors: FieldErrors = {}

  const id = optionalText(vehicle.id, 80)
  if (id === null || (id && !UUID_RE.test(id))) {
    errors.id = 'Selecciona un vehiculo guardado valido.'
  }

  const alias = optionalText(vehicle.alias, 80)
  if (alias === null) errors.alias = 'El alias del vehiculo es demasiado largo.'

  const brand = requiredText(vehicle.brand, 2, 40)
  if (!brand) errors.brand = 'Ingresa una marca valida.'

  const model = requiredText(vehicle.model, 1, 60)
  if (!model) errors.model = 'Ingresa un modelo valido.'

  const year = normalizeVehicleYear(vehicle.year)
  if (!year) errors.year = 'Ingresa un ano valido del vehiculo.'

  const color = optionalText(vehicle.color, 40)
  if (color === null) errors.color = 'El color es demasiado largo.'

  const plates = normalizePlates(vehicle.plates)
  if (!plates) errors.plates = 'Ingresa placas validas, de 5 a 8 caracteres.'

  const vin = normalizeVin(vehicle.vin)
  if (vin === null) errors.vin = 'El VIN debe tener 17 caracteres validos.'

  const type = vehicle.type
  if (!isAllowed(type, VEHICLE_TYPES)) errors.type = 'Selecciona un tipo de vehiculo valido.'

  const transmission = vehicle.transmission
  if (!isAllowed(transmission, TRANSMISSION_TYPES)) {
    errors.transmission = 'Selecciona una transmision valida.'
  }

  const condition = optionalText(vehicle.condition, 80)
  if (condition === null) errors.condition = 'El estado declarado es demasiado largo.'

  if (Object.keys(errors).length > 0) {
    return validationError(errors)
  }

  const data: ValidatedVehicleInput = {
    brand: brand!,
    model: model!,
    year: year!,
    plates: plates!,
    type: type as VehicleType,
    transmission: transmission as TransmissionType,
  }

  if (id) data.id = id
  if (alias) data.alias = alias
  if (color) data.color = color
  if (vin) data.vin = vin
  if (condition) data.condition = condition

  return validationOk(data)
}

export function validateRouteInput(input: unknown): ValidationResult<ValidatedRouteInput> {
  const payload = isRecord(input) ? input : {}
  const origin = isRecord(payload.origin) ? payload.origin : {}
  const destination = isRecord(payload.destination) ? payload.destination : {}
  const originContact = isRecord(payload.originContact) ? payload.originContact : {}
  const destinationContact = isRecord(payload.destinationContact) ? payload.destinationContact : {}
  const errors: FieldErrors = {}

  const originAddress = normalizeAddress(origin.address)
  if (!originAddress) errors['origin.address'] = 'Ingresa una direccion de recogida valida.'

  const destinationAddress = normalizeAddress(destination.address)
  if (!destinationAddress) errors['destination.address'] = 'Ingresa una direccion de entrega valida.'

  const originReference = optionalText(origin.reference, 160)
  if (originReference === null) errors['origin.reference'] = 'La referencia de origen es demasiado larga.'

  const destinationReference = optionalText(destination.reference, 160)
  if (destinationReference === null) {
    errors['destination.reference'] = 'La referencia de destino es demasiado larga.'
  }

  const originName = normalizeContactName(originContact.name)
  if (!originName) errors['originContact.name'] = 'Ingresa el nombre de quien entrega.'

  const originPhone = normalizePhone(originContact.phone)
  if (!originPhone) errors['originContact.phone'] = 'Ingresa un telefono de origen valido.'

  const destinationName = normalizeContactName(destinationContact.name)
  if (!destinationName) errors['destinationContact.name'] = 'Ingresa el nombre de quien recibe.'

  const destinationPhone = normalizePhone(destinationContact.phone)
  if (!destinationPhone) errors['destinationContact.phone'] = 'Ingresa un telefono de destino valido.'

  const specialInstructions = optionalText(payload.specialInstructions, 500)
  if (specialInstructions === null) {
    errors.specialInstructions = 'Las instrucciones no pueden exceder 500 caracteres.'
  }

  if (Object.keys(errors).length > 0) {
    return validationError(errors)
  }

  const data: ValidatedRouteInput = {
    origin: { address: originAddress! },
    destination: { address: destinationAddress! },
    originContact: { name: originName!, phone: originPhone! },
    destinationContact: { name: destinationName!, phone: destinationPhone! },
  }

  if (originReference) data.origin.reference = originReference
  if (destinationReference) data.destination.reference = destinationReference
  if (specialInstructions) data.specialInstructions = specialInstructions

  return validationOk(data)
}

export function validateQuotePayload(input: unknown): ValidationResult<{
  origin: Pick<Location, 'address'>
  destination: Pick<Location, 'address'>
}> {
  const payload = isRecord(input) ? input : {}
  const origin = isRecord(payload.origin) ? payload.origin : {}
  const destination = isRecord(payload.destination) ? payload.destination : {}
  const errors: FieldErrors = {}

  const originAddress = normalizeAddress(origin.address)
  if (!originAddress) errors['origin.address'] = 'Ingresa una direccion de origen valida.'

  const destinationAddress = normalizeAddress(destination.address)
  if (!destinationAddress) errors['destination.address'] = 'Ingresa una direccion de destino valida.'

  if (Object.keys(errors).length > 0) {
    return validationError(errors)
  }

  return validationOk({
    origin: { address: originAddress! },
    destination: { address: destinationAddress! },
  })
}

export function validateTripRequestPayload(input: unknown): ValidationResult<ValidatedTripRequestPayload> {
  const payload = isRecord(input) ? input : {}
  const errors: FieldErrors = {}

  const serviceType = isAllowed(payload.serviceType, SERVICE_TYPES)
    ? payload.serviceType
    : 'personal'

  const vehicleResult = validateVehicleInput(payload.vehicle)
  if (!vehicleResult.ok) assignNestedErrors('vehicle', vehicleResult.errors, errors)

  const routeResult = validateRouteInput(payload)
  if (!routeResult.ok) Object.assign(errors, routeResult.errors)

  const asap = typeof payload.asap === 'boolean' ? payload.asap : true
  const scheduledAt = optionalText(payload.scheduledAt, 40)
  if (scheduledAt === null) errors.scheduledAt = 'La fecha programada no es valida.'

  if (!asap) {
    if (!scheduledAt) {
      errors.scheduledAt = 'Selecciona fecha y hora para programar el viaje.'
    } else {
      const scheduledTime = new Date(scheduledAt).getTime()
      if (!Number.isFinite(scheduledTime) || scheduledTime < Date.now() - 5 * 60 * 1000) {
        errors.scheduledAt = 'La fecha programada debe ser futura.'
      }
    }
  }

  if (!vehicleResult.ok || !routeResult.ok || Object.keys(errors).length > 0) {
    return validationError(errors)
  }

  const data: ValidatedTripRequestPayload = {
    ...routeResult.data,
    serviceType,
    vehicle: vehicleResult.data,
    asap,
  }

  if (scheduledAt) data.scheduledAt = scheduledAt

  return validationOk(data)
}
