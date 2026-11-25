<script setup>
// First screen: "from sketch to phone". One locked-off desk photo, scroll drives
// the frames, the live HTML pinned onto both screens, and the final zoom into a screen.
// Timeline and frames: docs/storyboard.md.
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHero from './SiteHero.vue'
import LaptopScreen from './screens/LaptopScreen.vue'
import { FRAME, LAPTOP, PHONE, SHEET, FOCUS, GLOW, DESIGN } from '../scene/geometry.js'
import { quadToQuad, rectToQuad, toCss } from '../lib/homography.js'
import { ui } from '../state.js'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

const props = defineProps({
  reduced: { type: Boolean, default: false },
})

// Fractions of the pinned scroll.
const T = {
  sketch: [0.08, 0.3], // K1 -> K2: the sketch appears on the sheet
  push: [0.36, 0.45], // the camera moves in on the laptop for Figma and code…
  pull: [0.72, 0.79], // …and back out for the hand with the phone
  wake: [0.4, 0.46], // laptop screen wakes up with Figma
  figma: [0.46, 0.56], // layers get selected one by one
  code: [0.56, 0.74], // Figma gives way to the editor, the component is typed (code-timeline.js)
  live: [0.74, 0.81], // K2 -> K5: hand with the phone; the laptop switches to the browser
  zoom: [0.86, 0.985], // the screen fills the browser
  final: [0.975, 1], // hand over to the real page
}
const SCROLL_SCREENS = 6
const STATIC_P = 0.84 // the calm version shows this moment without scrolling

const CHAPTERS = [
  { at: [0.08, 0.4], n: '01', title: 'Ескіз', text: 'Спершу олівець і чистий аркуш.' },
  { at: [0.4, 0.58], n: '02', title: 'Макет', text: 'Той самий екран у Figma, до пікселя.' },
  { at: [0.58, 0.74], n: '03', title: 'Код', text: 'Макет стає Vue-компонентом.' },
  { at: [0.74, 0.88], n: '04', title: 'Живе', text: 'Сторінка, яку ви зараз гортаєте.' },
]

const root = ref(null)
const stage = ref(null)
const k2 = ref(null)
const k5 = ref(null)
const glow = ref(null)
const laptopEl = ref(null)
const phoneEl = ref(null)
const scrims = ref(null)
const finalEl = ref(null)

const vp = reactive({ w: window.innerWidth, h: window.innerHeight })
const portrait = computed(() => vp.w < vp.h)
// The screen we zoom into gets the viewport's size: at the end of the zoom
// it maps 1:1 onto the browser, so the hand-over to the real page is invisible.
const laptopSize = computed(() => (portrait.value ? DESIGN.laptop : { w: vp.w, h: vp.h }))
const phoneSize = computed(() => (portrait.value ? { w: vp.w, h: vp.h } : DESIGN.phone))

// Smallest set that stays sharp at the closest camera position.
const frameSet = computed(() => {
  const need = FRAME.w * closeUpScale() * (window.devicePixelRatio || 1)
  return need <= 960 ? 960 : need <= 1920 ? 1920 : 2736
})
const frameSrc = (name) => `${import.meta.env.BASE_URL}frames/${frameSet.value}/${name}.webp`

const glowStyle = {
  left: `${GLOW.x}px`,
  top: `${GLOW.y}px`,
  width: `${GLOW.w}px`,
  height: `${GLOW.h}px`,
}

const screen = reactive({ layer: 0, codeT: 0, liveIn: 0 })
const FIGMA_LAYERS = 6
const caps = reactive({ intro: 1, chapters: CHAPTERS.map(() => 0) })

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const seg = (p, [a, b]) => clamp01((p - a) / (b - a))
const lerp = (a, b, t) => a + (b - a) * t
const fade = (p, [a, b], d = 0.02) => Math.min(seg(p, [a, a + d]), 1 - seg(p, [b - d, b]))
const inOut = gsap.parseEase('power2.inOut')
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// Sketch reveal: a soft edge that travels down the sheet. Outside the sheet
// K1 and K2 are pixel-identical, so the mask only shows on the paper.
const sheetTop = mid(SHEET.tl, SHEET.tr)
const sheetBottom = mid(SHEET.bl, SHEET.br)
const angle = Math.atan2(sheetBottom[0] - sheetTop[0], -(sheetBottom[1] - sheetTop[1]))
const dir = [Math.sin(angle), -Math.cos(angle)]
const lineLength = Math.abs(FRAME.w * Math.sin(angle)) + Math.abs(FRAME.h * Math.cos(angle))
const along = ([x, y]) => (x - FRAME.w / 2) * dir[0] + (y - FRAME.h / 2) * dir[1] + lineLength / 2
const sheetSpan = [SHEET.tl, SHEET.tr, SHEET.br, SHEET.bl].map(along)
const revealFrom = Math.min(...sheetSpan)
const revealTo = Math.max(...sheetSpan)
const FEATHER = 120
const angleDeg = (angle * 180) / Math.PI

