<script setup>
// One nav for the fixed header and for every copy of the page on the screens,
// so at the end of the zoom they land on exactly the same pixels.
import LogoMark from './LogoMark.vue'
</script>

<template>
  <nav class="site-nav">
    <a class="site-nav__logo" href="#top" aria-label="MOISEIEV — на початок">
      <LogoMark class="site-nav__mark" />
      <span class="site-nav__word">MOISEIEV</span>
    </a>
    <ul class="site-nav__links">
      <li><a href="#cases">Кейси</a></li>
      <li><a href="#skills">Навички</a></li>
      <li><a href="#contact">Контакти</a></li>
      <li><a class="site-nav__cta" href="#contact">Написати</a></li>
    </ul>
  </nav>
</template>

<style scoped>
/* Set as film credits, in the middle of the top letterbox bar (--bar, base.css): the
   padding centres the logo line, max(13px, 0.95cqi) high, in the bar. */
.site-nav {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc((var(--bar) - 1.05 * max(13px, 0.95cqi)) / 2) max(16px, 4cqi) 0;
  font: 400 max(11px, 0.78cqi) / 1 var(--credits);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

a {
  text-decoration: none;
}

.site-nav__logo {
  display: flex;
  align-items: center;
  gap: 0.45em;
  font: 400 max(13px, 0.95cqi) / 1 var(--credits);
}

.site-nav__mark {
  width: auto;
  height: 1.05em;
}

/* wordmark in capitals, tracked wide like a film title */
.site-nav__word {
  letter-spacing: 0.4em;
}

.site-nav__links {
  display: flex;
  gap: 2.6cqi;
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-nav__cta {
  padding-bottom: 0.35em;
  border-bottom: 1px solid currentColor;
}

@container (max-width: 720px) {
  .site-nav__links li:not(:last-child) {
    display: none;
  }
}
</style>
