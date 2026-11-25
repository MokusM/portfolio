<script setup>
// About, skills and contacts. Facts and contacts come from the old site
// (mokusm.github.io); the skills are the current stack from the brief.
import LogoMark from './LogoMark.vue'

const FACTS = [
  { value: '2016', label: 'у верстці' },
  { value: '60+', label: 'готових проєктів' },
  { value: '2 місце', label: 'DevChallenge 11, Front-end, Pro' },
]

const SKILLS = ['Vue 3 · Nuxt', 'GSAP · ScrollTrigger', 'Pixi.js', 'SCSS · анімації CSS і SVG', 'Figma → код']

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/MokusM' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/koljamoiseiev/' },
]

const EMAIL = 'moceevmukola@gmail.com'
</script>

<template>
  <section class="contact" data-tone="light">
    <div id="about" class="contact__block contact__about">
      <p class="contact__eyebrow">Про мене</p>
      <p class="contact__lead">
        Верстаю з&nbsp;2016 року. Люблю складні макети й&nbsp;анімації, а&nbsp;в&nbsp;команді ще
        й&nbsp;навчав верстальників і&nbsp;допомагав з&nbsp;технічними питаннями.
      </p>
      <ul class="contact__facts">
        <li v-for="f in FACTS" :key="f.value">
          <b>{{ f.value }}</b>
          <span>{{ f.label }}</span>
        </li>
      </ul>
    </div>

    <div id="skills" class="contact__block">
      <p class="contact__eyebrow">Навички</p>
      <ul class="contact__skills">
        <li v-for="s in SKILLS" :key="s">{{ s }}</li>
      </ul>
    </div>

    <div id="contact" class="contact__block">
      <p class="contact__eyebrow">Контакти</p>
      <p class="contact__title">Обговорімо ваш проєкт</p>
      <a class="contact__mail" :href="`mailto:${EMAIL}`">{{ EMAIL }}</a>
      <ul class="contact__links">
        <li v-for="l in LINKS" :key="l.label">
          <a :href="l.href" target="_blank" rel="noopener">{{ l.label }}</a>
        </li>
      </ul>
    </div>

    <footer class="contact__sign">
      <div class="contact__brand">
        <LogoMark class="contact__logo" />
        <span class="contact__word">MOISEIEV</span>
      </div>
      <p>Микола Мойсеєв · фронтенд-розробник</p>
    </footer>
  </section>
</template>

<style scoped>
.contact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(48px, 5vw, 80px) clamp(32px, 4vw, 72px);
  padding: clamp(80px, 10vw, 160px) max(16px, 4vw) clamp(48px, 6vw, 88px);
  background: var(--ink);
  color: var(--paper);
}

.contact p {
  margin: 0;
}

.contact__eyebrow {
  font: 500 12px / 1 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.6;
}

.contact__lead {
  margin-top: 24px !important;
  max-width: 30em;
  font: 400 17px / 1.6 var(--serif-text);
  opacity: 0.85;
}

.contact__facts {
  display: grid;
  gap: 18px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}

.contact__facts li {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(236, 231, 222, 0.16);
}

.contact__facts b {
  min-width: 4.2em;
  font: 500 clamp(30px, 2.6vw, 40px) / 1 var(--serif-display);
}

.contact__facts span {
  font: 500 12px / 1.4 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.65;
}

.contact__skills,
.contact__links {
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.contact__skills {
  font: 500 clamp(26px, 2.4vw, 38px) / 1.3 var(--serif-display);
}

.contact__title {
  margin-top: 0.4em !important;
  font: 500 clamp(40px, 4.4vw, 72px) / 1 var(--serif-display);
}

.contact__mail {
  display: inline-block;
  margin-top: 28px;
  padding-bottom: 4px;
  border-bottom: 1px solid currentColor;
  font: 400 clamp(17px, 1.3vw, 20px) / 1.3 var(--serif-text);
  text-decoration: none;
}

.contact__links {
  display: flex;
  gap: 28px;
  font: 500 12px / 1 var(--mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contact__links a {
  text-decoration: none;
  opacity: 0.75;
}

.contact__links a:hover,
.contact__mail:hover {
  opacity: 1;
}

.contact__sign {
  grid-column: 1 / -1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-top: clamp(40px, 5vw, 72px);
  border-top: 1px solid rgba(236, 231, 222, 0.16);
}

.contact__brand {
  display: flex;
  align-items: flex-end;
  gap: clamp(14px, 1.4vw, 22px);
}

.contact__logo {
  width: auto;
  height: clamp(56px, 6vw, 96px);
}

.contact__word {
  font: 600 clamp(28px, 3.4vw, 54px) / 0.8 var(--serif-display);
  letter-spacing: 0.14em;
}

.contact__sign p {
  font: 500 12px / 1 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.55;
}
</style>
