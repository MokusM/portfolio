// Measures the 4 corners of a lit screen in a frame, in full-image pixels.
//
//   node scripts/measure-screen.mjs bright <image> <x> <y> <w> <h> [threshold]
//     the screen is the largest bright area inside the crop (phone in K5)
//   node scripts/measure-screen.mjs diff <imageOff> <imageOn> <x> <y> <w> <h> [threshold]
//     the screen is what lights up between two frames (laptop: K2 -> K3)
//
// Corners come from straight lines fitted to the middle of each edge, so rounded
// screen corners and fingers on the bezel do not pull them inward.
// Needs ffmpeg on PATH.

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const argv = process.argv.slice(2)
const debugAt = argv.indexOf('--debug')
const debugFile = debugAt >= 0 ? argv.splice(debugAt, 2)[1] : null
const [mode, ...rest] = argv

function grayCrop(file, x, y, w, h) {
  return execFileSync('ffmpeg', [
    '-v', 'error', '-i', file,
    '-vf', `crop=${w}:${h}:${x}:${y},format=gray`,
    '-f', 'rawvideo', '-pix_fmt', 'gray', '-',
  ], { maxBuffer: 1 << 28 })
}

let mask, x0, y0, w, h
if (mode === 'bright') {
  const [file, ...nums] = rest
  ;[x0, y0, w, h] = nums.slice(0, 4).map(Number)
  const thr = Number(nums[4] ?? 185)
  const g = grayCrop(file, x0, y0, w, h)
  mask = new Uint8Array(w * h)
  for (let i = 0; i < g.length; i++) mask[i] = g[i] > thr ? 1 : 0
} else if (mode === 'diff') {
  const [off, on, ...nums] = rest
  ;[x0, y0, w, h] = nums.slice(0, 4).map(Number)
  const thr = Number(nums[4] ?? 25)
  const a = grayCrop(off, x0, y0, w, h)
  const b = grayCrop(on, x0, y0, w, h)
  mask = new Uint8Array(w * h)
  for (let i = 0; i < a.length; i++) mask[i] = Math.abs(a[i] - b[i]) > thr ? 1 : 0
} else {
  console.error('mode must be "bright" or "diff"')
  process.exit(1)
}

// Close small holes (dark text on a light screen) with a cheap row/column fill:
// keep the largest connected component, then take its outer boundary.
const label = new Int32Array(w * h).fill(-1)
let best = { id: -1, size: 0 }
const stack = []
let id = 0
for (let i = 0; i < w * h; i++) {
  if (!mask[i] || label[i] !== -1) continue
  let size = 0
  stack.push(i)
  label[i] = id
  while (stack.length) {
    const p = stack.pop()
    size++
    const px = p % w, py = (p / w) | 0
    const nb = [px > 0 ? p - 1 : -1, px < w - 1 ? p + 1 : -1, py > 0 ? p - w : -1, py < h - 1 ? p + w : -1]
    for (const q of nb) {
      if (q >= 0 && mask[q] && label[q] === -1) { label[q] = id; stack.push(q) }
    }
  }
  if (size > best.size) best = { id, size }
  id++
}

const pts = []
for (let y = 0; y < h; y++) {
  let l = -1, r = -1
  for (let x = 0; x < w; x++) if (label[y * w + x] === best.id) { if (l < 0) l = x; r = x }
  if (l >= 0) { pts.push([l, y]); pts.push([r, y]) }
}
for (let x = 0; x < w; x++) {
  let t = -1, b = -1
  for (let y = 0; y < h; y++) if (label[y * w + x] === best.id) { if (t < 0) t = y; b = y }
  if (t >= 0) { pts.push([x, t]); pts.push([x, b]) }
}

// Rough corners from diagonal extremes (fine for quads rotated < 45 degrees).
const by = (f) => pts.reduce((m, p) => (f(p) < f(m) ? p : m))
const rough = {
  tl: by(([x, y]) => x + y),
  tr: by(([x, y]) => -(x - y)),
  br: by(([x, y]) => -(x + y)),
  bl: by(([x, y]) => x - y),
}

const sides = [['tl', 'tr'], ['tr', 'br'], ['br', 'bl'], ['bl', 'tl']]

function distToSegment([px, py], [ax, ay], [bx, by2]) {
  const dx = bx - ax, dy = by2 - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return { d: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t }
}

function fitLine(ps) {
  // total least squares: returns point + direction
  const n = ps.length
  const mx = ps.reduce((s, p) => s + p[0], 0) / n
  const my = ps.reduce((s, p) => s + p[1], 0) / n
  let sxx = 0, syy = 0, sxy = 0
  for (const [x, y] of ps) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my) }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  return { p: [mx, my], d: [Math.cos(angle), Math.sin(angle)] }
}

function residual(line, [x, y]) {
  return Math.abs((x - line.p[0]) * line.d[1] - (y - line.p[1]) * line.d[0])
}

const lines = sides.map(([a, b]) => {
  let own = pts.filter((p) => {
    const here = distToSegment(p, rough[a], rough[b])
    if (here.t < 0.15 || here.t > 0.85) return false
    return sides.every(([c, e]) => distToSegment(p, rough[c], rough[e]).d >= here.d)
  })
  let line = fitLine(own)
  for (let k = 0; k < 3; k++) {
    const keep = own.filter((p) => residual(line, p) < 2.5)
    if (keep.length < 10) break
    own = keep
    line = fitLine(own)
  }
  return { line, count: own.length }
})

function intersect(l1, l2) {
  const [x1, y1] = l1.p, [dx1, dy1] = l1.d
  const [x2, y2] = l2.p, [dx2, dy2] = l2.d
  const den = dx1 * dy2 - dy1 * dx2
  const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / den
  return [x1 + t * dx1, y1 + t * dy1]
}

const names = ['tl', 'tr', 'br', 'bl']
const corners = {}
for (let i = 0; i < 4; i++) {
  const prev = lines[(i + 3) % 4].line, cur = lines[i].line
  const [x, y] = intersect(prev, cur)
  corners[names[i]] = [+(x + x0).toFixed(1), +(y + y0).toFixed(1)]
}

if (debugFile) {
  // grey = mask, white = kept component, black dots = corners
  const img = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) img[i] = label[i] === best.id ? 255 : mask[i] ? 90 : 20
  for (const name of names) {
    const [cx, cy] = corners[name].map((v, k) => Math.round(v - (k ? y0 : x0)))
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const X = cx + dx, Y = cy + dy
      if (X >= 0 && X < w && Y >= 0 && Y < h) img[Y * w + X] = 0
    }
  }
  const pgm = Buffer.concat([Buffer.from(`P5\n${w} ${h}\n255\n`), img])
  const tmp = debugFile.replace(/\.png$/i, '') + '.pgm'
  writeFileSync(tmp, pgm)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, debugFile])
}

console.log(JSON.stringify({
  corners,
  edgePoints: lines.map((l) => l.count),
  areaPx: best.size,
}, null, 2))
