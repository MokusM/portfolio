<script setup>
// Easter egg "x-ray": over the real first screen the cursor (on a phone — the finger)
// becomes a lens. Under it the page shows what it is made of: the 12-column grid,
// Figma layer frames with their sizes, and each element's own code in its place.
// Lives inside SiteHero's .hero (positioned parent, cqi units of the hero).
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ELEMENTS, measureBoxes } from './screens/screen-layout.js'
import { CODE_CHUNKS } from './screens/hero-code.js'
import { tokenize } from './screens/code-tokens.js'

const root = ref(null)
const lens = reactive({ x: 0, y: 0, on: false })
const boxes = ref({})

// element code without its indentation, tokenized for colours
const CODE = Object.fromEntries(
  CODE_CHUNKS.filter((c) => ELEMENTS.some((e) => e.key === c.key)).map((c) => {
    const lines = c.text.replace(/\n$/, '').split('\n')
    const indent = Math.min(...lines.map((l) => l.length - l.trimStart().length))
    const text = lines.map((l) => l.slice(indent)).join('\n')
    return [c.key, tokenize(text)]
  }),
)

const items = computed(() =>
  ELEMENTS.filter((e) => boxes.value[e.key]).map((e) => {
    const b = boxes.value[e.key]
    return {
      key: e.key,
      box: b,
      label: `${e.name} · ${Math.round(b.w)} × ${Math.round(b.h)}`,
      tokens: CODE[e.key] ?? [],
      style: { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' },
    }
  }),
)

// The element under the lens: its code is shown inside the lens, like an inspector.
const hovered = computed(() => {
  const { x, y } = lens
  return (
    items.value.find((i) => x >= i.box.x && x <= i.box.x + i.box.w && y >= i.box.y && y <= i.box.y + i.box.h) ??
    null
  )
})

let hero = null
let frame = 0

function measure() {
  if (hero && hero.offsetWidth) boxes.value = measureBoxes(hero, ELEMENTS)
}

function place(e, touch) {
  const r = hero.getBoundingClientRect()
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    lens.x = e.clientX - r.left
    // a finger would cover the lens: lift it above the touch point
    lens.y = e.clientY - r.top - (touch ? 110 : 0)
    lens.on = true
  })
}

const onMove = (e) => place(e, e.pointerType === 'touch')
const onDown = (e) => e.pointerType === 'touch' && place(e, true)
const onLeave = () => {
  cancelAnimationFrame(frame)
  lens.on = false
}
const onUp = (e) => e.pointerType === 'touch' && onLeave()

let resizeObserver = null

onMounted(() => {
  hero = root.value?.parentElement
  if (!hero) return
  measure()
  document.fonts?.ready.then(() => nextTick(measure))
  resizeObserver = new ResizeObserver(measure)
  resizeObserver.observe(hero)
  hero.addEventListener('pointermove', onMove)
  hero.addEventListener('pointerdown', onDown)
  hero.addEventListener('pointerleave', onLeave)
  hero.addEventListener('pointerup', onUp)
  hero.addEventListener('pointercancel', onLeave)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cancelAnimationFrame(frame)
  if (!hero) return
  hero.removeEventListener('pointermove', onMove)
  hero.removeEventListener('pointerdown', onDown)
  hero.removeEventListener('pointerleave', onLeave)
  hero.removeEventListener('pointerup', onUp)
  hero.removeEventListener('pointercancel', onLeave)
})
</script>

<template>
  <div
    ref="root"
    class="xray"
    :class="{ 'is-on': lens.on }"
    :style="{ '--x': lens.x + 'px', '--y': lens.y + 'px' }"
    aria-hidden="true"
  >
    <div class="xray__layer">
      <div class="xray__grid"><span v-for="i in 12" :key="i" /></div>
      <div
        v-for="item in items"
        :key="item.key"
        class="xray__box"
        :class="{ 'is-hovered': hovered && hovered.key === item.key }"
        :style="item.style"
      >
        <span class="xray__label">{{ item.label }}</span>
      </div>
    </div>
    <div class="xray__frame">
      <i /><i /><i /><i />
      <span class="xray__tag">Рентген</span>
      <div class="xray__panel">
        <template v-if="hovered">
          <p class="xray__panel-name">{{ hovered.label }}</p>
          <pre class="xray__code"><span v-for="(t, i) in hovered.tokens" :key="i" :class="'tok-' + t.cls">{{ t.text }}</span></pre>
        </template>
        <p v-else class="xray__panel-name">Сітка · 12 колонок</p>
      </div>
    </div>
  </div>
  <p class="xray__hint">
    <span class="xray__hint-mouse">Наведіть курсор — рентген макета</span>
    <span class="xray__hint-touch">Торкніться — рентген макета</span>
  </p>
