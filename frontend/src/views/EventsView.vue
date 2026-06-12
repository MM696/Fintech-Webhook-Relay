<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, getFieldError } from '../api/client'
import { ingestEvent } from '../api/webhooks'

const clientId = ref('')
const eventType = ref('')
const payloadText = ref('{}')

const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})
const payloadError = ref<string | null>(null)
const acceptedMessage = ref<string | null>(null)
const deliveryIds = ref<string[]>([])

function fieldError(field: string): string | null {
  return getFieldError(fieldErrors.value, field)
}

function parsePayload(): Record<string, unknown> | null {
  payloadError.value = null

  try {
    const parsed: unknown = JSON.parse(payloadText.value)

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      payloadError.value = 'Payload must be a JSON object.'
      return null
    }

    return parsed as Record<string, unknown>
  } catch {
    payloadError.value = 'Invalid JSON payload.'
    return null
  }
}

async function submitEvent(): Promise<void> {
  submitting.value = true
  errorMessage.value = null
  fieldErrors.value = {}
  acceptedMessage.value = null
  deliveryIds.value = []

  const payload = parsePayload()

  if (!payload) {
    submitting.value = false
    return
  }

  try {
    const response = await ingestEvent({
      client_id: clientId.value.trim(),
      event_type: eventType.value.trim(),
      payload,
    })

    acceptedMessage.value = '202 Accepted — event queued for delivery.'
    deliveryIds.value = response.delivery_ids
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      fieldErrors.value = error.fieldErrors
    } else {
      errorMessage.value = 'Failed to ingest event.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <h1>Event Ingestion</h1>
      <p class="muted">Publish events to matching webhook endpoints.</p>
    </div>

    <div class="card">
      <form class="form" @submit.prevent="submitEvent">
        <div class="form-row">
          <label for="event-client-id">Client ID</label>
          <input id="event-client-id" v-model="clientId" type="text" required />
          <p v-if="fieldError('client_id')" class="field-error">{{ fieldError('client_id') }}</p>
        </div>

        <div class="form-row">
          <label for="event-type">Event Type</label>
          <input id="event-type" v-model="eventType" type="text" required placeholder="payment.completed" />
          <p v-if="fieldError('event_type')" class="field-error">{{ fieldError('event_type') }}</p>
        </div>

        <div class="form-row">
          <label for="payload">Payload (JSON)</label>
          <textarea id="payload" v-model="payloadText" rows="8" class="code-input" required />
          <p v-if="payloadError" class="field-error">{{ payloadError }}</p>
          <p v-if="fieldError('payload')" class="field-error">{{ fieldError('payload') }}</p>
        </div>

        <button class="btn btn--primary" type="submit" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit Event' }}
        </button>
      </form>

      <p v-if="acceptedMessage" class="alert alert--success">{{ acceptedMessage }}</p>
      <div v-if="deliveryIds.length" class="delivery-ids">
        <p class="hint">Delivery IDs:</p>
        <ul>
          <li v-for="id in deliveryIds" :key="id" class="mono">{{ id }}</li>
        </ul>
      </div>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    </div>
  </section>
</template>
