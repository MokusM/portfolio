<script setup>
// What the phone in the hand shows: a status bar with the notch, then the site.
// The overlay covers the whole glass, so the generated screen underneath never shows.
// `chrome` (0..1) folds the status bar away during the zoom into the phone, so at the
// end the screen is exactly the page the visitor lands on.
import { computed } from 'vue'
import SiteHero from '../SiteHero.vue'

const props = defineProps({
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  chrome: { type: Number, default: 1 },
})

// proportions of the phone in K5: status bar ≈ 11% of the width, notch ≈ 55% × 8.5%
const bar = computed(() => Math.round(props.w * 0.113 * props.chrome))
const notch = computed(() => ({
  width: props.w * 0.55 + 'px',
  height: props.w * 0.085 + 'px',
  borderRadius: `0 0 ${props.w * 0.05}px ${props.w * 0.05}px`,
  opacity: props.chrome,
}))
const ui = computed(() => ({ fontSize: props.w * 0.038 + 'px', opacity: props.chrome }))
</script>

<template>
  <div class="phone" :style="{ width: w + 'px', height: h + 'px' }">
    <div class="phone__bar" :style="{ height: bar + 'px' }">
      <span class="phone__time" :style="ui">21:40</span>
      <span class="phone__icons" :style="ui">
        <i class="sig"><b /><b /><b /><b /></i>
        <i class="wifi" />
        <i class="batt" />
      </span>
    </div>
    <div class="phone__notch" :style="notch" />
    <div class="phone__page" :style="{ top: bar + 'px', height: h - bar + 'px' }">
      <SiteHero />
    </div>
  </div>
</template>

<style scoped>
.phone {
  position: relative;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
}

.phone__bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 7%;
  overflow: hidden;
}

/* the ears beside the notch hold the time and the icons */
.phone__time {
  width: 18%;
  font: 600 1em / 1 system-ui, -apple-system, 'Segoe UI', sans-serif;
  text-align: center;
}

.phone__icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
  width: 18%;
}

.sig {
  display: flex;
  align-items: flex-end;
  gap: 0.08em;
  height: 0.7em;
}

.sig b {
  width: 0.16em;
  background: currentColor;
}

.sig b:nth-child(1) { height: 30%; }
.sig b:nth-child(2) { height: 55%; }
.sig b:nth-child(3) { height: 80%; }
.sig b:nth-child(4) { height: 100%; }

.wifi {
  width: 0.75em;
  height: 0.55em;
  background: currentColor;
  clip-path: polygon(50% 100%, 0 22%, 22% 0, 78% 0, 100% 22%);
}

.batt {
  position: relative;
  width: 1.25em;
  height: 0.6em;
  border: 0.08em solid currentColor;
  border-radius: 0.15em;
  box-shadow: inset 0 0 0 0.1em var(--paper), inset 0 0 0 1em currentColor;
}

.phone__notch {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  background: #050505;
}

.phone__page {
  position: absolute;
  left: 0;
  right: 0;
}
</style>