function sketchMask(t) {
  const edge = lerp(revealFrom, revealTo + FEATHER, t)
  return `linear-gradient(${angleDeg}deg, #000 ${edge - FEATHER}px, transparent ${edge}px)`
}

// Portrait screens see a slice of the frame: the camera pans sheet -> laptop -> phone.
function focusX(p) {
  if (!portrait.value) return null
  const x = lerp(FOCUS.sheet, FOCUS.laptop, inOut(seg(p, [0.34, 0.44])))
  return lerp(x, FOCUS.phone, inOut(seg(p, [0.72, 0.82])))
}

// Frame -> viewport, "cover" fit.
function coverMap(fx) {
  const s = Math.max(vp.w / FRAME.w, vp.h / FRAME.h)
  let tx = (vp.w - FRAME.w * s) / 2
  if (fx != null) tx = Math.min(0, Math.max(vp.w - FRAME.w * s, vp.w / 2 - fx * s))
  const ty = (vp.h - FRAME.h * s) / 2
  return ([x, y]) => [x * s + tx, y * s + ty]
}

// Close-up on the laptop for chapters 02–03: a plain zoom (scale + move, no warping),
// the screen about 46% of the viewport wide, the photo still covering every edge.
// There is little wall above the laptop, so on wide screens it sits in the upper half.
const CLOSE = {
  landscape: { width: 0.46, x: 0.58, y: 0.5 },
  portrait: { width: 0.96, x: 0.5, y: 0.42 },
}
const LAPTOP_TOP = Math.hypot(LAPTOP[1][0] - LAPTOP[0][0], LAPTOP[1][1] - LAPTOP[0][1])
const LAPTOP_CENTRE = [
  LAPTOP.reduce((s, p) => s + p[0], 0) / 4,
  LAPTOP.reduce((s, p) => s + p[1], 0) / 4,
]

function closeUpScale() {
  const c = portrait.value ? CLOSE.portrait : CLOSE.landscape
  return Math.max(vp.w / FRAME.w, vp.h / FRAME.h, (vp.w * c.width) / LAPTOP_TOP)
}

function closeUpMap() {
  const c = portrait.value ? CLOSE.portrait : CLOSE.landscape
  const k = closeUpScale()
  const tx = Math.min(0, Math.max(vp.w - FRAME.w * k, vp.w * c.x - LAPTOP_CENTRE[0] * k))
  const ty = Math.min(0, Math.max(vp.h - FRAME.h * k, vp.h * c.y - LAPTOP_CENTRE[1] * k))
  return ([x, y]) => [x * k + tx, y * k + ty]
}

const pushAt = (p) => inOut(seg(p, T.push)) * (1 - inOut(seg(p, T.pull)))

// Where the camera is: between the whole desk and the laptop close-up.
function cameraMap(p) {
  const wide = coverMap(focusX(p))
  const push = props.reduced ? 0 : pushAt(p)
  if (push === 0) return wide
  const close = closeUpMap()
  return (pt) => {
    const [ax, ay] = wide(pt)
    const [bx, by] = close(pt)
    return [lerp(ax, bx, push), lerp(ay, by, push)]
  }
}

const state = { p: 0 }
let tween = null

// Dev only, for reviewing single moments: ?p=0.65 freezes the scene there,
// &screen shows the laptop screen full-size. window.__scene.freeze(p, screen) /
// .release() do the same without a reload. Stripped from production builds.
const debug = { p: null, screen: false }
if (import.meta.env.DEV) {
  const q = new URLSearchParams(window.location.search)
  if (q.has('p')) debug.p = Number(q.get('p'))
  debug.screen = q.has('screen')
  window.__scene = {
    freeze(p, screen = false) {
      debug.p = p
      debug.screen = screen
      render(p)
    },
    release() {
      debug.p = null
      debug.screen = false
      render(state.p)
    },
  }
}

