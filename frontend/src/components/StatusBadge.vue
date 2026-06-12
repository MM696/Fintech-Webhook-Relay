<script setup lang="ts">
import type { DeliveryStatus } from '../types/api'

defineProps<{
  status: DeliveryStatus | 'active' | 'inactive'
}>()

const statusClassMap: Record<string, string> = {
  pending: 'badge--pending',
  delivering: 'badge--delivering',
  delivered: 'badge--delivered',
  failed: 'badge--failed',
  abandoned: 'badge--abandoned',
  active: 'badge--active',
  inactive: 'badge--inactive',
}
</script>

<template>
  <span class="badge" :class="statusClassMap[status] ?? 'badge--pending'">
    {{ status }}
  </span>
</template>
