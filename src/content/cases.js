// Cases shown on the page (CasesSection) and opened at #/cases/<slug> (CasePage).
// Media live in public/cases/<slug>/.
//
// A case:
//   slug       — part of the link, latin letters and dashes: #/cases/eco-torf
//   title      — project name
//   summary    — one line: what it is and why it is interesting
//   type       — kind of page: промо-сторінка, лендинг, спецпроєкт…
//   client, year, role — '' hides the field
//   stack      — list of technologies, shown as plain text
//   url        — live site, optional ('' hides the link)
//   cover      — media for the list and the top of the case page; `thumb` — a small copy
//                for the strip at the bottom of the first screen
//   blocks     — the case page body, in order:
//                { kind: 'text', title, text, list? }   text paragraph(s); list — bullet points
//                { kind: 'media', items: [media, …] }   one item — full width, two or three — in a row
//   placeholder — true for a case still to be written: the first screen shows "скоро"
//
// A media item: { src, kind: 'image' | 'video', poster, alt, ratio, hint }
//   src    — path inside public/, e.g. 'cases/eco-torf/cover.webp'; empty — a placeholder frame
//   kind   — 'video' plays muted in a loop while on screen (mp4/webm, ~6–10 s), poster is its still
//   ratio  — CSS aspect-ratio of the frame, e.g. '16 / 10'
//   hint   — what goes there; shown only on the placeholder frame
//
// Screenshots of a live site: scripts/capture-site.mjs (desktop 1440 × 900 and phone
// 390 × 844 at chosen scroll positions), then WebP — cover/screen 1600 px wide,
// thumb 640, phone shots 780.

// The three below are older jQuery landing pages, to be rebuilt on the current stack
// later. The texts are drafts from what the pages show — check them. Years: Эко Торф and
// M3 Opt from the copyright in their footers; the webinar has none, 2020 is an estimate
// (same toolkit and SCSS layout as Эко Торф).

const DESKTOP = '16 / 10'
const PHONE = '390 / 844'

function media(slug, name, alt, ratio = DESKTOP) {
  return { src: `cases/${slug}/${name}.webp`, alt, ratio }
}

function phones(slug, alts) {
  return { kind: 'media', items: alts.map((alt, i) => media(slug, `mobile-${i + 1}`, alt, PHONE)) }
}

