<script setup>
// A small Figma window in the editor's corner: the mockup stays in sight while its
// code is typed, and the selection jumps to the element being written.
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import SiteHero from '../SiteHero.vue'
import { DESIGN_W, DESIGN_H, ELEMENTS, measureBoxes, fallbackBoxes } from './screen-layout.js'

const props = defineProps({
  // element whose code is being typed: bg, grid, nav, title, lead, actions, cases, script
  active: { type: String, default: 'bg' },
  visible: { type: Boolean, default: false },
})

const WIDTH = 360 // px, in the editor's own pixels
const BAR = 26
const PAD = 8
const scale = (WIDTH - PAD * 2) / DESIGN_W

const NAMES = { bg: 'Перший екран', grid: 'Перший екран', ...Object.fromEntries(ELEMENTS.map((e) => [e.key, e.name])) }

const host = ref(null)
const boxes = ref(fallbackBoxes(ELEMENTS))

function measure() {
  const hero = host.value?.querySelector('.hero')
  if (!hero || hero.offsetWidth === 0) return
  boxes.value = measureBoxes(hero, ELEMENTS)
}

onMounted(() => {
  measure()
  document.fonts?.ready.then(() => nextTick(measure))
})
watch(
  () => props.visible,
  (v) => v && nextTick(measure),
)

const selection = computed(() => {
  const full = { x: 0, y: 0, w: DESIGN_W, h: DESIGN_H }
  const b = boxes.value[props.active] ?? full
  return {
    left: PAD + b.x * scale + 'px',
    top: BAR + PAD + b.y * scale + 'px',
    width: b.w * scale + 'px',
    height: b.h * scale + 'px',
  }
})
const name = computed(() => NAMES[props.active] ?? NAMES.bg)
</script>

<template>
  <div
    class="pip"
    :class="{ 'is-visible': visible && active !== 'script' }"
    :style="{ width: WIDTH + 'px', height: BAR + PAD * 2 + DESIGN_H * scale + 'px' }"
  >
    <div class="pip__bar">
      <i /><i /><i />
      <span>Figma — Перший екран</span>
    </div>
    <div
      ref="host"
      class="pip__frame"
      :style="{
        left: PAD + 'px',
        top: BAR + PAD + 'px',
        width: DESIGN_W + 'px',
        height: DESIGN_H + 'px',
        transform: `scale(${scale})`,
      }"
    >
      <SiteHero />
    </div>
    <div class="pip__selection" :style="selection">
      <span class="pip__label">{{ name }}</span>
    </div>
  </div>
</template>

<style scoped>
.pip {
  position: absolute;
  right: 22px;
  bottom: 46px;
  z-index: 2;
  overflow: hidden;
  border-radius: 8px;
  background: #2c2c2c;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
  font: 400 11px / 1 system-ui, -apple-system, 'Segoe UI', sans-serif;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.pip.is-visible {
  opacity: 1;
  transform: none;
}

.pip__bar {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  color: #b3b3b3;
  background: #383838;
}

.pip__bar i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5a5a5a;
}

.pip__bar span {
  margin-left: 8px;
}

.pip__frame {
  position: absolute;
  transform-origin: 0 0;
}

.pip__selection {
  position: absolute;
  border: 1.5px solid #0d99ff;
  transition: all 0.3s ease;
}

.pip__label {
  position: absolute;
  left: -1.5px;
  bottom: calc(100% + 3px);
  padding: 2px 5px;
  border-radius: 3px;
  background: #0d99ff;
  color: #fff;
  font-size: 10px;
  white-space: nowrap;
}
</style>
