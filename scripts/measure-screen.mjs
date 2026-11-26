// Measures the 4 corners of a lit screen in a frame, in full-image pixels.
//
//   node scripts/measure-screen.mjs bright <image> <x> <y> <w> <h> [threshold]
//     the screen is the largest bright area inside the crop (phone in K5)
//   node scripts/measure-screen.mjs diff <imageOff> <imageOn> <x> <y> <w> <h> [threshold]
//     the screen is what lights up between two frames (laptop: K2 -> K3)
//   --debug out.png  writes the mask with the corners marked
//
// The fitting itself lives in scripts/lib/screen-quad.mjs. Needs ffmpeg on PATH.

import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { screenQuad } from './lib/screen-quad.mjs'

const argv = process.argv.slice(2)
const debugAt = argv.indexOf('--debug')
const debugFile = debugAt >= 0 ? argv.splice(debugAt, 2)[1] : null
const [mode, ...rest] = argv

function grayCrop(file, x, y, w, h) {
  return execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-vf', `crop=${w}:${h}:${x}:${y},format=gray`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
    { maxBuffer: 1 << 28 },
  )
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

const found = screenQuad(mask, w, h)
if (!found) {
  console.error('no screen found')
  process.exit(1)
}

const corners = Object.fromEntries(
  Object.entries(found.corners).map(([k, [x, y]]) => [k, [+(x + x0).toFixed(1), +(y + y0).toFixed(1)]]),
)

if (debugFile) {
  const img = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) img[i] = found.label[i] === found.id ? 255 : mask[i] ? 90 : 20
  for (const [cx, cy] of Object.values(found.corners)) {
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const X = Math.round(cx) + dx
      const Y = Math.round(cy) + dy
      if (X >= 0 && X < w && Y >= 0 && Y < h) img[Y * w + X] = 0
    }
  }
  const pgm = debugFile.replace(/\.png$/i, '') + '.pgm'
  writeFileSync(pgm, Buffer.concat([Buffer.from(`P5\n${w} ${h}\n255\n`), img]))
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', pgm, debugFile])
  unlinkSync(pgm)
}

console.log(JSON.stringify({ corners, areaPx: found.area }, null, 2))
