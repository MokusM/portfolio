// Geometry shared by the laptop screens: the Figma file, the exploded layers
// and the code editor. The layers fly from the Figma frame into exact code lines,
// so all three must agree on where things are.

export const DESIGN_W = 1440
export const DESIGN_H = 900

// Layers of the first screen, in the order Figma lists them (bottom -> top).
export const LAYERS = [
  { key: 'bg', name: 'Фон', kind: 'rect', sel: null },
  { key: 'grid', name: 'Сітка · 12 колонок', kind: 'grid', sel: '.hero__grid' },
  { key: 'nav', name: 'Навігація', kind: 'frame', sel: '.hero__nav' },
  { key: 'title', name: 'Заголовок · H1', kind: 'text', sel: '.hero__title', hug: true },
  { key: 'body', name: 'Текст і кнопки', kind: 'frame', sel: '.hero__body', hug: true },
  { key: 'cases', name: 'Кейси · 3 картки', kind: 'frame', sel: '.hero__cases' },
]

// Elements that turn into their own tag in chapter 03, in the order they turn.
export const ELEMENTS = [
  { key: 'nav', name: 'Навігація', sel: '.hero__nav' },
  { key: 'title', name: 'Заголовок · H1', sel: '.hero__title' },
  { key: 'lead', name: 'Текст', sel: '.hero__lead' },
  { key: 'actions', name: 'Кнопки', sel: '.hero__actions' },
  { key: 'cases', name: 'Кейси · 3 картки', sel: '.hero__cases' },
]

// Boxes in design pixels. offset* are layout values, untouched by the CSS
// transforms around the screens (the offset parent is the .hero section).
export function measureBoxes(hero, list) {
  const full = { x: 0, y: 0, w: DESIGN_W, h: DESIGN_H }
  const out = {}
  for (const l of list) {
    const el = l.sel && hero?.querySelector(l.sel)
    out[l.key] = el
      ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
      : full
  }
  return out
}

export const measureLayers = (hero) => measureBoxes(hero, LAYERS)

export const fallbackBoxes = (list) =>
  Object.fromEntries(list.map((l) => [l.key, { x: 0, y: 0, w: DESIGN_W, h: DESIGN_H }]))

export const FALLBACK_BOXES = fallbackBoxes(LAYERS)

// Figma window on a w x h screen: panels scale with it, the frame sits in the canvas.
export function figmaLayout(w, h) {
  const top = 44
  const left = Math.round(Math.max(170, w * 0.14))
  const right = Math.round(Math.max(180, w * 0.15))
  const canvas = { w: w - left - right, h: h - top }
  const s = Math.min((canvas.w * 0.88) / DESIGN_W, (canvas.h * 0.8) / DESIGN_H)
  const x = (canvas.w - DESIGN_W * s) / 2
  const y = (canvas.h - DESIGN_H * s) / 2 + 14
  return { top, left, right, canvas, frame: { x, y, s }, abs: { x: left + x, y: top + y } }
}

// Code editor, fixed pixels (JetBrains Mono 15px: 9px per character).
export const EDITOR = {
  bar: 40,
  status: 28,
  tree: 230,
  gutter: 72,
  padTop: 18,
  lineH: 24,
  charW: 9,
  fontSize: 15,
}
EDITOR.textX = EDITOR.tree + EDITOR.gutter
EDITOR.textY = EDITOR.bar + EDITOR.padTop
