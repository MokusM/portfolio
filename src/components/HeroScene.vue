<script setup>
// First screen: "from sketch to phone". One locked-off desk photo, scroll drives
// the frames, the live HTML pinned onto both screens, and the final zoom into a screen.
// Timeline and frames: docs/storyboard.md.
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHero from './SiteHero.vue'
import LaptopScreen from './screens/LaptopScreen.vue'
import PhoneScreen from './screens/PhoneScreen.vue'
import SketchCanvas from './SketchCanvas.vue'
import VideoScrub from './VideoScrub.vue'
import { FRAME, EXTEND, LAPTOP, PHONE, SHEET, GLOW, DESIGN } from '../scene/geometry.js'
import { quadToQuad, rectToQuad, toCss, growQuad } from '../lib/homography.js'
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
// Length of the pinned scroll, in screen heights. A swipe on a phone travels about a
// screen, so with a finger the scene takes half as long as with a mouse wheel (26.11).
const SCROLL_SCREENS = window.matchMedia('(pointer: coarse)').matches ? 3 : 6
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
// The screen we zoom into (phone on portrait screens, laptop otherwise) is as wide as
// the viewport and, at the end of the zoom, exactly its size: it maps 1:1 onto the
// browser, so the hand-over to the real page is invisible. Before that it keeps the
// shape of the glass in the photo, or the page on it would be stretched whenever the
// viewport is shaped differently (a square window in a tall phone). Its height eases
// from vp.w / glass to vp.h during the zoom; the page reflows into it (SiteHero
// spreads into extra height), never distorts.
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const glassAspect = (q) => (dist(q[0], q[1]) + dist(q[3], q[2])) / (dist(q[0], q[3]) + dist(q[1], q[2]))
// The lit glass reaches about 1 px past the measured phone edges; zoomed in, that rim
// of generated screen would show. The page covers 1.5 px more, onto the black bezel.
const RIM = 1.5
const PHONE_COVER = growQuad(PHONE, RIM)
const GLASS = { laptop: glassAspect(LAPTOP), phone: glassAspect(PHONE_COVER) } // ≈ 1.61 and 0.45
const zoomH = ref(window.innerHeight)
function zoomScreenHeight(zoomT) {
  const glass = portrait.value ? GLASS.phone : GLASS.laptop
  const aspect = glass * Math.pow(vp.w / vp.h / glass, zoomT)
  return Math.round(vp.w / aspect)
}
const laptopSize = computed(() => (portrait.value ? DESIGN.laptop : { w: vp.w, h: zoomH.value }))
const phoneSize = computed(() => (portrait.value ? { w: vp.w, h: zoomH.value } : DESIGN.phone))

// Smallest set that stays sharp at the closest camera position.
const frameSet = computed(() => {
  const closest = portrait.value ? Math.min(SHOTS.laptop().w, SHOTS.phone().w) : SHOTS.close().w
  const need = FRAME.w * (vp.w / closest) * (window.devicePixelRatio || 1)
  return need <= 960 ? 960 : need <= 1920 ? 1920 : 2736
})
const frameSrc = (name) => `${import.meta.env.BASE_URL}frames/${frameSet.value}/${name}.webp`

const stripStyle = {
  top: { top: `${-EXTEND.top}px`, height: `${EXTEND.top + EXTEND.overlap}px` },
  bottom: { top: `${FRAME.h - EXTEND.overlap}px`, height: `${EXTEND.bottom + EXTEND.overlap}px` },
}

const glowStyle = {
  left: `${GLOW.x}px`,
  top: `${GLOW.y}px`,
  width: `${GLOW.w}px`,
  height: `${GLOW.h}px`,
}

const screen = reactive({ layer: 0, codeT: 0, liveIn: 0, phoneChrome: 1 })
// stroke-by-stroke drawing (SketchCanvas); until it is ready, or without WebGL,
// the sketch comes in as a soft wipe down the sheet instead
const sketch = reactive({ t: 0, visible: true, ready: false, failed: false })
// the hand picking up the phone (VideoScrub, V3); until its frames are in, or if they
// are missing, K2 -> K5 is a plain crossfade
const hand = reactive({ t: 0, visible: false, ready: false, failed: false, load: false })
// where the phone's lit screen is in each video frame (scripts/build-video.mjs), so the
// live page rides on it while it settles in the hand; plain array, not reactive
let handPhone = []
function onHandReady(manifest) {
  handPhone = manifest?.phone ?? []
  hand.ready = true
  render(state.p)
}

function onSketchReady() {
  sketch.ready = true
  render(state.p)
}
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

