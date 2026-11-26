<script setup>
// The case index: one row per case, quick to scan — number, name, kind of page,
// stack. On wide screens a sticky preview on the right shows the case under the
// pointer, or, without a pointer (touch, keyboard, plain scrolling), the row in the
// middle of the screen; it is drawn as a selected frame in Figma, like the rest of
// the site. On narrow screens each row carries its own cover. A row opens the case
// page (CasePage, #/cases/<slug>).
import { ref, onMounted, onBeforeUnmount } from 'vue'
import CaseMedia from './CaseMedia.vue'
import { CASES, caseNumber } from '../content/cases.js'
import { caseHref, openCase } from '../lib/case-route.js'

const active = ref(0)
const hovering = ref(false)
const rows = [] // row elements by case index

function hover(i) {
  hovering.value = true
  active.value = i
}

function open(e, slug) {
  // new tab / window: let the browser follow the link, the case opens there
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  openCase(slug)
}

let io = null
onMounted(() => {
  // a thin band across the middle of the screen: the row crossing it is the active one
  io = new IntersectionObserver(
    (entries) => {
      if (hovering.value) return
      for (const e of entries) if (e.isIntersecting) active.value = rows.indexOf(e.target)
    },
    { rootMargin: '-48% 0px -48% 0px' },
  )
  rows.forEach((el) => io.observe(el))
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <section id="cases" class="cases" data-tone="dark">
    <header class="cases__head">
      <p class="cases__eyebrow">Кейси · {{ caseNumber(CASES.length - 1) }}</p>
      <h2 class="cases__title">Що я вже зробив</h2>
      <p class="cases__intro">
        Понад 60 готових проєктів з&nbsp;2016 року. Тут — ті, якими пишаюся найбільше.
      </p>
    </header>

    <div class="cases__body">
      <ol class="cases__list" :class="{ 'is-hovering': hovering }" @mouseleave="hovering = false">
        <li
          v-for="(c, i) in CASES"
          :key="c.slug"
          :ref="(el) => el && (rows[i] = el)"
          class="row"
          :class="{ 'is-active': i === active }"
        >
          <a
            class="row__link"
            :href="caseHref(c.slug)"
            @mouseenter="hover(i)"
            @focus="active = i"
            @click="open($event, c.slug)"
          >
            <CaseMedia class="row__media" :media="c.cover" />
            <span class="row__n">{{ caseNumber(i) }}</span>
            <span class="row__main">
              <span class="row__title">{{ c.title }}</span>
              <span class="row__summary">{{ c.summary }}</span>
            </span>
            <span class="row__aside">
              <span class="row__type">{{ c.type }}</span>
              <span class="row__stack">{{ c.stack.join(' / ') }}</span>
            </span>
            <span class="row__go" aria-hidden="true">→</span>
          </a>
        </li>
      </ol>

      <div class="cases__preview" aria-hidden="true">
        <div class="preview">
          <div class="preview__stage" :style="{ aspectRatio: CASES[active].cover.ratio || '16 / 10' }">
            <CaseMedia
              v-for="(c, i) in CASES"
              :key="c.slug"
              class="preview__item"
              :class="{ 'is-on': i === active }"
              :media="c.cover"
              frame
              :label="`Кейс ${caseNumber(i)} — ${c.title}`"
            />
          </div>
          <p class="preview__meta">
            {{ [CASES[active].client, CASES[active].year, CASES[active].role].filter(Boolean).join(' · ') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cases {
  padding: clamp(80px, 12vw, 180px) max(16px, 4vw);
  background: var(--paper);
}

.cases__eyebrow {
  margin: 0;
  font: 500 12px / 1 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.6;
}

.cases__title {
  margin: 0.3em 0 0;
  font: 500 clamp(44px, 6vw, 96px) / 1 var(--serif-display);
}

.cases__intro {
  max-width: 34em;
  margin: 1.2em 0 0;
  font: 400 18px / 1.55 var(--serif-text);
  opacity: 0.75;
}

.cases__body {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1.5vw;
  margin-top: clamp(48px, 6vw, 96px);
}

.cases__list {
  grid-column: 1 / 8;
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
}

.row {
  border-top: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
  transition: opacity 0.35s ease;
}

/* while the pointer is on the list, the other rows step back */
.is-hovering .row:not(.is-active) {
  opacity: 0.4;
}

.row__link {
  display: grid;
  grid-template-columns: 3.2em 1fr auto 1.4em;
  align-items: baseline;
  column-gap: 1.2vw;
  padding: clamp(22px, 2.2vw, 34px) 0;
  text-decoration: none;
}

.row__link:focus-visible {
  outline: 1px solid #0d99ff;
  outline-offset: 4px;
}

.row__media {
  display: none;
}

.row__n,
.row__type,
.row__stack {
  font: 500 11px / 1.4 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.row__n {
  opacity: 0.55;
}

.row__main {
  display: flex;
  flex-direction: column;
  gap: 0.55em;
  min-width: 0;
}

.row__title {
  font: 500 clamp(34px, 3.6vw, 60px) / 1 var(--serif-display);
  /* the display serif has old-style figures: "M3" read as "Mз" */
  font-variant-numeric: lining-nums;
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.row__summary {
  max-width: 30em;
  font: 400 15px / 1.5 var(--serif-text);
  opacity: 0.7;
}

.row__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5em;
  max-width: 15em; /* a long stack wraps instead of squeezing the name */
  text-align: right;
}

.row__stack {
  opacity: 0.55;
}

.row__go {
  justify-self: end;
  font: 400 22px / 1 var(--serif-text);
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.3s ease, transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.row.is-active .row__title {
  transform: translateX(0.35em);
}

.row.is-active .row__go {
  opacity: 1;
  transform: none;
}

/* sticky preview, vertically centred on the screen */
.cases__preview {
  grid-column: 9 / 13;
}

.preview {
  position: sticky;
  top: calc(50vh - 14vw);
  padding-top: 22px; /* room for the frame label */
}

.preview__stage {
  position: relative;
}

.preview__item {
  position: absolute;
  inset: 0;
  height: 100%;
  opacity: 0;
  transform: scale(0.985);
  transition: opacity 0.45s ease, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.preview__item.is-on {
  opacity: 1;
  transform: none;
}

.preview__meta {
  margin: 16px 0 0;
  font: 500 11px / 1.4 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.55;
}

/* narrow screens: no preview, each row carries its cover */
@media (max-width: 959px) {
  .cases__body {
    display: block;
  }

  .cases__preview {
    display: none;
  }

  .is-hovering .row:not(.is-active) {
    opacity: 1;
  }

  .row__link {
    grid-template-columns: auto 1fr;
    row-gap: 14px;
    padding: 28px 0 32px;
  }

  .row__media {
    display: block;
    grid-column: 1 / -1;
    margin-bottom: 6px;
  }

  .row__main {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  .row__aside {
    grid-column: 2;
    grid-row: 2;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.4em 1em;
  }

  .row__go {
    display: none;
  }

  .row.is-active .row__title {
    transform: none;
  }
}

/* ───────── «Кіно»: the cases are the next scenes ───────── */

.cases__eyebrow,
.row__n,
.row__type,
.row__stack,
.preview__meta {
  font-family: var(--credits);
  font-weight: 400;
  letter-spacing: 0.28em;
}

.cases__eyebrow {
  color: var(--accent);
  opacity: 1;
}

.cases__title,
.row__title {
  font-style: italic;
  font-weight: 200;
  letter-spacing: -0.02em;
}

.cases__intro,
.row__summary {
  font-weight: 300;
}

/* "Кейс 01" reads as a scene number */
.row__n::before {
  content: 'Кейс ';
}

.row__link {
  grid-template-columns: 7.5em 1fr auto 1.4em;
}

.row__go {
  color: var(--accent);
}

@media (max-width: 959px) {
  .row__link {
    grid-template-columns: auto 1fr;
  }
}
</style>
