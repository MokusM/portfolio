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
  <!-- the closing credits sit on the page colour, so the header reads them as a paper
       section ("dark" tone: ink text on the page colour) -->
  <section class="contact" data-tone="dark">
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
  border-top: 1px solid color-mix(in srgb, var(--paper) 16%, transparent);
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
  border-top: 1px solid color-mix(in srgb, var(--paper) 16%, transparent);
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

/* ───────── «Кіно»: the closing credits (these rules override the ones above) ─────────
   Dark page, one centred column: the role on the left, the name on the right, as
   film credits are set; the contact is the last, biggest card; the logo closes it. */

.contact {
  display: block;
  padding: clamp(120px, 14vw, 220px) max(16px, 4vw) clamp(48px, 6vw, 88px);
  background: var(--paper);
  color: var(--ink);
}

.contact__block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: clamp(24px, 3vw, 48px);
  align-items: baseline;
  max-width: 920px;
  margin: 0 auto clamp(72px, 8vw, 120px);
}

.contact__block > * {
  grid-column: 2;
}

.contact__eyebrow {
  grid-column: 1;
  grid-row: 1 / span 4;
  align-self: start;
  padding-top: 0.5em;
  color: var(--accent);
  font: 400 12px / 1.4 var(--credits);
  letter-spacing: 0.32em;
  text-align: right;
  opacity: 1;
}

.contact__lead {
  margin-top: 0 !important;
  font-weight: 300;
}

.contact__facts li {
  border-top-color: color-mix(in srgb, var(--ink) 14%, transparent);
}

.contact__facts b,
.contact__skills,
.contact__title {
  font-style: italic;
  font-weight: 200;
}

.contact__facts span,
.contact__links,
.contact__sign p {
  font-family: var(--credits);
  font-weight: 400;
  letter-spacing: 0.26em;
}

.contact__skills {
  margin-top: 0;
}

/* the contact: centred, the biggest card */
#contact {
  display: block;
  text-align: center;
}

#contact .contact__eyebrow {
  padding: 0;
  text-align: center;
}

.contact__title {
  margin-top: 0.3em !important;
  font-size: clamp(48px, 6.4vw, 112px);
  letter-spacing: -0.02em;
}

.contact__mail {
  font-weight: 300;
}

.contact__links {
  justify-content: center;
}

.contact__sign {
  flex-direction: column;
  align-items: center;
  gap: 20px;
  border-top-color: color-mix(in srgb, var(--ink) 14%, transparent);
}

.contact__brand {
  align-items: center;
}

.contact__word {
  font: 400 clamp(20px, 2.2vw, 32px) / 1 var(--credits);
  letter-spacing: 0.5em;
}

.contact__logo {
  height: clamp(36px, 3.6vw, 56px);
}

@media (max-width: 640px) {
  .contact__block {
    grid-template-columns: 1fr;
  }

  .contact__block > *,
  .contact__eyebrow {
    grid-column: 1;
    grid-row: auto;
    text-align: left;
  }

  .contact__eyebrow {
    margin-bottom: 18px;
  }
}
</style>
