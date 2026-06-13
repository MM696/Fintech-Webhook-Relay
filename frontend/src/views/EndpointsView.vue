<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ApiError, getFieldError } from '../api/client'
import {
  createEndpoint,
  deactivateEndpoint,
  listEndpoints,
} from '../api/webhooks'
import type { WebhookEndpoint } from '../types/api'
import StatusBadge from '../components/StatusBadge.vue'

const CLIENT_ID_STORAGE_KEY = 'endpoints:lastClientId'

const clientId = ref('')
const url = ref('')
const secret = ref('')
const eventTypesInput = ref('')
const listClientId = ref('')

const endpoints = ref<WebhookEndpoint[]>([])
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})
const successMessage = ref<string | null>(null)

function rememberClientId(value: string): void {
  sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, value)
}

function fieldError(field: string): string | null {
  return getFieldError(fieldErrors.value, field)
}

async function loadEndpoints(): Promise<void> {
  if (!listClientId.value.trim()) {
    errorMessage.value = 'Enter a client ID to load endpoints.'
    return
  }

  loading.value = true
  errorMessage.value = null
  fieldErrors.value = {}

  try {
    endpoints.value = await listEndpoints(listClientId.value.trim())
    rememberClientId(listClientId.value.trim())
  } catch (error) {
    endpoints.value = []

    if (error instanceof ApiError) {
      errorMessage.value = error.message
      fieldErrors.value = error.fieldErrors
    } else {
      errorMessage.value = 'Failed to load endpoints.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const savedClientId = sessionStorage.getItem(CLIENT_ID_STORAGE_KEY)

  if (!savedClientId) {
    return
  }

  listClientId.value = savedClientId
  clientId.value = savedClientId
  void loadEndpoints()
})

async function submitEndpoint(): Promise<void> {
  submitting.value = true
  errorMessage.value = null
  fieldErrors.value = {}
  successMessage.value = null

  const eventTypes = eventTypesInput.value
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  try {
    await createEndpoint({
      client_id: clientId.value.trim(),
      url: url.value.trim(),
      secret: secret.value,
      event_types: eventTypes,
    })

    successMessage.value = 'Endpoint registered successfully.'
    listClientId.value = clientId.value.trim()
    url.value = ''
    secret.value = ''
    eventTypesInput.value = ''

    await loadEndpoints()
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      fieldErrors.value = error.fieldErrors
    } else {
      errorMessage.value = 'Failed to register endpoint.'
    }
  } finally {
    submitting.value = false
  }
}

async function deactivate(id: string): Promise<void> {
  errorMessage.value = null
  successMessage.value = null

  try {
    await deactivateEndpoint(id)
    successMessage.value = 'Endpoint deactivated.'
    await loadEndpoints()
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Failed to deactivate endpoint.'
    }
  }
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <h1>Webhook Endpoints</h1>
      <p class="muted">Register subscriber URLs and manage active endpoints.</p>
    </div>

    <div class="card">
      <h2>Register Endpoint</h2>
      <form class="form" @submit.prevent="submitEndpoint">
        <div class="form-row">
          <label for="client-id">Client ID</label>
          <input id="client-id" v-model="clientId" type="text" required />
          <p v-if="fieldError('client_id')" class="field-error">{{ fieldError('client_id') }}</p>
        </div>

        <div class="form-row">
          <label for="url">URL</label>
          <input id="url" v-model="url" type="url" required placeholder="https://example.com/webhook" />
          <p v-if="fieldError('url')" class="field-error">{{ fieldError('url') }}</p>
        </div>

        <div class="form-row">
          <label for="secret">Secret</label>
          <input id="secret" v-model="secret" type="password" required />
          <p v-if="fieldError('secret')" class="field-error">{{ fieldError('secret') }}</p>
        </div>

        <div class="form-row">
          <label for="event-types">Event Types</label>
          <input
            id="event-types"
            v-model="eventTypesInput"
            type="text"
            required
            placeholder="payment.completed, payment.failed"
          />
          <p class="hint">Comma-separated list of event types.</p>
          <p v-if="fieldError('event_types')" class="field-error">{{ fieldError('event_types') }}</p>
        </div>

        <button class="btn btn--primary" type="submit" :disabled="submitting">
          {{ submitting ? 'Registering…' : 'Register Endpoint' }}
        </button>
      </form>

      <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Endpoints</h2>
        <div class="inline-form">
          <input v-model="listClientId" type="text" placeholder="Client ID" />
          <button class="btn" type="button" :disabled="loading" @click="loadEndpoints">
            {{ loading ? 'Loading…' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Event Types</th>
              <th>Status</th>
              <th>Created At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!endpoints.length">
              <td colspan="5" class="empty">No endpoints loaded.</td>
            </tr>
            <tr v-for="endpoint in endpoints" :key="endpoint.id">
              <td class="mono">{{ endpoint.url }}</td>
              <td>{{ endpoint.event_types.join(', ') }}</td>
              <td>
                <StatusBadge :status="endpoint.is_active ? 'active' : 'inactive'" />
              </td>
              <td>{{ new Date(endpoint.created_at).toLocaleString() }}</td>
              <td>
                <button
                  v-if="endpoint.is_active"
                  class="btn btn--danger btn--small"
                  type="button"
                  @click="deactivate(endpoint.id)"
                >
                  Deactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