</template>

<style scoped>
.xray {
  --lw: clamp(220px, 26cqi, 400px);
  --lh: calc(var(--lw) * 0.66);
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

/* the blueprint, cut to the lens */
.xray__layer {
  position: absolute;
  inset: 0;
  background: #121216;
  color: #c9c7c2;
  clip-path: inset(
    calc(var(--y) - var(--lh) / 2) calc(100% - var(--x) - var(--lw) / 2)
      calc(100% - var(--y) - var(--lh) / 2) calc(var(--x) - var(--lw) / 2)
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.xray.is-on .xray__layer,
.xray.is-on .xray__frame {
  opacity: 1;
}

.xray__grid {
  --pad: max(16px, 4cqi);
  position: absolute;
  inset: 0 var(--pad);
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1.5cqi;
}

.xray__grid span {
  background: rgba(232, 64, 44, 0.12);
  box-shadow: inset 1px 0 rgba(232, 64, 44, 0.45), inset -1px 0 rgba(232, 64, 44, 0.45);
}

.xray__box {
  position: absolute;
  border: 1px solid rgba(13, 153, 255, 0.55);
  background: rgba(13, 153, 255, 0.04);
}

.xray__box.is-hovered {
  border: 1.5px solid #0d99ff;
  background: rgba(13, 153, 255, 0.1);
}

.xray__label {
  position: absolute;
  left: -1.5px;
  bottom: calc(100% + 4px);
  padding: 2px 6px;
  border-radius: 3px;
  background: #0d99ff;
  color: #fff;
  font: 500 11px / 1.2 system-ui, -apple-system, 'Segoe UI', sans-serif;
  white-space: nowrap;
}

/* the hovered element's code, inside the lens */
.xray__panel {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  padding: 8px 10px;
  overflow: hidden;
  max-height: calc(100% - 20px);
  background: rgba(14, 14, 18, 0.9);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  color: #c9c7c2;
}

.xray__panel-name {
  margin: 0 0 4px;
  color: #6cbcff;
  font: 500 11px / 1.3 system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.xray__code {
  margin: 0;
  overflow: hidden;
  font: 400 11px / 1.5 var(--mono);
  white-space: pre;
}

.xray__frame {
  position: absolute;
  left: calc(var(--x) - var(--lw) / 2);
  top: calc(var(--y) - var(--lh) / 2);
  width: var(--lw);
  height: var(--lh);
  border: 1.5px solid #0d99ff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.xray__frame i {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1.5px solid #0d99ff;
}

.xray__frame i:nth-child(1) { left: -5px; top: -5px; }
.xray__frame i:nth-child(2) { right: -5px; top: -5px; }
.xray__frame i:nth-child(3) { right: -5px; bottom: -5px; }
.xray__frame i:nth-child(4) { left: -5px; bottom: -5px; }

.xray__tag {
  position: absolute;
  right: -1.5px;
  top: calc(100% + 6px);
  padding: 2px 6px;
  border-radius: 3px;
  background: #0d99ff;
  color: #fff;
  font: 500 11px / 1.2 system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.xray__hint {
  position: absolute;
  right: max(16px, 4cqi);
  bottom: calc(11cqi + 18px);
  z-index: 2;
  margin: 0;
  font: 500 max(10px, 0.7cqi) / 1 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.45;
  pointer-events: none;
}

.xray__hint-touch {
  display: none;
}

@media (hover: none) {
  .xray__hint-mouse {
    display: none;
  }

  .xray__hint-touch {
    display: inline;
  }
}

@container (max-width: 720px) {
  .xray__hint {
    bottom: calc(30cqi + 14px);
  }
}
</style>
