<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError, formatDateTime } from '../api/client'
import { getDelivery, retryDelivery } from '../api/webhooks'
import type { DeliveryDetail } from '../types/api'
import StatusBadge from '../components/StatusBadge.vue'

const route = useRoute()
const delivery = ref<DeliveryDetail | null>(null)
const loading = ref(true)
const retrying = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const deliveryId = computed(() => String(route.params.id))

const canRetry = computed(() => {
  if (!delivery.value) {
    return false
  }

  return delivery.value.status === 'failed' || delivery.value.status === 'abandoned'
})

const formattedPayload = computed(() => {
  if (!delivery.value) {
    return ''
  }

  return JSON.stringify(delivery.value.payload, null, 2)
})

async function loadDelivery(): Promise<void> {
  loading.value = true
  errorMessage.value = null

  try {
    delivery.value = await getDelivery(deliveryId.value)
  } catch (error) {
    delivery.value = null

    if (error instanceof ApiError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Failed to load delivery.'
    }
  } finally {
    loading.value = false
  }
}

async function retry(): Promise<void> {
  if (!delivery.value || !canRetry.value) {
    return
  }

  retrying.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    await retryDelivery(delivery.value.id)
    successMessage.value = '202 Accepted — delivery re-queued.'
    await loadDelivery()
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Failed to retry delivery.'
    }
  } finally {
    retrying.value = false
  }
}

onMounted(() => {
  void loadDelivery()
})
</script>

<template>
  <section class="page">
    <div class="page-header">
      <h1>Delivery Detail</h1>
      <p class="muted mono">{{ deliveryId }}</p>
    </div>

    <p v-if="loading" class="hint">Loading delivery…</p>
    <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="alert alert--success">{{ successMessage }}</p>

    <template v-if="delivery">
      <div class="card">
        <div class="card-header">
          <h2>Metadata</h2>
          <button
            class="btn btn--primary"
            type="button"
            :disabled="!canRetry || retrying"
            @click="retry"
          >
            {{ retrying ? 'Retrying…' : 'Retry Delivery' }}
          </button>
        </div>

        <dl class="meta-grid">
          <div>
            <dt>Status</dt>
            <dd><StatusBadge :status="delivery.status" /></dd>
          </div>
          <div>
            <dt>Event Type</dt>
            <dd>{{ delivery.event_type }}</dd>
          </div>
          <div>
            <dt>Attempts</dt>
            <dd>{{ delivery.attempts }}</dd>
          </div>
          <div>
            <dt>Last HTTP Status</dt>
            <dd>{{ delivery.last_http_status ?? '—' }}</dd>
          </div>
          <div>
            <dt>Next Attempt At</dt>
            <dd>{{ formatDateTime(delivery.next_attempt_at) }}</dd>
          </div>
          <div>
            <dt>Delivered At</dt>
            <dd>{{ formatDateTime(delivery.delivered_at) }}</dd>
          </div>
          <div>
            <dt>Created At</dt>
            <dd>{{ formatDateTime(delivery.created_at) }}</dd>
          </div>
          <div>
            <dt>Updated At</dt>
            <dd>{{ formatDateTime(delivery.updated_at) }}</dd>
          </div>
          <div class="meta-grid__full">
            <dt>Last Error</dt>
            <dd>{{ delivery.last_error ?? '—' }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="delivery.endpoint" class="card">
        <h2>Endpoint</h2>
        <dl class="meta-grid">
          <div>
            <dt>URL</dt>
            <dd class="mono">{{ delivery.endpoint.url }}</dd>
          </div>
          <div>
            <dt>Client ID</dt>
            <dd>{{ delivery.endpoint.client_id }}</dd>
          </div>
          <div>
            <dt>Event Types</dt>
            <dd>{{ delivery.endpoint.event_types.join(', ') }}</dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd>
              <StatusBadge :status="delivery.endpoint.is_active ? 'active' : 'inactive'" />
            </dd>
          </div>
        </dl>
      </div>

      <div class="card">
        <h2>Payload</h2>
        <pre class="code-block">{{ formattedPayload }}</pre>
      </div>

      <div class="card">
        <h2>Attempt History</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>HTTP Status</th>
                <th>Error</th>
                <th>Attempted At</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!delivery.attempt_history.length">
                <td colspan="4" class="empty">No attempts recorded yet.</td>
              </tr>
              <tr v-for="attempt in delivery.attempt_history" :key="attempt.id">
                <td>{{ attempt.attempt_number }}</td>
                <td>{{ attempt.http_status ?? '—' }}</td>
                <td>{{ attempt.error_message ?? '—' }}</td>
                <td>{{ formatDateTime(attempt.attempted_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>
