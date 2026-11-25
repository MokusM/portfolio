<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import HeroScene from './components/HeroScene.vue'
import SiteHero from './components/SiteHero.vue'
import CasesSection from './components/CasesSection.vue'
import ContactSection from './components/ContactSection.vue'
import { ui, reducedMotion } from './state.js'

// Calm version: no pinning or zoom — a still of the desk, then the page.
const reduced = reducedMotion

// The header takes the tone of the section under it: data-tone="dark" means dark
// text (paper sections), "light" — light text (dark sections). The scroll scene has
// no data-tone and sets the tone itself while it plays.
function syncTone() {
  const hit = document
    .elementsFromPoint(window.innerWidth / 2, 32)
    .map((el) => el.closest('[data-tone]'))
    .find(Boolean)
  if (hit) ui.headerTone = hit.dataset.tone
  // over the photo (data-clear) the header stays transparent
  ui.headerSolid = Boolean(hit) && !hit.hasAttribute('data-clear')
}

onMounted(() => {
  window.addEventListener('scroll', syncTone, { passive: true })
  syncTone()
})
onBeforeUnmount(() => window.removeEventListener('scroll', syncTone))
</script>

<template>
  <SiteHeader />
  <main id="top">
    <HeroScene
      :reduced="reduced"
      :data-tone="reduced ? 'light' : null"
      :data-clear="reduced ? '' : null"
    />
    <section v-if="reduced" class="static-hero" data-tone="dark">
      <SiteHero :with-nav="false" xray />
    </section>
    <CasesSection />
    <ContactSection />
  </main>
</template>

<style scoped>
.static-hero {
  height: 100vh;
  height: 100svh;
}
</style>
