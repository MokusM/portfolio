// Projective transforms for pinning HTML onto a screen in a photo.
// Matrices are 3x3, row-major: [a, b, c, d, e, f, g, h, i].
// Quads are 4 points in order: top-left, top-right, bottom-right, bottom-left.

// Unit square -> quad (Heckbert, "Fundamentals of Texture Mapping").
export function squareToQuad(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const sx = x0 - x1 + x2 - x3
  const sy = y0 - y1 + y2 - y3
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    return [x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0, 0, 1]
  }
  const dx1 = x1 - x2, dx2 = x3 - x2
  const dy1 = y1 - y2, dy2 = y3 - y2
  const den = dx1 * dy2 - dx2 * dy1
  const g = (sx * dy2 - dx2 * sy) / den
  const h = (dx1 * sy - sx * dy1) / den
  return [
    x1 - x0 + g * x1, x3 - x0 + h * x3, x0,
    y1 - y0 + g * y1, y3 - y0 + h * y3, y0,
    g, h, 1,
  ]
}

export function multiply(A, B) {
  const r = new Array(9)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]
    }
  }
  return r
}

export function invert(m) {
  const [a, b, c, d, e, f, g, h, i] = m
  const A = e * i - f * h
  const B = -(d * i - f * g)
  const C = d * h - e * g
  const det = a * A + b * B + c * C
  return [
    A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
    B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
    C / det, -(a * h - b * g) / det, (a * e - b * d) / det,
  ]
}

// Maps quad `src` onto quad `dst`.
export function quadToQuad(src, dst) {
  return multiply(squareToQuad(dst), invert(squareToQuad(src)))
}

// Maps a w x h box (an element at 0,0) onto quad `dst`.
export function rectToQuad(w, h, dst) {
  return multiply(squareToQuad(dst), [1 / w, 0, 0, 0, 1 / h, 0, 0, 0, 1])
}

// CSS matrix3d (column-major), to be used with transform-origin: 0 0.
export function toCss(m) {
  const k = 1 / m[8]
  const [a, b, c, d, e, f, g, h, i] = m.map((v) => v * k)
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,${i})`
}
