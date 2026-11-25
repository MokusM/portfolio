<script setup>
import SiteNav from './SiteNav.vue'
import { ui } from '../state.js'
</script>

<template>
  <header
    class="site-header"
    :data-tone="ui.headerTone"
    :style="{ opacity: ui.headerOpacity, visibility: ui.headerOpacity > 0 ? 'visible' : 'hidden' }"
  >
    <SiteNav />
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  container-type: inline-size;
  color: var(--ink);
  pointer-events: none;
  transition: color 0.4s ease;
}

.site-header :deep(a) {
  pointer-events: auto;
}

.site-header[data-tone='light'] {
  color: var(--paper);
}
</style>
