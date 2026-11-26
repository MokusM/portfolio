<script setup>
// Chapter 02: the sketched screen as a Figma file. The frame is the real SiteHero,
// and the selection boxes are measured from its layout, so they are exact.
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import SiteHero from '../SiteHero.vue'
import {
  DESIGN_W,
  DESIGN_H,
  LAYERS,
  FALLBACK_BOXES,
  measureLayers,
  figmaLayout,
} from './screen-layout.js'

const props = defineProps({
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  layer: { type: Number, default: 0 },
})

const frameHost = ref(null)
const boxes = ref(FALLBACK_BOXES)

function measure() {
  const hero = frameHost.value?.querySelector('.hero')
  if (hero) boxes.value = measureLayers(hero)
}

onMounted(() => {
  measure()
  document.fonts?.ready.then(() => nextTick(measure))
})

const geo = computed(() => figmaLayout(props.w, props.h))
const TOP = computed(() => geo.value.top)
const left = computed(() => geo.value.left)
const right = computed(() => geo.value.right)
const scale = computed(() => geo.value.frame.s)
const frameRect = computed(() => geo.value.frame)

const current = computed(() => LAYERS[Math.min(props.layer, LAYERS.length - 1)])
const box = computed(() => boxes.value[current.value.key])
const selection = computed(() => {
  const { x, y, s } = frameRect.value
  const b = box.value
  return { left: x + b.x * s, top: y + b.y * s, width: b.w * s, height: b.h * s }
})
const sizeLabel = computed(() => {
  const b = box.value
  const size = `${Math.round(b.w)} × ${Math.round(b.h)}`
  return current.value.hug ? `Hug · ${size}` : size
})

watch(() => [props.w, props.h], () => nextTick(measure))
</script>

<template>
  <div
    class="figma"
    :style="{
      width: w + 'px',
      height: h + 'px',
      gridTemplate: `${TOP}px 1fr / ${left}px 1fr ${right}px`,
    }"
  >
    <div class="figma__bar">
      <div class="figma__tools">
        <span class="tool is-active" />
        <span class="tool" />
        <span class="tool" />
        <span class="tool" />
      </div>
      <p class="figma__file"><span>Портфоліо</span> / Перший екран</p>
      <div class="figma__right">
        <span class="figma__zoom">{{ Math.round(scale * 100) }}%</span>
        <span class="figma__share">Поділитися</span>
      </div>
    </div>

    <aside class="figma__panel figma__panel--left">
      <p class="figma__heading">Шари</p>
      <p class="figma__layer figma__layer--frame"><i class="ico ico--frame" />Перший екран</p>
      <p
        v-for="(l, i) in LAYERS.slice().reverse()"
        :key="l.name"
        class="figma__layer"
        :class="{ 'is-selected': LAYERS.length - 1 - i === layer }"
      >
        <i class="ico" :class="'ico--' + l.kind" />{{ l.name }}
      </p>
    </aside>

    <div class="figma__canvas">
      <p
        class="figma__frame-name"
        :style="{ left: frameRect.x + 'px', top: frameRect.y - 22 + 'px' }"
      >
        Перший екран · {{ DESIGN_W }} × {{ DESIGN_H }}
      </p>
      <div
        ref="frameHost"
        class="figma__frame"
        :style="{
          width: DESIGN_W + 'px',
          height: DESIGN_H + 'px',
          transform: `translate(${frameRect.x}px, ${frameRect.y}px) scale(${frameRect.s})`,
        }"
      >
        <SiteHero :grid-tint="current.kind === 'grid' ? 1 : 0" />
      </div>
      <div
        class="figma__selection"
        :style="{
          left: selection.left + 'px',
          top: selection.top + 'px',
          width: selection.width + 'px',
          height: selection.height + 'px',
        }"
      >
        <i class="h h--tl" /><i class="h h--tr" /><i class="h h--br" /><i class="h h--bl" />
        <span class="figma__size">{{ sizeLabel }}</span>
      </div>
    </div>

    <aside class="figma__panel figma__panel--right">
      <p class="figma__heading">{{ current.name }}</p>
      <div class="figma__props">
        <span>X</span><b>{{ Math.round(box.x) }}</b>
        <span>Y</span><b>{{ Math.round(box.y) }}</b>
        <span>W</span><b>{{ Math.round(box.w) }}</b>
        <span>H</span><b>{{ Math.round(box.h) }}</b>
      </div>
      <p class="figma__heading">Заповнення</p>
      <div class="figma__fill"><i style="background: #0b0a08" />0B0A08</div>
      <div class="figma__fill"><i style="background: #efe9df" />EFE9DF</div>
      <div class="figma__fill"><i style="background: #d9a45e" />D9A45E</div>
      <p class="figma__heading">Текст</p>
      <p class="figma__muted">Spectral · ExtraLight Italic</p>
      <p class="figma__muted">Jost · Light</p>
    </aside>
  </div>
