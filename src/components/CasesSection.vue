<script setup>
// Placeholder cases — real ones come later.
const CASES = [
  { n: '01', title: 'Кейс 01', text: 'Опис з’явиться пізніше.' },
  { n: '02', title: 'Кейс 02', text: 'Опис з’явиться пізніше.' },
  { n: '03', title: 'Кейс 03', text: 'Опис з’явиться пізніше.' },
]
</script>

<template>
  <section id="cases" class="cases" data-tone="dark">
    <header class="cases__head">
      <p class="cases__eyebrow">Кейси</p>
      <h2 class="cases__title">Що я вже зробив</h2>
      <p class="cases__intro">Понад 60 готових проєктів з&nbsp;2016 року. Тут — ті, якими пишаюся найбільше.</p>
    </header>
    <ol class="cases__list">
      <li v-for="c in CASES" :key="c.n" class="case">
        <span class="case__img" />
        <p class="case__n">{{ c.n }}</p>
        <h3 class="case__title">{{ c.title }}</h3>
        <p class="case__text">{{ c.text }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.cases {
  padding: clamp(80px, 12vw, 180px) max(16px, 4vw);
  background: var(--paper);
}

.cases__eyebrow,
.case__n {
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

.cases__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(24px, 2vw, 40px);
  margin: clamp(48px, 6vw, 96px) 0 0;
  padding: 0;
  list-style: none;
}

.case__img {
  display: block;
  aspect-ratio: 4 / 3;
  margin-bottom: 18px;
  border: 1px solid rgba(26, 25, 22, 0.28);
  background: linear-gradient(
    to top right,
    transparent calc(50% - 0.6px),
    rgba(26, 25, 22, 0.2) 50%,
    transparent calc(50% + 0.6px)
  );
}

.case__title {
  margin: 0.4em 0 0;
  font: 500 32px / 1.1 var(--serif-display);
}

.case__text {
  margin: 0.4em 0 0;
  font: 400 16px / 1.55 var(--serif-text);
  opacity: 0.75;
}
</style>
