<script setup>
// The inner first screen — the film's title card. The same component sits on the laptop,
// on the phone, inside the Figma frames and as the real page after the zoom, so all
// copies match. The site reads as a film (26.11): the desk scene is the prologue, this
// is the title, the cases are the next scenes, the contacts the closing credits.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SiteNav from './SiteNav.vue'
import { CASES, caseNumber } from '../content/cases.js'
import { caseHref, openCase } from '../lib/case-route.js'
import { reducedMotion } from '../state.js'

const props = defineProps({
  withNav: { type: Boolean, default: true },
  // 0..1 — red layout-grid tint, as Figma shows a selected grid
  gridTint: { type: Number, default: 0 },
  // the real first screen, not a copy on a screen: only here things move on their own
  live: { type: Boolean, default: false },
})

// the strip at the bottom: the first three cases
const HERO_CASES = CASES.slice(0, 3)
const base = import.meta.env.BASE_URL
const cap = (c, i) => (c.placeholder ? `Кейс ${caseNumber(i)} · ${c.type}` : `${caseNumber(i)} · ${c.title}`)

// a running timecode, 24 frames a second
const FPS = 24
const tc = ref('00:00:41:12')
let tcFrame = 0
function runTimecode() {
  const start = performance.now() - (41 * FPS + 12) * (1000 / FPS)
  let last = -1
  const pad = (n) => String(n).padStart(2, '0')
  const tick = (now) => {
    const f = Math.floor(((now - start) / 1000) * FPS)
    if (f !== last) {
      last = f
      const s = Math.floor(f / FPS)
      tc.value = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % FPS)}`
    }
    tcFrame = requestAnimationFrame(tick)
  }
  tcFrame = requestAnimationFrame(tick)
}
onMounted(() => {
  if (props.live && !reducedMotion) runTimecode()
})
onBeforeUnmount(() => cancelAnimationFrame(tcFrame))

function open(e, slug) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  openCase(slug)
}
</script>

<template>
  <section class="hero" :class="{ 'hero--live': live }" :style="{ '--tint': gridTint }">
    <!-- the frame of the film between the letterbox bars: a dark card and a projector beam
         from the upper right (Higgsfield, frames/test/cinema-side-beam-2k.png) -->
    <div class="hero__film" aria-hidden="true">
      <img
        :src="`${base}frames/cinema/beam-1920.webp`"
        :srcset="`${base}frames/cinema/beam-960.webp 960w, ${base}frames/cinema/beam-1920.webp 1920w, ${base}frames/cinema/beam-2560.webp 2560w`"
        sizes="100vw"
        alt=""
        decoding="async"
      />
      <i class="hero__grain" />
    </div>
    <div class="hero__grid" aria-hidden="true">
      <span v-for="i in 12" :key="i" />
    </div>
    <SiteNav class="hero__nav" :style="{ visibility: withNav ? 'visible' : 'hidden' }" />
    <div class="hero__main">
      <p class="hero__scene">Сцена 04 — жива сторінка</p>
      <h1 class="hero__title">Мені не байдуже,<br />як рухається <em>кнопка</em></h1>
      <div class="hero__body">
        <p class="hero__lead">
          І&nbsp;куди їде заголовок, і&nbsp;як світло лягає на&nbsp;фото. Я&nbsp;фронтенд-розробник: з&nbsp;2016 року
          верстаю промо-сторінки з&nbsp;анімаціями на&nbsp;Vue&nbsp;3 і&nbsp;Nuxt, понад 60&nbsp;проєктів.
        </p>
        <div class="hero__actions">
          <a class="hero__btn hero__btn--solid" href="#cases">Дивитися кейси</a>
          <a class="hero__btn" href="#contact">Обговорити проєкт</a>
        </div>
      </div>
    </div>
    <ul class="hero__cases" aria-label="Кейси">
      <li v-for="(c, i) in HERO_CASES" :key="c.slug" class="hero__case">
        <a class="hero__case-link" :href="caseHref(c.slug)" @click="open($event, c.slug)">
          <span class="hero__case-cap">{{ cap(c, i) }}</span>
          <!-- a case without a cover is not shot yet: a slate instead of a still -->
          <span v-if="!c.cover.src" class="hero__case-img hero__slate">
            <span class="hero__slate-row">
              <span>Сцена {{ String(5 + i).padStart(2, '0') }}</span><span>Дубль 1</span>
            </span>
            <span class="hero__slate-title">Зйомка скоро</span>
            <span class="hero__slate-row"><span>{{ c.stack.join(' · ') }}</span></span>
          </span>
          <span
            v-else
            class="hero__case-img"
            :style="{ backgroundImage: `url(${base}${c.cover.thumb || c.cover.src})` }"
          />
        </a>
      </li>
    </ul>
    <div class="hero__credits" aria-hidden="true">
      <span class="hero__tc">{{ tc }}</span>
      <span class="hero__credits-mid">Портфоліо · 2026</span>
      <span>Сцена 4 / 6</span>
    </div>
  </section>
</template>

<style scoped>
/* Units: cqi = 1% of this hero's width, so every copy scales with its screen.
   Never use cqi on .hero itself — it would resolve against the parent.
   --bar (the letterbox bar) is set in base.css and resolves where it is used. */
.hero {
  container-type: inline-size;
  position: relative;
  /* its own stacking context, so the film frame (z-index -1) stays above this background */
  isolation: isolate;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
}

.hero__grid,
.hero__main,
.hero__cases {
  --pad: max(16px, 4cqi);
  --gutter: 1.5cqi;
}

/* ── the frame of the film ── */

/* a dark card with a faint warm pool under the title, the bars a shade darker still;
   the beam comes in from the upper right and fades out before the title (a mask, so it
   never sits under the text). z-index -1 puts it under the page content (.hero isolates
   its own stacking context). The content itself stays unpositioned — measureBoxes
   (screen-layout.js) needs .hero as every element's offset parent, or the selection
   frames in the Figma windows slide off. */
.hero__film {
  position: absolute;
  z-index: -1;
  inset: var(--bar) 0;
  overflow: hidden;
  background: radial-gradient(ellipse 75% 85% at 28% 46%, #1c1813 0%, #12100d 55%, #0e0d0b 100%);
}

.hero__film img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 100% 40%;
  transform-origin: 90% 10%;
  -webkit-mask-image: linear-gradient(90deg, transparent 22%, #000 64%);
  mask-image: linear-gradient(90deg, transparent 22%, #000 64%);
}

/* film grain: fine noise */
.hero__grain {
  position: absolute;
  inset: -50%;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.09;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* on the real page: the beam drifts slowly, the grain flickers, the light breathes like
   a projector lamp */
.hero--live .hero__film img {
  animation: film-drift 28s ease-in-out infinite alternate;
}

.hero--live .hero__grain {
  animation: film-grain 0.5s steps(4) infinite;
}

.hero--live .hero__film::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 70% at 28% 46%, rgba(255, 236, 205, 0.035), transparent 70%);
  animation: film-flicker 5s linear infinite;
}

@keyframes film-drift {
  from {
    transform: scale(1.02);
  }
  to {
    transform: scale(1.09) translate(-1.2%, 0.6%);
  }
}

@keyframes film-grain {
  25% {
    transform: translate(-3%, 2%);
  }
  50% {
    transform: translate(2%, -3%);
  }
  75% {
    transform: translate(-2%, -1%);
  }
}

@keyframes film-flicker {
  0%,
  100% {
    opacity: 1;
  }
  8% {
    opacity: 0.7;
  }
  12% {
    opacity: 1;
  }
  46% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
  71% {
    opacity: 0.75;
  }
  73% {
    opacity: 0.95;
  }
}

/* the 12-column layout grid: invisible on the page, tinted red when the Figma chapter
   selects it (and measured there as a layer, so it keeps its size) */
.hero__grid {
  position: absolute;
  inset: 0 var(--pad);
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: var(--gutter);
  pointer-events: none;
}

.hero__grid span {
  background: rgba(232, 64, 44, calc(0.1 * var(--tint, 0)));
  box-shadow: inset 1px 0 rgba(232, 64, 44, calc(0.35 * var(--tint, 0))),
    inset -1px 0 rgba(232, 64, 44, calc(0.35 * var(--tint, 0)));
}

/* ── the title ── */

.hero__main {
  align-self: center;
  max-width: 66cqi;
  padding: 0 var(--pad);
}

.hero__scene {
  margin: 0 0 1.6cqi;
  color: var(--accent);
  font: 400 max(10px, 0.76cqi) / 1 var(--credits);
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.hero__title {
  width: fit-content;
  margin: 0;
  font: italic 200 6.1cqi / 1.04 var(--serif-display);
  letter-spacing: -0.02em;
}

/* the emphasis in an italic title is upright */
.hero__title em {
  font-style: normal;
}

.hero__body {
  max-width: 34cqi;
  margin-top: 2.6cqi;
}

.hero__lead {
  margin: 0;
  font: 300 max(15px, 1.25cqi) / 1.6 var(--serif-text);
  opacity: 0.85;
}

.hero__actions {
  display: flex;
  gap: 2.8cqi;
  margin-top: 2.2cqi;
}

/* the buttons are underlined credits, the first one with a play mark */
.hero__btn {
  padding: 0 0 0.7cqi;
  border-bottom: 1px solid currentColor;
  color: var(--ink);
  font: 400 max(11px, 0.84cqi) / 1 var(--credits);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-decoration: none;
}

.hero__btn--solid::before {
  content: '▶';
  margin-right: 1cqi;
  color: var(--accent);
  font-size: 0.75em;
}

/* ── the cases: stills of the next scenes ── */

.hero__cases {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: var(--gutter);
  height: 9.6cqi;
  margin: 0 0 1.4cqi;
  padding: 0 var(--pad);
  list-style: none;
}

.hero__case {
  display: flex;
  flex-direction: column;
}

.hero__case-link {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.7cqi;
  text-decoration: none;
}

.hero__case-cap {
  font: 400 max(10px, 0.7cqi) / 1 var(--credits);
  letter-spacing: 0.26em;
  text-transform: uppercase;
  opacity: 0.75;
}

/* the stills stay black and white and dim, so the first screen is not a patchwork of
   the cases' own colours; a still comes to colour under the cursor */
.hero__case-img {
  flex: 1;
  border: 1px solid color-mix(in srgb, var(--ink) 26%, transparent);
  background-position: center top;
  background-size: cover;
  filter: grayscale(1) brightness(0.62) contrast(1.06);
  transition: filter 0.6s ease;
}

.hero__case-link:hover .hero__case-img,
.hero__case-link:focus-visible .hero__case-img {
  filter: none;
}

/* a slate: what will be shot here */
.hero__slate {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.9cqi 1.1cqi;
  background: rgba(7, 6, 5, 0.72);
  font: 400 max(10px, 0.66cqi) / 1 var(--credits);
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.hero__slate-row {
  display: flex;
  justify-content: space-between;
  opacity: 0.6;
}

.hero__slate-title {
  font: italic 200 max(18px, 1.9cqi) / 1 var(--serif-display);
  letter-spacing: 0;
  text-transform: none;
}

/* ── the bottom letterbox bar: timecode and credits ── */

.hero__credits {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--bar);
  padding: 0 max(16px, 4cqi);
  color: color-mix(in srgb, var(--ink) 70%, transparent);
  font: 400 max(10px, 0.74cqi) / 1 var(--credits);
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.hero__tc {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2em;
}

/* ── narrow screens (the phone) ── */

@container (max-width: 720px) {
  /* the beam comes in above the title and fades out downwards */
  .hero__film img {
    -webkit-mask-image: linear-gradient(180deg, #000 12%, transparent 58%);
    mask-image: linear-gradient(180deg, #000 12%, transparent 58%);
    object-position: 88% 50%;
  }

  .hero__main {
    max-width: none;
  }

  .hero__scene {
    margin-bottom: 4cqi;
    font-size: 10px;
  }

  .hero__title {
    /* the title in two lines on phones from 320 px, even beside a 19 px scrollbar: the
       longer line is ≈ 8.45 em wide, so it fits while 8.45 × size ≤ width − 32 px of
       padding (at 11.4 «кнопка» dropped to a third line) */
    font-size: 10.5cqi;
  }

  .hero__body {
    max-width: none;
    margin-top: 6cqi;
  }

  .hero__lead {
    font-size: 15px;
  }

  .hero__actions {
    gap: 7cqi;
    margin-top: 8cqi;
  }

  .hero__btn {
    padding: 0 0 8px;
    font-size: 11px;
  }

  .hero__cases {
    grid-template-columns: 1fr 1fr;
    height: 26cqi;
  }

  .hero__case:nth-child(3) {
    display: none;
  }

  .hero__case-cap {
    font-size: 10px;
  }

  .hero__slate {
    padding: 10px;
    font-size: 9px;
  }

  .hero__slate-title {
    font-size: 18px;
  }

  .hero__credits-mid {
    display: none;
  }

  .hero__credits {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero--live .hero__film img,
  .hero--live .hero__grain,
  .hero--live .hero__film::before {
    animation: none;
  }
}
</style>
