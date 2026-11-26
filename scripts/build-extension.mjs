// Strips of wall above and floor below the desk photo, for portrait screens and for
// the laptop close-up: the camera can then frame the scene taller than 16:9.
//   node scripts/build-extension.mjs
//   -> public/frames/<2736|1920|960>/top.webp, bottom.webp
//
// Source: frames/test/k1-flux-extended-4x5.png — K1 padded to 4:5 with grey bands and
// outpainted by FLUX (docs/storyboard.md). FLUX re-renders the whole picture at its own
// resolution, so only the new bands are taken from it; the photo between them stays
// the original. K1, K2 and K5 are identical along their top and bottom rows, so one
// pair of strips fits every frame. Each strip reaches OVERLAP px into the photo and
// crossfades there into K1, which hides the seam.
// Needs ffmpeg with libwebp on PATH.

import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { FRAME, EXTEND } from '../src/scene/geometry.js'

const SRC = 'frames/test/k1-flux-extended-4x5.png'
const K1 = 'frames/test/k1-flux-open-laptop.png'
const W = FRAME.w
const H = EXTEND.top + FRAME.h + EXTEND.bottom
const { top: TOP, bottom: BOTTOM, overlap: OVERLAP } = EXTEND
const WIDTHS = [2736, 1920, 960]

const rgb = (file, w, h) =>
  execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${w}:${h}:flags=lanczos,format=rgb24`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })

const ext = rgb(SRC, W, H) // the outpainted picture brought to the photo's scale
const k1 = rgb(K1, W, FRAME.h)

// FLUX shifts the tone slightly. Per channel gain and offset that bring the re-rendered
// photo back to the original, measured in a band next to each seam, applied to that strip.
function toneMatch(rows) {
  const fit = []
  for (let c = 0; c < 3; c++) {
    let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0
    for (const y of rows) for (let x = 0; x < W; x += 2) {
      const a = ext[((y + TOP) * W + x) * 3 + c]
      const b = k1[(y * W + x) * 3 + c]
      sx += a; sy += b; sxx += a * a; sxy += a * b; n++
    }
    const gain = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    fit.push({ gain, offset: (sy - gain * sx) / n })
  }
  return fit
}
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i)
const topFit = toneMatch(range(0, 160))
const bottomFit = toneMatch(range(FRAME.h - 160, FRAME.h))
console.log('tone top', topFit.map((f) => `${f.gain.toFixed(3)}/${f.offset.toFixed(1)}`).join(' '))
console.log('tone bottom', bottomFit.map((f) => `${f.gain.toFixed(3)}/${f.offset.toFixed(1)}`).join(' '))

const smooth = (t) => t * t * (3 - 2 * t)

// one strip: rows [from, to) of the tall picture; inside the photo, fade ext -> K1
function strip(from, to, fit, fadeFrom, fadeTo) {
  const out = Buffer.alloc((to - from) * W * 3)
  for (let y = from; y < to; y++) {
    const inPhoto = y >= TOP && y < TOP + FRAME.h
    // weight of K1: 0 at fadeFrom, 1 at fadeTo
    const t = inPhoto ? smooth(Math.min(1, Math.max(0, (y - fadeFrom) / (fadeTo - fadeFrom)))) : 0
    for (let x = 0; x < W; x++) {
      for (let c = 0; c < 3; c++) {
        const e = Math.min(255, Math.max(0, ext[(y * W + x) * 3 + c] * fit[c].gain + fit[c].offset))
        const k = inPhoto ? k1[((y - TOP) * W + x) * 3 + c] : 0
        out[((y - from) * W + x) * 3 + c] = Math.round(e * (1 - t) + k * t)
      }
    }
  }
  return out
}

const top = strip(0, TOP + OVERLAP, topFit, TOP, TOP + OVERLAP)
// bottom: K1 at the start of the overlap, fading to the extension at the photo's edge
const bottom = strip(TOP + FRAME.h - OVERLAP, H, bottomFit, TOP + FRAME.h, TOP + FRAME.h - OVERLAP)

function write(name, buf, h) {
  for (const width of WIDTHS) {
    const dir = `public/frames/${width}`
    mkdirSync(dir, { recursive: true })
    const out = `${dir}/${name}.webp`
    execFileSync('ffmpeg', [
      '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${h}`, '-i', '-',
      '-vf', `scale=${width}:-2:flags=lanczos`,
      '-c:v', 'libwebp', '-quality', '80', '-compression_level', '6', out,
    ], { input: buf })
    console.log(out)
  }
}
write('top', top, TOP + OVERLAP)
write('bottom', bottom, BOTTOM + OVERLAP)
