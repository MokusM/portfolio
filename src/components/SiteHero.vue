<script setup>
// The inner first screen. The same component sits on the laptop, on the phone,
// inside the Figma frames and as the real page after the zoom — so all copies match.
import SiteNav from './SiteNav.vue'
import XrayLens from './XrayLens.vue'

defineProps({
  withNav: { type: Boolean, default: true },
  // 0..1 — red layout-grid tint, as Figma shows a selected grid
  gridTint: { type: Number, default: 0 },
  // the x-ray lens easter egg — only on the real first screen, not the screen copies
  xray: { type: Boolean, default: false },
})
</script>

<template>
  <section class="hero" :class="{ 'hero--xray': xray }" :style="{ '--tint': gridTint }">
    <XrayLens v-if="xray" />
    <div class="hero__grid" aria-hidden="true">
      <span v-for="i in 12" :key="i" />
    </div>
    <SiteNav class="hero__nav" :style="{ visibility: withNav ? 'visible' : 'hidden' }" />
    <div class="hero__main">
      <h1 class="hero__title">Беру макет —<br />віддаю живу сторінку</h1>
      <div class="hero__body">
        <p class="hero__lead">
          Фронтенд-розробник. Верстаю промо-сторінки з&nbsp;анімаціями на&nbsp;Vue&nbsp;3 і&nbsp;Nuxt.
          У&nbsp;верстці з&nbsp;2016 року.
        </p>
        <div class="hero__actions">
          <a class="hero__btn hero__btn--solid" href="#cases">Дивитися кейси</a>
          <a class="hero__btn" href="#contact">Обговорити проєкт</a>
        </div>
      </div>
    </div>
    <ul class="hero__cases" aria-label="Кейси">
      <li v-for="n in 3" :key="n" class="hero__case">
        <span class="hero__case-cap">Кейс 0{{ n }} · скоро</span>
        <span class="hero__case-img" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Units: cqi = 1% of this hero's width, so every copy scales with its screen.
   Never use cqi on .hero itself — it would resolve against the parent. */
.hero {
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
}

.hero--xray {
  cursor: crosshair;
}

.hero__grid,
.hero__main,
.hero__cases {
  --pad: max(16px, 4cqi);
  --gutter: 1.5cqi;
}

.hero__grid {
  position: absolute;
  inset: 0 var(--pad);
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: var(--gutter);
  pointer-events: none;
}

.hero__grid span {
  border-inline: 1px solid rgba(26, 25, 22, 0.045);
  background: rgba(232, 64, 44, calc(0.1 * var(--tint, 0)));
  box-shadow: inset 1px 0 rgba(232, 64, 44, calc(0.35 * var(--tint, 0))),
    inset -1px 0 rgba(232, 64, 44, calc(0.35 * var(--tint, 0)));
}

.hero__main {
  align-self: center;
  padding: 0 var(--pad);
}

.hero__title {
  width: fit-content;
  margin: 0;
  font: 500 7.4cqi / 0.96 var(--serif-display);
  letter-spacing: -0.012em;
}

.hero__body {
  max-width: 42cqi;
  margin-top: 2.6cqi;
}

.hero__lead {
  margin: 0;
  font: 400 max(15px, 1.22cqi) / 1.55 var(--serif-text);
}

.hero__actions {
  display: flex;
  gap: 1cqi;
  margin-top: 2.2cqi;
}

.hero__btn {
  padding: 1.15cqi 1.7cqi;
  border: 1px solid var(--ink);
  color: var(--ink);
  font: 500 max(11px, 0.8cqi) / 1 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.hero__btn--solid {
  background: var(--ink);
  color: var(--paper);
}

.hero__cases {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: var(--gutter);
  height: 11cqi;
  margin: 0;
  padding: 0 var(--pad);
  list-style: none;
}

.hero__case {
  display: flex;
  flex-direction: column;
  gap: 0.7cqi;
}

.hero__case-cap {
  font: 500 max(10px, 0.72cqi) / 1 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}

.hero__case-img {
  flex: 1;
  border: 1px solid rgba(26, 25, 22, 0.28);
  border-bottom: 0;
  background: linear-gradient(
    to top right,
    transparent calc(50% - 0.6px),
    rgba(26, 25, 22, 0.2) 50%,
    transparent calc(50% + 0.6px)
  );
}

@container (max-width: 720px) {
  .hero__title {
    font-size: 12.6cqi;
    line-height: 1;
  }

  .hero__body {
    max-width: none;
    margin-top: 6cqi;
  }

  .hero__lead {
    font-size: 15px;
  }

  .hero__actions {
    flex-direction: column;
    gap: 10px;
    margin-top: 7cqi;
  }

  .hero__btn {
    padding: 15px 18px;
    font-size: 12px;
    text-align: center;
  }

  .hero__cases {
    grid-template-columns: 1fr 1fr;
    height: 30cqi;
  }

  .hero__case:nth-child(3) {
    display: none;
  }

  .hero__case-cap {
    font-size: 10px;
  }
}
</style>