function render(rawP) {
  if (!stage.value || !k2.value || !laptopEl.value) return
  const p = debug.p ?? rawP
  const zoomT = debug.screen ? 1 : props.reduced ? 0 : inOut(seg(p, T.zoom))

  // The whole stage (photo + screens) is one projective transform: it takes the
  // target screen from where "cover" puts it to the full viewport.
  const target = portrait.value && !debug.screen ? PHONE : LAPTOP
  const map = cameraMap(p)
  const view = [[0, 0], [vp.w, 0], [vp.w, vp.h], [0, vp.h]]
  const quad = target.map((pt, i) => {
    const [x, y] = map(pt)
    return [lerp(x, view[i][0], zoomT), lerp(y, view[i][1], zoomT)]
  })
  stage.value.style.transform = toCss(quadToQuad(target, quad))

  const mask = sketchMask(seg(p, T.sketch))
  k2.value.style.webkitMaskImage = mask
  k2.value.style.maskImage = mask
  k5.value.style.opacity = seg(p, T.live)

  const wake = seg(p, T.wake)
  laptopEl.value.style.opacity = wake
  laptopEl.value.style.setProperty('--glare', 1 - zoomT)
  phoneEl.value.style.opacity = seg(p, T.live)
  phoneEl.value.style.setProperty('--glare', 1 - zoomT)

  screen.layer = Math.min(FIGMA_LAYERS - 1, Math.floor(seg(p, T.figma) * FIGMA_LAYERS))
  screen.codeT = seg(p, T.code)
  screen.liveIn = seg(p, T.live)
  glow.value.style.opacity = wake * lerp(0.5, 1, screen.liveIn) * (1 - zoomT)

  scrims.value.style.opacity = 1 - zoomT
  if (props.reduced) {
    caps.intro = 1
    caps.chapters.fill(0)
  } else {
    caps.intro = 1 - seg(p, [0.03, 0.075])
    CHAPTERS.forEach((c, i) => {
      caps.chapters[i] = fade(p, c.at) * (1 - zoomT)
    })
    // The fixed header steps aside during the zoom; the page on the screen
    // carries its own nav, which lands exactly where the header reappears.
    // It also steps aside in the laptop close-up, where it would sit on the screen.
    ui.headerTone = zoomT > 0.5 ? 'dark' : 'light'
    const away = Math.max(pushAt(p), seg(p, [T.zoom[0], T.zoom[0] + 0.025]))
    ui.headerOpacity = clamp01(1 - away + seg(p, T.final))
    if (debug.screen) ui.headerOpacity = 0
  }

  if (finalEl.value) {
    const f = seg(p, T.final)
    finalEl.value.style.opacity = f
    finalEl.value.style.pointerEvents = f > 0.99 ? 'auto' : 'none'
  }
}

async function layout() {
  if (!root.value) return
  vp.w = root.value.clientWidth
  vp.h = root.value.clientHeight
  await nextTick()
  // the component may have been unmounted while we waited (hot reload, route change)
  if (!laptopEl.value || !phoneEl.value) return
  const L = laptopSize.value
  const P = phoneSize.value
  Object.assign(laptopEl.value.style, {
    width: `${L.w}px`,
    height: `${L.h}px`,
    transform: toCss(rectToQuad(L.w, L.h, LAPTOP)),
  })
  Object.assign(phoneEl.value.style, {
    width: `${P.w}px`,
    height: `${P.h}px`,
    borderRadius: `${Math.round(P.w * 0.12)}px`,
    transform: toCss(rectToQuad(P.w, P.h, PHONE)),
  })
  render(props.reduced ? STATIC_P : state.p)
}

let resizeTimer = 0
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(layout, 120)
}

