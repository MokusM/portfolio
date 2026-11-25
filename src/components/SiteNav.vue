<script setup>
// One nav for the fixed header and for every copy of the page on the screens,
// so at the end of the zoom they land on exactly the same pixels.
</script>

<template>
  <nav class="site-nav">
    <a class="site-nav__logo" href="#top">MokusM</a>
    <ul class="site-nav__links">
      <li><a href="#cases">Кейси</a></li>
      <li><a href="#skills">Навички</a></li>
      <li><a href="#contact">Контакти</a></li>
      <li><a class="site-nav__cta" href="#contact">Написати</a></li>
    </ul>
  </nav>
</template>

<style scoped>
.site-nav {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: max(16px, 2.1cqi) max(16px, 4cqi) 0;
  font: 500 max(11px, 0.78cqi) / 1 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

a {
  text-decoration: none;
}

.site-nav__logo {
  font: 600 max(21px, 1.65cqi) / 1 var(--serif-display);
  letter-spacing: 0;
  text-transform: none;
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