</template>

<style scoped>
.figma {
  position: relative;
  display: grid;
  background: #1e1e1e;
  color: #e6e6e6;
  font: 400 12px / 1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
  overflow: hidden;
}

.figma__bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: #2c2c2c;
  border-bottom: 1px solid #383838;
}

.figma__tools {
  display: flex;
  gap: 6px;
}

.tool {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: #383838;
}

.tool.is-active {
  background: #0d99ff;
}

.figma__file {
  margin: 0;
  color: #fff;
}

.figma__file span {
  color: #9a9a9a;
}

.figma__right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.figma__zoom {
  color: #b3b3b3;
}

.figma__share {
  padding: 6px 12px;
  border-radius: 5px;
  background: #0d99ff;
  color: #fff;
  font-weight: 500;
}

.figma__panel {
  padding: 10px 0;
  background: #2c2c2c;
  overflow: hidden;
}

.figma__panel--left {
  border-right: 1px solid #383838;
}

.figma__panel--right {
  border-left: 1px solid #383838;
}

.figma__heading {
  margin: 10px 0 6px;
  padding: 0 16px;
  font-weight: 600;
  color: #fff;
}

.figma__layer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 5px 16px 5px 34px;
  color: #d0d0d0;
}

.figma__layer--frame {
  padding-left: 16px;
  color: #fff;
  font-weight: 500;
}

.figma__layer.is-selected {
  background: rgba(13, 153, 255, 0.28);
  color: #fff;
}

.ico {
  display: inline-block;
  flex: none;
  width: 11px;
  height: 11px;
  border: 1.5px solid #9a9a9a;
}

.ico--frame {
  border-style: dashed;
}

.ico--text {
  border: 0;
  border-top: 2px solid #9a9a9a;
  height: 9px;
  background: linear-gradient(#9a9a9a, #9a9a9a) center / 2px 100% no-repeat;
}

.ico--grid {
  background: linear-gradient(90deg, transparent 45%, #9a9a9a 45% 55%, transparent 55%);
}

.figma__canvas {
  position: relative;
  overflow: hidden;
}

.figma__frame-name {
  position: absolute;
  margin: 0;
  color: #9a9a9a;
  font-size: 11px;
  white-space: nowrap;
}

.figma__frame {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}

.figma__selection {
  position: absolute;
  border: 1.5px solid #0d99ff;
  transition: all 0.25s ease;
  pointer-events: none;
}

.h {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1.5px solid #0d99ff;
}

.h--tl { left: -5px; top: -5px; }
.h--tr { right: -5px; top: -5px; }
.h--br { right: -5px; bottom: -5px; }
.h--bl { left: -5px; bottom: -5px; }

.figma__size {
  position: absolute;
  left: 50%;
  bottom: -26px;
  transform: translateX(-50%);
  padding: 2px 6px;
  border-radius: 3px;
  background: #0d99ff;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
}

.figma__props {
  display: grid;
  grid-template-columns: 16px 1fr 16px 1fr;
  gap: 8px 6px;
  padding: 0 16px;
  color: #9a9a9a;
}

.figma__props b {
  font-weight: 400;
  color: #fff;
}

.figma__fill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
}

.figma__fill i {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.figma__muted {
  margin: 0;
  padding: 3px 16px;
  color: #b3b3b3;
}
</style>
