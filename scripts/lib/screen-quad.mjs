// Finds the 4 corners of a lit screen in a grayscale crop.
// Used by scripts/measure-screen.mjs (single frames) and scripts/build-video.mjs
// (the phone in every frame of V3).
//
// Straight lines are fitted to the middle of each edge and intersected, so rounded
// corners do not pull the corners inward. Each edge keeps only its outermost points:
// a notch, a status bar icon or a finger over the glass makes the lit area dip
// inward, never outward, so those dips are dropped and the line follows the glass.

export function largestComponent(mask, w, h) {
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
      const px = p % w
      const py = (p / w) | 0
      if (px > 0 && mask[p - 1] && label[p - 1] === -1) { label[p - 1] = id; stack.push(p - 1) }
      if (px < w - 1 && mask[p + 1] && label[p + 1] === -1) { label[p + 1] = id; stack.push(p + 1) }
      if (py > 0 && mask[p - w] && label[p - w] === -1) { label[p - w] = id; stack.push(p - w) }
      if (py < h - 1 && mask[p + w] && label[p + w] === -1) { label[p + w] = id; stack.push(p + w) }
    }
    if (size > best.size) best = { id, size }
    id++
  }
  return { label, id: best.id, size: best.size }
}

function fitLine(ps) {
  const n = ps.length
  const mx = ps.reduce((s, p) => s + p[0], 0) / n
  const my = ps.reduce((s, p) => s + p[1], 0) / n
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const [x, y] of ps) {
    sxx += (x - mx) ** 2
    syy += (y - my) ** 2
    sxy += (x - mx) * (y - my)
  }
  const a = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  return { p: [mx, my], d: [Math.cos(a), Math.sin(a)] }
}

function intersect(l1, l2) {
  const [x1, y1] = l1.p
  const [dx1, dy1] = l1.d
  const [x2, y2] = l2.p
  const [dx2, dy2] = l2.d
  const den = dx1 * dy2 - dy1 * dx2
  const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / den
  return [x1 + t * dx1, y1 + t * dy1]
}

function distToSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return { d: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t }
}

// The component under `seed` ([x, y] in crop pixels), or the lit one nearest to it
// within `radius` — dark text on a screen can sit right under the seed.
function componentAt(label, w, h, seed, radius = 90) {
  const [sx, sy] = seed.map(Math.round)
  for (let r = 0; r <= radius; r += 2) {
    for (let dy = -r; dy <= r; dy += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        const x = sx + dx
        const y = sy + dy
        if (x < 0 || y < 0 || x >= w || y >= h) continue
        const l = label[y * w + x]
        if (l >= 0) return l
      }
    }
  }
  return -1
}

// mask: Uint8Array w*h (1 = lit). Returns { corners: {tl,tr,br,bl}, area, label, id }
// in crop pixels, or null when nothing usable is lit. Without a seed the largest lit
// area is the screen; with `seed` it is the lit area at that point (when brighter
// things, like a desk under a lamp, share the crop).
export function screenQuad(mask, w, h, { minArea = 2000, seed = null } = {}) {
  const comp = largestComponent(mask, w, h)
  const { label } = comp
  let { id, size } = comp
  if (seed) {
    id = componentAt(label, w, h, seed)
    if (id < 0) return null
    size = 0
    for (let i = 0; i < label.length; i++) if (label[i] === id) size++
  }
  if (size < minArea) return null

  // outer boundary of the component, scanned by rows and by columns
  const pts = []
  for (let y = 0; y < h; y++) {
    let l = -1
    let r = -1
    for (let x = 0; x < w; x++) if (label[y * w + x] === id) { if (l < 0) l = x; r = x }
    if (l >= 0) pts.push([l, y], [r, y])
  }
  for (let x = 0; x < w; x++) {
    let t = -1
    let b = -1
    for (let y = 0; y < h; y++) if (label[y * w + x] === id) { if (t < 0) t = y; b = y }
    if (t >= 0) pts.push([x, t], [x, b])
  }

  // rough corners from diagonal extremes (fine for quads rotated < 45 degrees)
  const by = (f) => pts.reduce((m, p) => (f(p) < f(m) ? p : m))
  const rough = {
    tl: by(([x, y]) => x + y),
    tr: by(([x, y]) => -(x - y)),
    br: by(([x, y]) => -(x + y)),
    bl: by(([x, y]) => x - y),
  }
  const centre = [
    (rough.tl[0] + rough.tr[0] + rough.br[0] + rough.bl[0]) / 4,
    (rough.tl[1] + rough.tr[1] + rough.br[1] + rough.bl[1]) / 4,
  ]
  const sides = [['tl', 'tr'], ['tr', 'br'], ['br', 'bl'], ['bl', 'tl']]

  const lines = sides.map(([a, b]) => {
    let own = pts.filter((p) => {
      const here = distToSegment(p, rough[a], rough[b])
      if (here.t < 0.12 || here.t > 0.88) return false
      return sides.every(([c, e]) => distToSegment(p, rough[c], rough[e]).d >= here.d)
    })
    if (own.length < 6) return null
    let line = fitLine(own)
    const outward = (l) => {
      let nx = -l.d[1]
      let ny = l.d[0]
      if ((l.p[0] - centre[0]) * nx + (l.p[1] - centre[1]) * ny < 0) { nx = -nx; ny = -ny }
      return (p) => (p[0] - l.p[0]) * nx + (p[1] - l.p[1]) * ny
    }
    // 1) walk the line out to the outer half of the points: a notch drags the first
    //    fit inward, and the glass beside it lies outside that fit
    for (let k = 0; k < 3; k++) {
      const out = outward(line)
      const sorted = own.map(out).sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const keep = own.filter((p) => out(p) >= median)
      if (keep.length < 6) break
      own = keep
      line = fitLine(own)
    }
    // 2) then keep the points on that line; inward dips (notch, fingers) and stray
    //    outward specks go
    for (let k = 0; k < 3; k++) {
      const out = outward(line)
      const keep = own.filter((p) => out(p) > -2 && out(p) < 3)
      if (keep.length < 6) break
      own = keep
      line = fitLine(own)
    }
    return line
  })
  if (lines.some((l) => !l)) return null

  const names = ['tl', 'tr', 'br', 'bl']
  const corners = {}
  for (let i = 0; i < 4; i++) corners[names[i]] = intersect(lines[(i + 3) % 4], lines[i])
  return { corners, area: size, label, id }
}
