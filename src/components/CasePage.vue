<script setup>
// A case page: slides up over the site at #/cases/<slug> and back down on close,
// so the page underneath stays where it was. It scrolls on its own; the site behind
// is inert while it is open (App.vue). Esc, "Усі кейси" or Back close it; "Наступний"
// swaps the case in place. Content comes from src/content/cases.js.
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import CaseMedia from './CaseMedia.vue'
import { CASES, caseNumber, findCase } from '../content/cases.js'
import { route, closeCase, openCase, caseHref } from '../lib/case-route.js'
import { reducedMotion } from '../state.js'

// the case on the page; kept while the page slides away after closing
const shown = ref(route.slug ? findCase(route.slug) : 0)
const c = computed(() => CASES[shown.value])
const nextIndex = computed(() => (shown.value + 1) % CASES.length)
const next = computed(() => CASES[nextIndex.value])

const root = ref(null)
let opener = null

// a row of portrait frames (phone screenshots)
const isTall = (items) =>
  items.every((m) => {
    const [w, h] = (m.ratio || '16 / 10').split('/').map(Number)
    return w / h < 1
  })

function go(e, slug) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  openCase(slug)
}

// the header of the case comes in line by line
function reveal(delay = 0) {
  const items = root.value?.querySelectorAll('[data-reveal]')
  if (!items?.length || reducedMotion) return
  gsap.fromTo(
    items,
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay, clearProps: 'transform,opacity' },
  )
}

function focusTitle() {
  root.value?.querySelector('.case__title')?.focus({ preventScroll: true })
}

function onEnter(el, done) {
  el.scrollTop = 0
  if (reducedMotion) {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, onComplete: done })
  } else {
    gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', onComplete: done })
    reveal(0.2)
  }
  focusTitle()
}

function onLeave(el, done) {
  const finish = () => {
    done()
    opener?.focus?.({ preventScroll: true })
    opener = null
  }
  if (reducedMotion) gsap.to(el, { opacity: 0, duration: 0.2, onComplete: finish })
  else gsap.to(el, { yPercent: 100, duration: 0.55, ease: 'power3.in', onComplete: finish })
}

watch(
  () => route.slug,
  async (slug, was) => {
    if (!slug) return
    if (!was) opener = document.activeElement
    shown.value = findCase(slug)
    if (was) {
      // next case in place: back to the top, new header comes in
      root.value.scrollTop = 0
      await nextTick()
      reveal()
      focusTitle()
    }
  },
)

function onKey(e) {
  if (e.key === 'Escape' && route.slug) closeCase()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <div
      v-if="route.slug"
      ref="root"
      class="case-page"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-page-title"
      data-tone="dark"
    >
      <nav class="bar">
        <a class="bar__back" href="#cases" @click.prevent="closeCase">← Усі кейси</a>
        <span class="bar__count">{{ caseNumber(shown) }} / {{ caseNumber(CASES.length - 1) }}</span>
        <a class="bar__next" :href="caseHref(next.slug)" @click="go($event, next.slug)">Наступний →</a>
      </nav>

      <article :key="c.slug" class="case">
        <header class="case__head">
          <p class="case__eyebrow" data-reveal>Кейс {{ caseNumber(shown) }} · {{ c.type }}</p>
          <h1 id="case-page-title" class="case__title" tabindex="-1" data-reveal>{{ c.title }}</h1>
          <p class="case__summary" data-reveal>{{ c.summary }}</p>
          <dl class="case__meta" data-reveal>
            <div v-if="c.client">
              <dt>Клієнт</dt>
              <dd>{{ c.client }}</dd>
            </div>
            <div v-if="c.year">
              <dt>Рік</dt>
              <dd>{{ c.year }}</dd>
            </div>
            <div v-if="c.role">
              <dt>Роль</dt>
              <dd>{{ c.role }}</dd>
            </div>
            <div>
              <dt>Стек</dt>
              <dd>{{ c.stack.join(' / ') }}</dd>
            </div>
            <div v-if="c.url">
              <dt>Сайт</dt>
              <dd><a :href="c.url" target="_blank" rel="noopener">Відкрити ↗</a></dd>
            </div>
          </dl>
        </header>

        <CaseMedia class="case__cover" :media="c.cover" eager data-reveal />

        <template v-for="(b, k) in c.blocks" :key="k">
          <section v-if="b.kind === 'text'" class="block block--text">
            <h2 class="block__title">{{ b.title }}</h2>
            <div class="block__body">
              <p>{{ b.text }}</p>
              <ul v-if="b.list">
                <li v-for="item in b.list" :key="item">{{ item }}</li>
              </ul>
            </div>
          </section>
          <div
            v-else
            class="block block--media"
            :class="{ 'block--row': b.items.length > 1, 'block--tall': isTall(b.items) }"
            :style="{ '--cols': b.items.length }"
          >
            <CaseMedia v-for="(m, j) in b.items" :key="j" :media="m" />
          </div>
        </template>

        <a class="case__next" :href="caseHref(next.slug)" @click="go($event, next.slug)">
          <span class="case__next-cap">Наступний кейс · {{ caseNumber(nextIndex) }}</span>
          <span class="case__next-title">{{ next.title }}<span class="case__next-arrow" aria-hidden="true">→</span></span>
        </a>
      </article>
    </div>
  </Transition>
</template>

<style scoped>
.case-page {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--paper);
  color: var(--ink);
}

.bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: baseline;
  padding: 18px max(16px, 4vw) 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
  background: var(--paper);
  font: 500 11px / 1 var(--mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.bar a {
  text-decoration: none;
}

.bar__count {
  opacity: 0.55;
}

.bar__next {
  justify-self: end;
}

.case {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1.5vw;
  padding: 0 max(16px, 4vw);
}

.case > * {
  grid-column: 1 / -1;
}

.case__head {
  padding-top: clamp(56px, 9vw, 140px);
}

.case__head p {
  margin: 0;
}

.case__eyebrow,
.case__meta dt,
.block__title,
.case__next-cap {
  font: 500 11px / 1.4 var(--mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.case__eyebrow {
  opacity: 0.6;
}

.case__title {
  margin: 0.25em 0 0;
  font: 500 clamp(56px, 9vw, 150px) / 0.95 var(--serif-display);
  font-variant-numeric: lining-nums; /* "M3", not "Mз" */
  outline: none;
}

.case__summary {
  max-width: 30em;
  margin-top: 0.9em !important;
  font: 400 clamp(18px, 1.6vw, 24px) / 1.5 var(--serif-text);
  opacity: 0.8;
}

.case__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 24px 1.5vw;
  margin: clamp(40px, 5vw, 72px) 0 0;
}

.case__meta div {
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
}

.case__meta dt {
  opacity: 0.55;
}

.case__meta dd {
  margin: 8px 0 0;
  font: 400 17px / 1.4 var(--serif-text);
}

.case__cover {
  margin-top: clamp(40px, 5vw, 80px);
}

.block--text {
  display: grid;
  grid-template-columns: subgrid;
  padding: clamp(56px, 7vw, 120px) 0 0;
}

.block__title {
  grid-column: 1 / 4;
  margin: 0.45em 0 0;
  font-weight: 500;
  opacity: 0.6;
}

.block__body {
  grid-column: 4 / 11;
  font: 400 clamp(18px, 1.45vw, 22px) / 1.65 var(--serif-text);
}

.block__body p {
  max-width: 34em;
  margin: 0;
}

.block__body ul {
  max-width: 34em;
  margin: 1em 0 0;
  padding: 0;
  list-style: none;
}

.block__body li {
  padding: 0.55em 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 16%, transparent);
}

.block--media {
  margin-top: clamp(56px, 7vw, 120px);
}

.block--row {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 1.5vw;
}

/* phone screenshots: a narrower row, or three of them would be a screen and a half tall */
.case > .block--tall {
  grid-column: 3 / 11;
}

.case__next {
  display: block;
  margin-top: clamp(80px, 10vw, 160px);
  padding: clamp(28px, 3vw, 44px) 0 clamp(56px, 7vw, 110px);
  border-top: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
  text-decoration: none;
}

.case__next-cap {
  opacity: 0.6;
}

.case__next-title {
  display: block;
  margin-top: 0.3em;
  font: 500 clamp(48px, 7vw, 120px) / 1 var(--serif-display);
  font-variant-numeric: lining-nums;
}

.case__next-arrow {
  display: inline-block;
  margin-left: 0.25em;
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.case__next:hover .case__next-arrow {
  transform: translateX(0.2em);
}

@media (max-width: 759px) {
  .block--text {
    display: block;
  }

  .block__body {
    margin-top: 14px;
  }

  .block--row {
    gap: 8px;
  }

  .case > .block--tall {
    grid-column: 1 / -1;
  }

  .case__meta {
    grid-template-columns: 1fr 1fr;
  }
}

/* ───────── «Кіно»: a case is a film card (these rules override the ones above) ─────────
   Light italic titles, the labels set as tracked credits, the eyebrow in lamp amber.
   data-tone="dark" means "the page colour" (ink text on it), and the header follows it. */

.bar,
.case__eyebrow,
.case__meta dt,
.block__title,
.case__next-cap {
  font-family: var(--credits);
  font-weight: 400;
  letter-spacing: 0.28em;
}

.case__eyebrow {
  color: var(--accent);
  opacity: 1;
}

.case__title,
.case__next-title {
  font-style: italic;
  font-weight: 200;
  letter-spacing: -0.02em;
}

.case__summary,
.case__meta dd,
.block__body {
  font-weight: 300;
}

.case__next-arrow {
  color: var(--accent);
  font-style: normal;
}
</style>
