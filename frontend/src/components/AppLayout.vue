<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { to: '/endpoints', label: 'Endpoints' },
  { to: '/events', label: 'Events' },
  { to: '/deliveries', label: 'Deliveries' },
]

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header__inner">
        <RouterLink to="/" class="brand">Ezrah Webhook Relay</RouterLink>
        <nav class="nav">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="nav__link"
            :class="{ 'nav__link--active': isActive(link.to) }"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>
