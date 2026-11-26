// What the code editor types in chapter 03, split into chunks by the element of the
// Figma frame each one comes from, so the mini Figma window can select the element
// whose code is being typed.
// Kept in a .js file: a closing script tag inside a .vue file would end its script block.

const SCRIPT = `
<script setup>
import { onMounted } from 'vue'
import gsap from 'gsap'

onMounted(() => {
  gsap.from('.hero__title', {
    yPercent: 40,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
  })
})
</` + `script>
`

export const CODE_CHUNKS = [
  { key: 'bg', text: '<template>\n' },
  { key: 'grid', text: '  <section class="hero">\n' },
  { key: 'nav', text: '    <SiteNav />\n' },
  {
    key: 'title',
    text: '    <h1 class="hero__title">\n      Мені не байдуже,<br />\n      як рухається кнопка\n    </h1>\n',
  },
  {
    key: 'lead',
    text:
      '    <p class="hero__lead">\n' +
      '      І куди їде заголовок, і як світло лягає на фото.\n' +
      '      Я фронтенд-розробник: з 2016 року верстаю\n' +
      '      промо-сторінки з анімаціями на Vue 3 і Nuxt.\n' +
      '    </p>\n',
  },
  {
    key: 'actions',
    text:
      '    <div class="hero__actions">\n' +
      '      <a class="btn btn--solid" href="#cases">Дивитися кейси</a>\n' +
      '      <a class="btn" href="#contact">Обговорити проєкт</a>\n' +
      '    </div>\n',
  },
  { key: 'cases', text: '    <CaseRow :count="3" />\n' },
  { key: 'grid', text: '  </section>\n' },
  { key: 'bg', text: '</template>\n' },
  { key: 'script', text: SCRIPT },
]

export const CODE_TEXT = CODE_CHUNKS.map((c) => c.text).join('')
export const CODE_LINE_COUNT = CODE_TEXT.split('\n').length - 1

// Character range of every chunk in CODE_TEXT.
export const CHUNK_RANGES = (() => {
  let from = 0
  return CODE_CHUNKS.map((c) => {
    const r = { key: c.key, from, to: from + c.text.length }
    from = r.to
    return r
  })
})()

// Which element's code is being typed after `chars` characters.
export function chunkAt(chars) {
  const i = Math.max(0, chars - 1)
  return CHUNK_RANGES.find((r) => i >= r.from && i < r.to)?.key ?? 'script'
}
