import type { FieldErrors } from '../types/api'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3333'
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY ?? ''

function parseFieldErrors(body: unknown): FieldErrors {
  if (!body || typeof body !== 'object') {
    return {}
  }

  const record = body as Record<string, unknown>
  const fieldErrors: FieldErrors = {}

  if (Array.isArray(record.errors)) {
    for (const item of record.errors) {
      if (!item || typeof item !== 'object') {
        continue
      }

      const errorItem = item as Record<string, unknown>
      const field = typeof errorItem.field === 'string' ? errorItem.field : 'general'
      const message =
        typeof errorItem.message === 'string' ? errorItem.message : 'Validation failed'

      fieldErrors[field] = [...(fieldErrors[field] ?? []), message]
    }

    return fieldErrors
  }

  if (record.errors && typeof record.errors === 'object' && !Array.isArray(record.errors)) {
    for (const [field, messages] of Object.entries(record.errors as Record<string, unknown>)) {
      if (Array.isArray(messages)) {
        fieldErrors[field] = messages.map(String)
      } else if (typeof messages === 'string') {
        fieldErrors[field] = [messages]
      }
    }
  }

  return fieldErrors
}

function parseErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const record = body as Record<string, unknown>

  if (typeof record.error === 'string') {
    return record.error
  }

  if (typeof record.message === 'string') {
    return record.message
  }

  return fallback
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  headers.set('Authorization', `Bearer ${API_SECRET_KEY}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const body = await parseResponseBody(response)

  if (!response.ok) {
    const fieldErrors = parseFieldErrors(body)
    const message = parseErrorMessage(body, `Request failed with status ${response.status}`)

    throw new ApiError(message, response.status, fieldErrors)
  }

  return body as T
}

export function getFieldError(fieldErrors: FieldErrors, field: string): string | null {
  const messages = fieldErrors[field]

  return messages?.[0] ?? null
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) {
    return id
  }

  return `${id.slice(0, length)}…`
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString()
}