// The camera is the part of the stage the viewport shows: a rectangle in frame
// pixels, { x, y, w }, its height set by the viewport's shape. A shot says what to
// frame; moving between shots interpolates the rectangle (the width geometrically,
// so a zoom feels even). The stage reaches past the photo by the wall and floor
// strips (EXTEND); a rectangle never leaves it, so the picture covers every edge.
const STAGE = { top: -EXTEND.top, bottom: FRAME.h + EXTEND.bottom }
const centreOf = (q) => [q.reduce((s, p) => s + p[0], 0) / q.length, q.reduce((s, p) => s + p[1], 0) / q.length]
const LAPTOP_TOP = Math.hypot(LAPTOP[1][0] - LAPTOP[0][0], LAPTOP[1][1] - LAPTOP[0][1])
const LAPTOP_CENTRE = centreOf(LAPTOP)
const PHONE_CENTRE = centreOf(PHONE)
const SHEET_CENTRE = centreOf([SHEET.tl, SHEET.tr, SHEET.br, SHEET.bl])

// `focus` (frame px) lands at `view` (fractions of the viewport), `width` frame px across
function shot(focus, view, width) {
  const aspect = vp.h / vp.w
  const w = Math.min(width, FRAME.w, (STAGE.bottom - STAGE.top) / aspect)
  const h = w * aspect
  return {
    x: Math.min(FRAME.w - w, Math.max(0, focus[0] - view[0] * w)),
    y: Math.min(STAGE.bottom - h, Math.max(STAGE.top, focus[1] - view[1] * h)),
    w,
  }
}

// Landscape: the whole photo, "cover" fit, then a close-up on the laptop for
// chapters 02–03 with the screen about 46% of the viewport wide. The wall strip
// lets the screen sit in the middle of the viewport, not pressed to its top.
function wideShot() {
  const aspect = vp.h / vp.w
  const w = Math.min(FRAME.w, FRAME.h / aspect)
  return { x: (FRAME.w - w) / 2, y: (FRAME.h - w * aspect) / 2, w }
}
const SHOTS = {
  close: () => shot(LAPTOP_CENTRE, [0.58, 0.5], LAPTOP_TOP / 0.46),
  // Portrait: the camera frames one thing at a time, in the upper part of the
  // screen, with the captions below it over the desk front and the floor.
  intro: () => shot([1420, 780], [0.5, 0.42], 1700), // the whole desk, as wide as fits
  sheet: () => shot(SHEET_CENTRE, [0.5, 0.4], 1080),
  laptop: () => shot(LAPTOP_CENTRE, [0.5, 0.42], LAPTOP_TOP / 0.96),
  phone: () => shot(PHONE_CENTRE, [0.5, 0.42], 920),
}

function mix(a, b, t) {
  if (t <= 0) return a
  if (t >= 1) return b
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: a.w * Math.pow(b.w / a.w, t) }
}

const pushAt = (p) => inOut(seg(p, T.push)) * (1 - inOut(seg(p, T.pull)))

function cameraRect(p) {
  if (!portrait.value) return mix(wideShot(), SHOTS.close(), props.reduced ? 0 : pushAt(p))
  let r = mix(SHOTS.intro(), SHOTS.sheet(), inOut(seg(p, [0.02, 0.1])))
  r = mix(r, SHOTS.laptop(), inOut(seg(p, T.push)))
  return mix(r, SHOTS.phone(), inOut(seg(p, [0.72, 0.8])))
}

