<script setup>
// The laptop as a row of full-screen apps: Figma (02) -> editor (03) -> browser with
// the live page (04). Moving between them slides like switching spaces on a Mac.
import { computed } from 'vue'
import ScreenFigma from './ScreenFigma.vue'
import ScreenCode from './ScreenCode.vue'
import FigmaPip from './FigmaPip.vue'
import SiteHero from '../SiteHero.vue'
import { codeTimeline, inOut } from './code-timeline.js'
import { CODE_TEXT, chunkAt } from './hero-code.js'

const props = defineProps({
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  layer: { type: Number, default: 0 }, // selected Figma layer in chapter 02
  codeT: { type: Number, default: 0 }, // chapter 03 progress, 0..1
  liveIn: { type: Number, default: 0 }, // chapter 04, 0..1
})

// Figma and the editor run "zoomed in": laid out 1280px wide, scaled up to the
// screen, so their text stays readable on a laptop seen from across the desk.
// The browser keeps the real size: at the end of the zoom it maps 1:1 onto the window.
const UI_W = 1280
const ui = computed(() => {
  const s = props.w / UI_W
  return { s, w: UI_W, h: Math.round(props.h / s) }
})

const tl = computed(() => codeTimeline(props.codeT))
const pos = computed(() => tl.value.slide + inOut(props.liveIn)) // 0 Figma, 1 editor, 2 browser
const gap = computed(() => Math.round(props.w * 0.04))
const appStyle = (i) => ({
  transform: `translateX(${(i - pos.value) * (props.w + gap.value)}px)`,
})
const near = (i) => Math.abs(i - pos.value) < 1

const chars = computed(() => Math.round(tl.value.typed * CODE_TEXT.length))
const active = computed(() => chunkAt(chars.value))
</script>

<template>
  <div class="laptop-screen" :style="{ width: w + 'px', height: h + 'px' }">
    <div v-show="near(0)" class="app" :style="appStyle(0)">
      <div
        class="app__ui"
        :style="{ width: ui.w + 'px', height: ui.h + 'px', transform: `scale(${ui.s})` }"
      >
        <ScreenFigma :w="ui.w" :h="ui.h" :layer="layer" />
      </div>
    </div>

    <div v-show="near(1)" class="app" :style="appStyle(1)">
      <div
        class="app__ui"
        :style="{ width: ui.w + 'px', height: ui.h + 'px', transform: `scale(${ui.s})` }"
      >
        <ScreenCode :w="ui.w" :h="ui.h" :chars="chars">
          <FigmaPip :active="active" :visible="tl.pip && liveIn === 0" />
        </ScreenCode>
      </div>
    </div>

    <div v-show="near(2)" class="app" :style="appStyle(2)">
      <SiteHero />
    </div>
  </div>
</template>

<style scoped>
.laptop-screen {
  position: relative;
  overflow: hidden;
  background: #0b0b0c;
}

.app {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.app__ui {
  transform-origin: 0 0;
}
</style>
