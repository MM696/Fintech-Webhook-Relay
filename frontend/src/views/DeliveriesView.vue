<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiError, formatDateTime, truncateId } from '../api/client'
import { listDeliveries } from '../api/webhooks'
import type { DeliveryListItem, DeliveryStatus } from '../types/api'
import StatusBadge from '../components/StatusBadge.vue'

const deliveries = ref<DeliveryListItem[]>([])
const statusFilter = ref('')
const endpointIdFilter = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const lastRefreshedAt = ref<string | null>(null)

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'delivering', label: 'Delivering' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'abandoned', label: 'Abandoned' },
]

let pollTimer: ReturnType<typeof setInterval> | null = null

async function loadDeliveries(): Promise<void> {
  loading.value = true
  errorMessage.value = null

  try {
    deliveries.value = await listDeliveries({
      status: statusFilter.value || undefined,
      endpoint_id: endpointIdFilter.value.trim() || undefined,
    })
    lastRefreshedAt.value = new Date().toLocaleString()
  } catch (error) {
    deliveries.value = []

    if (error instanceof ApiError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Failed to load deliveries.'
    }
  } finally {
    loading.value = false
  }
}

function displayTimestamp(delivery: DeliveryListItem): string {
  return formatDateTime(delivery.delivered_at ?? delivery.updated_at)
}

onMounted(() => {
  void loadDeliveries()
  pollTimer = setInterval(() => {
    void loadDeliveries()
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <section class="page">
    <div class="page-header">
      <h1>Deliveries</h1>
      <p class="muted">Monitor webhook delivery status. Auto-refreshes every 5 seconds.</p>
    </div>

    <div class="card">
      <div class="filters">
        <div class="form-row">
          <label for="status-filter">Status</label>
          <select id="status-filter" v-model="statusFilter" @change="loadDeliveries">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="endpoint-filter">Endpoint ID</label>
          <input
            id="endpoint-filter"
            v-model="endpointIdFilter"
            type="text"
            placeholder="UUID"
            @keyup.enter="loadDeliveries"
          />
        </div>

        <button class="btn" type="button" :disabled="loading" @click="loadDeliveries">
          {{ loading ? 'Refreshing…' : 'Refresh Now' }}
        </button>
      </div>

      <p v-if="lastRefreshedAt" class="hint">Last refreshed: {{ lastRefreshedAt }}</p>
      <p v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Delivery ID</th>
              <th>Event Type</th>
              <th>Endpoint URL</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Last HTTP</th>
              <th>Next Attempt</th>
              <th>Delivered / Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!deliveries.length">
              <td colspan="8" class="empty">No deliveries found.</td>
            </tr>
            <tr v-for="delivery in deliveries" :key="delivery.id">
              <td>
                <RouterLink :to="`/deliveries/${delivery.id}`" class="link mono">
                  {{ truncateId(delivery.id) }}
                </RouterLink>
              </td>
              <td>{{ delivery.event_type }}</td>
              <td class="mono">{{ delivery.endpoint_url ?? '—' }}</td>
              <td>
                <StatusBadge :status="delivery.status as DeliveryStatus" />
              </td>
              <td>{{ delivery.attempts }}</td>
              <td>{{ delivery.last_http_status ?? '—' }}</td>
              <td>{{ formatDateTime(delivery.next_attempt_at) }}</td>
              <td>{{ displayTimestamp(delivery) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
