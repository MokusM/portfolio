<script setup>
import SiteNav from './SiteNav.vue'
import { ui } from '../state.js'
</script>

<template>
  <header
    class="site-header"
    :class="{ 'is-solid': ui.headerSolid }"
    :data-header-tone="ui.headerTone"
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
  /* the bottom padding only matters for the solid bar; the nav's own position
     stays exactly where the copies on the screens put it */
  padding-bottom: 16px;
  color: var(--ink);
  pointer-events: none;
  transition: color 0.4s ease, background-color 0.4s ease;
}

.site-header :deep(a) {
  pointer-events: auto;
}

.site-header[data-header-tone='light'] {
  color: var(--paper);
}

/* over the photo (not solid) the text stays light whatever the page colours are */
.site-header:not(.is-solid)[data-header-tone='light'] {
  color: var(--on-photo);
}

.site-header.is-solid {
  background-color: var(--paper);
}

.site-header.is-solid[data-header-tone='light'] {
  background-color: var(--ink);
}
</style>
