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

function onScroll() {
  ui.headerTone = window.scrollY > window.innerHeight * 0.85 ? 'dark' : 'light'
}

onMounted(() => {
  if (reduced) window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <SiteHeader />
  <main id="top">
    <HeroScene :reduced="reduced" />
    <section v-if="reduced" class="static-hero">
      <SiteHero :with-nav="false" />
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
