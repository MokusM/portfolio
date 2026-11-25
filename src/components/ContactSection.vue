<script setup>
const SKILLS = ['Vue 3', 'Nuxt', 'GSAP · ScrollTrigger', 'Pixi.js', 'Складні макети', 'Анімації']
</script>

<template>
  <section class="contact">
    <div id="skills" class="contact__block">
      <p class="contact__eyebrow">Навички</p>
      <ul class="contact__skills">
        <li v-for="s in SKILLS" :key="s">{{ s }}</li>
      </ul>
    </div>
    <div id="contact" class="contact__block">
      <p class="contact__eyebrow">Контакти</p>
      <p class="contact__title">Обговорімо ваш проєкт</p>
      <p class="contact__text">Контакти з’являться пізніше.</p>
    </div>
  </section>
</template>

<style scoped>
.contact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 64px;
  padding: clamp(80px, 10vw, 160px) max(16px, 4vw) clamp(64px, 8vw, 120px);
  background: var(--ink);
  color: var(--paper);
}

.contact__eyebrow {
  margin: 0;
  font: 500 12px / 1 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.6;
}

.contact__skills {
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  font: 500 clamp(28px, 3vw, 44px) / 1.25 var(--serif-display);
}

.contact__title {
  margin: 0.4em 0 0;
  font: 500 clamp(40px, 5vw, 80px) / 1 var(--serif-display);
}

.contact__text {
  margin: 1em 0 0;
  font: 400 17px / 1.5 var(--serif-text);
  opacity: 0.75;
}
</style>
