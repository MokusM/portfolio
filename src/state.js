import { reactive } from 'vue'

// Shared UI state between the scroll scene and the fixed header.
export const ui = reactive({
  // 'light' — header over the dark photo, 'dark' — over the paper page
  headerTone: 'light',
  // hidden while zooming: the page on the screen brings its own nav into place
  headerOpacity: 1,
  // over the plain page sections the header gets their background, so text
  // scrolling under it does not collide with the nav; over the photo it stays clear
  headerSolid: false,
})

// Calm version: the OS setting, or ?calm in the address bar to preview it.
export const reducedMotion =
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(window.location.search).has('calm'))
