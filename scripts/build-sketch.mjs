// Builds what the scene needs to draw the sketch stroke by stroke:
//   public/frames/sketch/sheet.webp — the sheet area of K2 (colour)
//   public/frames/sketch/order.png  — when each pixel appears, 0 (first) .. 255 (last)
// K1 and K2 differ only by the pencil lines, so the K1 -> K2 difference is the drawing.
// Order: faint construction lines first, then the outlines row by row from the top,
// each row left to right like a hand; the lighter hatching inside boxes comes just
// after the heavy outlines around it.
// Run: npm run sketch   (needs ffmpeg on PATH)

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { SKETCH_BOX, SHEET } from '../src/scene/geometry.js'
import { squareToQuad, invert } from '../src/lib/homography.js'

const K1 = 'frames/test/k1-flux-open-laptop.png'
const K2 = 'frames/test/k2-flux-sketch-no-letters.png'
const OUT = 'public/frames/sketch'
const { x: X0, y: Y0, w: W, h: H } = SKETCH_BOX

const debugAt = process.argv.indexOf('--debug')
const debugFile = debugAt >= 0 ? process.argv[debugAt + 1] : null

mkdirSync(OUT, { recursive: true })

function gray(file) {
  return execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-vf', `crop=${W}:${H}:${X0}:${Y0},format=gray`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
    { maxBuffer: 1 << 28 },
  )
}

const g1 = gray(K1)
const g2 = gray(K2)

// pencil = how much darker K2 is, lightly smoothed against grain
const raw = new Float32Array(W * H)
for (let i = 0; i < W * H; i++) raw[i] = Math.max(0, g1[i] - g2[i])
const diff = new Float32Array(W * H)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let s = 0
    let n = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx
        const yy = y + dy
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
        s += raw[yy * W + xx]
        n++
      }
    }
    diff[y * W + x] = s / n
  }
}

// position on the sheet: u across, v down, 0..1, through the sheet's perspective
const toSheet = invert(squareToQuad([SHEET.tl, SHEET.tr, SHEET.br, SHEET.bl]))
function uv(x, y) {
  const [a, b, c, d, e, f, g, h, i] = toSheet
  const w = g * x + h * y + i
  return [(a * x + b * y + c) / w, (d * x + e * y + f) / w]
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const ROWS = 7
const FAINT = 9
const MAIN = 38
const HEAVY = 92

const order = Buffer.alloc(W * H)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x
    const d = diff[i]
    const [u, v] = uv(x + X0, y + Y0)
    const cu = clamp01(u)
    const cv = clamp01(v)
    const jitter = (hash(Math.floor(x / 7), Math.floor(y / 7)) - 0.5) * 0.02
    let t
    if (d < FAINT) {
      t = 0.05 + cv * 0.85 // paper: no visible change, any time is fine
    } else if (d < MAIN) {
      t = 0.02 + cv * 0.2 // construction lines: a quick light pass down the sheet
    } else {
      const row = Math.min(ROWS - 1, Math.floor(cv * ROWS))
      t = 0.2 + ((row + cu * 0.9) / ROWS) * 0.66
      if (d < HEAVY) t += 0.06 // lighter hatching right after the heavy outlines
    }
    order[i] = Math.round(clamp01(t + jitter) * 0.97 * 255)
  }
}

function writeGrayPng(buf, file) {
  const pgm = file.replace(/\.png$/i, '.pgm')
  writeFileSync(pgm, Buffer.concat([Buffer.from(`P5\n${W} ${H}\n255\n`), buf]))
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', pgm, file])
  return pgm
}

unlinkSync(writeGrayPng(order, `${OUT}/order.png`))

execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-i', K2,
  '-vf', `crop=${W}:${H}:${X0}:${Y0}`,
  '-c:v', 'libwebp', '-quality', '88', `${OUT}/sheet.webp`,
])

if (debugFile) {
  // order as a heat strip: black = first, white = last, only where there is pencil
  const vis = Buffer.alloc(W * H)
  for (let i = 0; i < W * H; i++) vis[i] = diff[i] < FAINT ? 0 : 40 + Math.round((order[i] / 255) * 215)
  unlinkSync(writeGrayPng(vis, debugFile))
}

console.log(`${OUT}/order.png, ${OUT}/sheet.webp — ${W}x${H}`)