export const CASES = [
  {
    slug: 'eco-torf',
    title: 'Эко Торф',
    summary:
      'Лендинг постачальника паливних брикетів з торфу: порівняння з газом, дровами й вугіллям, фасовки з цінами, відгуки й питання.',
    type: 'Лендинг',
    client: '',
    year: '2020',
    role: 'Верстка з макета, анімації',
    stack: ['HTML', 'SCSS', 'jQuery', 'AOS', 'Slick'],
    url: 'https://mokusm.github.io/pr/ecotorf/',
    cover: { ...media('eco-torf', 'cover', 'Перший екран: брикети з торфу, вантажівка'), thumb: 'cases/eco-torf/thumb.webp' },
    blocks: [
      {
        kind: 'text',
        title: 'Задача',
        text: 'Односторінковий сайт для продажу торф’яних брикетів по Україні: пояснити, чим брикети вигідні, показати фасовки з цінами й зібрати заявки.',
      },
      {
        kind: 'media',
        items: [media('eco-torf', 'screen', 'Інфографіка: одна тонна брикетів замінює 500 м³ газу, 7 м³ дров або 700 кг вугілля')],
      },
      {
        kind: 'text',
        title: 'Що зроблено',
        text: 'Верстка з макета на темному тлі з яскравими акцентами, блоки з’являються під час прокрутки.',
        list: [
          'Інфографіка «одна тонна брикетів замінює» з круговими показниками для газу, дров і вугілля',
          'Каталог фасовок з перемиканням (мішок, термопак, біг-бег, навал) і характеристиками',
          'Слайдери товарів і відгуків, розгортні питання, форми з маскою телефону й перевіркою',
          'Адаптив під телефон',
        ],
      },
      phones('eco-torf', ['Телефон: перший екран', 'Телефон: інфографіка', 'Телефон: фасовки']),
    ],
  },
  {
    slug: 'm3-opt',
    title: 'M3 Opt',
    summary:
      'Лендинг продажу цементу оптом і в роздріб: ціни, карта портів відвантаження, марки цементу й плавна прокрутка з паралаксом.',
    type: 'Лендинг',
    client: '',
    year: '2021',
    role: 'Верстка з макета, анімації',
    stack: ['HTML', 'SCSS', 'jQuery', 'Locomotive Scroll', 'Slick'],
    url: 'https://mokusm.github.io/pr/m3opt/',
    cover: { ...media('m3-opt', 'cover', 'Перший екран: об’ємний логотип M3 OPT і кельма з цементом'), thumb: 'cases/m3-opt/thumb.webp' },
    blocks: [
      {
        kind: 'text',
        title: 'Задача',
        text: 'Сайт постачальника цементу: показати умови для опту й роздробу, звідки йде відвантаження й які марки є, і привести до заявки.',
      },
      {
        kind: 'media',
        items: [media('m3-opt', 'screen', 'Блоки «Оптові продажі» й «Роздріб» з цінами')],
      },
      {
        kind: 'text',
        title: 'Що зроблено',
        text: 'Верстка з макета з плавною прокруткою й паралаксом на Locomotive Scroll.',
        list: [
          'Перший екран з об’ємним логотипом, шари якого рухаються з різною швидкістю',
          'Карта України з портами відвантаження й складами',
          'Слайдер марок цементу, відгуки, форми зворотного дзвінка',
          'Прелоадер і власна смуга прокрутки',
          'Адаптив під телефон',
        ],
      },
      phones('m3-opt', ['Телефон: перший екран', 'Телефон: опт і роздріб', 'Телефон: марки цементу']),
    ],
  },
  {
    slug: 'google-ads-webinar',
    title: 'Вебінар Google Ads',
    summary:
      'Лендинг платного вебінару з реклами в КМС Google Ads: автор, програма, кейси з цифрами, відгуки й запис з лічильником місць.',
    type: 'Лендинг вебінару',
    client: '',
    year: '2020',
    role: 'Верстка з макета, анімації',
    stack: ['HTML', 'SCSS', 'jQuery', 'GSAP', 'AOS', 'Slick'],
    url: 'https://mokusm.github.io/pr/gads/',
    cover: {
      ...media('google-ads-webinar', 'cover', 'Перший екран: «Вебінар по КМС Google Ads» і фото автора'),
      thumb: 'cases/google-ads-webinar/thumb.webp',
    },
    blocks: [
      {
        kind: 'text',
        title: 'Задача',
        text: 'Сторінка для продажу місць на вебінар: познайомити з автором, показати програму, кейси й відгуки і привести до запису.',
      },
      {
        kind: 'media',
        items: [media('google-ads-webinar', 'screen', 'Блок «Привіт!» з каскадом контурних заголовків')],
      },
      {
        kind: 'text',
        title: 'Що зроблено',
        text: 'Верстка з макета з анімаціями на GSAP і появою блоків під час прокрутки.',
        list: [
          'Великі контурні заголовки, що повторюються каскадом, і біжучий рядок',
          'Слайдери кейсів з цифрами й відгуків',
          'Лічильник вільних місць і форма запису',
          'Адаптив під телефон',
        ],
      },
      phones('google-ads-webinar', ['Телефон: перший екран', 'Телефон: про автора', 'Телефон: що ви отримаєте']),
    ],
  },
]

export const caseNumber = (i) => String(i + 1).padStart(2, '0')
export const findCase = (slug) => CASES.findIndex((c) => c.slug === slug)