// frame -> viewport
function cameraMap(p) {
  const r = cameraRect(p)
  const s = vp.w / r.w
  return ([x, y]) => [(x - r.x) * s, (y - r.y) * s]
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
  const screenH = zoomScreenHeight(zoomT)
  if (screenH !== zoomH.value) {
    zoomH.value = screenH
    placeScreens()
  }

  // The whole stage (photo + screens) is one projective transform: it takes the
  // target screen from where "cover" puts it to the full viewport.
  const target = portrait.value && !debug.screen ? PHONE_COVER : LAPTOP
  const map = cameraMap(p)
  const view = [[0, 0], [vp.w, 0], [vp.w, vp.h], [0, vp.h]]
  const quad = target.map((pt, i) => {
    const [x, y] = map(pt)
    return [lerp(x, view[i][0], zoomT), lerp(y, view[i][1], zoomT)]
  })
  stage.value.style.transform = toCss(quadToQuad(target, quad))

  const sketchT = seg(p, T.sketch)
  if (sketch.ready && !sketch.failed && !props.reduced) {
    // strokes drawn by the canvas; the full K2 takes over once the sketch is done
    sketch.t = sketchT
    sketch.visible = sketchT < 1
    k2.value.style.webkitMaskImage = 'none'
    k2.value.style.maskImage = 'none'
    k2.value.style.opacity = sketchT >= 1 ? 1 : 0
  } else {
    const mask = sketchMask(sketchT)
    k2.value.style.webkitMaskImage = mask
    k2.value.style.maskImage = mask
    k2.value.style.opacity = 1
  }
  const liveT = seg(p, T.live)
  if (p > 0.3) hand.load = true
  const handVideo = hand.ready && !hand.failed && !props.reduced
  if (handVideo) {
    // the video runs between the two photos: K2 before, K5 once the hand has settled
    hand.t = liveT
    hand.visible = liveT > 0 && liveT < 1
    k5.value.style.opacity = liveT >= 1 ? 1 : 0
  } else {
    k5.value.style.opacity = liveT
  }

  const wake = seg(p, T.wake)
  laptopEl.value.style.opacity = wake
  laptopEl.value.style.setProperty('--glare', 1 - zoomT)
  // During V3 the live page sits on the phone's screen as tracked in each frame and
  // lights up with it, so the generated screen never shows; afterwards it is K5's.
  const P = phoneSize.value
  const tracked =
    handVideo && liveT > 0 && liveT < 1 && handPhone.length
      ? handPhone[Math.round(liveT * (handPhone.length - 1))]
      : null
  phoneEl.value.style.transform = toCss(rectToQuad(P.w, P.h, tracked ? growQuad(tracked.quad, RIM) : PHONE_COVER))
  phoneEl.value.style.opacity = handVideo ? (liveT >= 1 || tracked ? 1 : 0) : liveT
  // a screen that is just waking up is dim, not see-through: darken, never fade,
  // so the generated screen underneath stays covered
  phoneEl.value.style.filter =
    tracked && tracked.light < 1 ? `brightness(${0.3 + 0.7 * tracked.light})` : 'none'
  phoneEl.value.style.setProperty('--glare', 1 - zoomT)
  // zooming into the phone (portrait), its status bar folds away so the screen
  // ends up exactly as the page underneath
  screen.phoneChrome = portrait.value ? 1 - seg(zoomT, [0.45, 0.9]) : 1

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
  zoomH.value = zoomScreenHeight(0)
  await nextTick()
  // the component may have been unmounted while we waited (hot reload, route change)
  if (!laptopEl.value || !phoneEl.value) return
  placeScreens()
  render(props.reduced ? STATIC_P : state.p)
}

// size both screens and pin them to their glass; render() moves the phone while it
// is tracked in the V3 video and calls this again when the zoom screen changes height
function placeScreens() {
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
    transform: toCss(rectToQuad(P.w, P.h, PHONE_COVER)),
  })
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
      <SketchCanvas
        v-if="!reduced && !sketch.failed"
        v-show="sketch.ready && sketch.visible"
        :t="sketch.t"
        @ready="onSketchReady"
        @unsupported="sketch.failed = true"
      />
      <img ref="k5" class="frame frame--k5" :src="frameSrc('k5')" alt="" decoding="async" />
      <VideoScrub
        v-if="!reduced && !hand.failed"
        v-show="hand.ready && hand.visible"
        :t="hand.t"
        :load="hand.load"
        @ready="onHandReady"
        @unsupported="hand.failed = true"
      />
      <!-- wall above and floor below the photo, over the frames and the video, whose
           edge rows they crossfade into -->
      <img class="strip" :src="frameSrc('top')" alt="" decoding="async" :style="stripStyle.top" />
      <img class="strip" :src="frameSrc('bottom')" alt="" decoding="async" :style="stripStyle.bottom" />
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
        <PhoneScreen :w="phoneSize.w" :h="phoneSize.h" :chrome="screen.phoneChrome" />
      </div>
    </div>

    <div ref="scrims" class="scene__scrims" aria-hidden="true">
      <div class="scrim scrim--top" />
      <div class="scrim scrim--bottom" />
    </div>

    <div class="scene__captions">
      <div class="cap cap--intro" :style="{ opacity: caps.intro }">
        <p class="cap__n">MOISEIEV</p>
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
      <SiteHero :with-nav="false" live />
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
  color: var(--on-photo);
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

.strip {
  position: absolute;
  left: 0;
  width: 100%;
  user-select: none;
  pointer-events: none;
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

/* the intro is on the wide shot, nothing to keep clear of */
.cap--intro {
  max-width: 48rem;
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