onMounted(async () => {
  await layout()
  if (!props.reduced) {
    tween = gsap.fromTo(
      state,
      { p: 0 },
      {
        p: 1,
        ease: 'none',
        onUpdate: () => render(state.p),
        scrollTrigger: {
          trigger: root.value,
          start: 'top top',
          end: () => `+=${window.innerHeight * SCROLL_SCREENS}`,
          pin: true,
          scrub: 0.6,
        },
      },
    )
  }
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', onResize)
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<template>
  <section ref="root" class="scene" aria-label="Від ескізу до живої сторінки">
    <div
      ref="stage"
      class="stage"
      :style="{ width: FRAME.w + 'px', height: FRAME.h + 'px' }"
      aria-hidden="true"
    >
      <img class="frame" :src="frameSrc('k1')" alt="" decoding="async" />
      <img ref="k2" class="frame" :src="frameSrc('k2')" alt="" decoding="async" />
      <img ref="k5" class="frame frame--k5" :src="frameSrc('k5')" alt="" decoding="async" />
      <div ref="glow" class="glow" :style="glowStyle" />
      <div ref="laptopEl" class="screen" inert>
        <LaptopScreen
          :w="laptopSize.w"
          :h="laptopSize.h"
          :layer="screen.layer"
          :code-t="screen.codeT"
          :live-in="screen.liveIn"
        />
      </div>
      <div ref="phoneEl" class="screen screen--phone" inert>
        <SiteHero />
      </div>
    </div>

    <div ref="scrims" class="scene__scrims" aria-hidden="true">
      <div class="scrim scrim--top" />
      <div class="scrim scrim--bottom" />
    </div>

    <div class="scene__captions">
      <div class="cap" :style="{ opacity: caps.intro }">
        <p class="cap__n">MokusM</p>
        <p class="cap__title">Фронтенд-розробник</p>
        <p class="cap__text">Промо-сторінки з анімаціями. У верстці з 2016 року.</p>
        <p class="cap__hint">Гортайте — покажу, як ескіз стає сторінкою</p>
      </div>
      <div
        v-for="(c, i) in CHAPTERS"
        :key="c.n"
        class="cap"
        :style="{ opacity: caps.chapters[i] }"
        :aria-hidden="caps.chapters[i] < 0.5"
      >
        <p class="cap__n">{{ c.n }} — {{ c.title }}</p>
        <p class="cap__text">{{ c.text }}</p>
      </div>
    </div>

    <div v-if="!reduced" ref="finalEl" class="scene__final">
      <SiteHero :with-nav="false" />
    </div>
  </section>
</template>

<style scoped>
.scene {
  position: relative;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
  background: var(--night);
  color: var(--paper);
}

.stage {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
}

.frame--k5 {
  opacity: 0;
}

.glow {
  position: absolute;
  background: radial-gradient(closest-side, rgba(196, 212, 240, 0.36), rgba(196, 212, 240, 0));
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
}

.screen {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  transform-origin: 0 0;
  opacity: 0;
  backface-visibility: hidden;
}

/* faint glass reflection, gone by the end of the zoom */
.screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(118deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0) 42%);
  opacity: var(--glare, 1);
  pointer-events: none;
}

.screen--phone {
  background: #000;
}

.scene__scrims {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scrim {
  position: absolute;
  left: 0;
  right: 0;
}

/* Landscape: captions sit top-left over the dark window, away from the sheet,
   the laptop and the hand. Portrait: at the bottom, as the camera pans. */
.scrim--top {
  top: 0;
  height: 70vh;
  background:
    radial-gradient(90% 100% at 0% 0%, rgba(8, 7, 6, 0.6), rgba(8, 7, 6, 0) 62%),
    linear-gradient(rgba(8, 7, 6, 0.45), rgba(8, 7, 6, 0) 32%);
}

.scrim--bottom {
  display: none;
  bottom: 0;
  height: 46vh;
  background: linear-gradient(rgba(8, 7, 6, 0), rgba(8, 7, 6, 0.66));
}

.scene__captions {
  position: absolute;
  top: clamp(88px, 16vh, 170px);
  left: max(16px, 4vw);
  right: max(16px, 4vw);
  pointer-events: none;
}

/* narrow enough to stay left of the laptop screen in the close-up */
.cap {
  position: absolute;
  left: 0;
  top: 0;
  max-width: min(34rem, 24vw);
}

@media (orientation: portrait) {
  .scrim--top {
    height: 24vh;
    background: linear-gradient(rgba(8, 7, 6, 0.55), rgba(8, 7, 6, 0));
  }

  .scrim--bottom {
    display: block;
  }

  .scene__captions {
    top: auto;
    bottom: max(28px, 7vh);
  }

  .cap {
    top: auto;
    bottom: 0;
    max-width: 34rem;
  }
}

.cap p {
  margin: 0;
}

.cap__n {
  font: 500 12px / 1 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.8;
}

.cap__title {
  margin-top: 0.3em !important;
  font: 500 clamp(36px, 4.4vw, 68px) / 1 var(--serif-display);
}

.cap__text {
  margin-top: 0.7em !important;
  font: 400 clamp(15px, 1.25vw, 19px) / 1.5 var(--serif-text);
  opacity: 0.88;
}

.cap__hint {
  margin-top: 1.6em !important;
  font: 500 11px / 1.4 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.6;
}

.scene__final {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
