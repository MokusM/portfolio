// Which case is open: the hash #/cases/<slug>, so a case can be linked to directly.
// Opening from the page adds one history entry (Back closes the case); moving to the
// next case replaces it, so Back still returns to the list in one step.
import { reactive } from 'vue'
import { CASES, findCase } from '../content/cases.js'

const PREFIX = '#/cases/'

export const route = reactive({ slug: null })

// true when this page opened the case itself, so closing can go Back instead of
// leaving a dead history entry; false for a link opened straight into a case
let pushed = false

function read() {
  const h = window.location.hash
  const slug = h.startsWith(PREFIX) ? decodeURIComponent(h.slice(PREFIX.length)) : null
  route.slug = slug && findCase(slug) >= 0 ? slug : null
  if (!route.slug) pushed = false
}

if (typeof window !== 'undefined') {
  read()
  window.addEventListener('hashchange', read)
}

export const caseHref = (slug) => PREFIX + slug

export function openCase(slug) {
  if (route.slug) {
    window.location.replace(PREFIX + slug)
  } else {
    pushed = true
    window.location.hash = PREFIX + slug
  }
}

export function closeCase() {
  if (!route.slug) return
  if (pushed) {
    window.history.back()
    return
  }
  // opened from a link: drop the hash without jumping, land on the list
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  route.slug = null
  document.getElementById('cases')?.scrollIntoView()
}

export function nextSlug(slug) {
  const i = findCase(slug)
  return CASES[(i + 1) % CASES.length].slug
}
