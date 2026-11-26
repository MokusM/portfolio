// Cuts the V3 video (hand picks up the phone) into a frame sequence for scroll scrubbing.
// Only the part of the frame that changes is kept (VIDEO_BOX in src/scene/geometry.js):
// everywhere else the scene shows the photos, so the frames stay light.
//   node scripts/build-video.mjs [video] [frames]
//   -> public/frames/v3/000.webp … and public/frames/v3/manifest.json
// Needs ffmpeg/ffprobe on PATH. Drawing on a canvas, not seeking a <video>,
// because currentTime scrubbing stutters in Safari.

import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { FRAME, VIDEO_BOX, PHONE } from '../src/scene/geometry.js'
import { screenQuad } from './lib/screen-quad.mjs'

const src = process.argv[2] ?? 'frames/test/v3-hand.mp4'
const count = Number(process.argv[3] ?? 36)
const OUT = 'public/frames/v3'
const SCALE = 0.75 // of the box size, plenty for a moving hand

const probe = JSON.parse(
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,duration', '-of', 'json', src]).toString(),
).streams[0]
const vw = probe.width
const vh = probe.height
const duration = Number(probe.duration)

// the video may differ in size from the frames: map the box into video pixels
const kx = vw / FRAME.w
const ky = vh / FRAME.h
const crop = {
  x: Math.round(VIDEO_BOX.x * kx),
  y: Math.round(VIDEO_BOX.y * ky),
  w: Math.round(VIDEO_BOX.w * kx),
  h: Math.round(VIDEO_BOX.h * ky),
}
const outW = Math.round(VIDEO_BOX.w * SCALE)
const outH = Math.round(VIDEO_BOX.h * SCALE)

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// evenly spaced frames, first and last included. -ss after -i: exact (decoding)
// seeking — a fast seek this close to the end finds no frame and writes nothing.
const last = duration - 0.12
for (let i = 0; i < count; i++) {
  const t = (i / (count - 1)) * last
  const file = `${OUT}/${String(i).padStart(3, '0')}.webp`
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', src, '-ss', t.toFixed(3), '-frames:v', '1',
    '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},scale=${outW}:${outH}:flags=lanczos`,
    '-c:v', 'libwebp', '-quality', '80', file,
  ])
  if (!statSync(file).size) throw new Error(`empty frame ${file} at ${t.toFixed(3)} s`)
}

// Track the phone's lit screen in every frame, so the live page can sit on it while
// it moves instead of letting the generated screen show. Frames where the screen is
// still dark, or where what is lit does not look like the phone, get null.
// The desk under the lamp is as bright as the screen, so the screen is the lit area
// at the phone's final centre (K5), not the largest one: it only lights up once the
// phone is nearly in place.
const LIT = 150
const phoneArea = (() => {
  const [a, b, c, d] = PHONE
  return Math.abs((a[0] * b[1] - b[0] * a[1]) + (b[0] * c[1] - c[0] * b[1]) + (c[0] * d[1] - d[0] * c[1]) + (d[0] * a[1] - a[0] * d[1])) / 2
})()
const centreOf = (q) => [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4]
// tracked backwards from the end: each frame is searched from where the phone was
// in the next one, so the seed follows it while it is still settling
let seedCentre = centreOf(PHONE)
const quads = new Array(count).fill(null)
for (let i = count - 1; i >= 0; i--) {
  const t = (i / (count - 1)) * last
  const seed = [seedCentre[0] * kx - crop.x, seedCentre[1] * ky - crop.y]
  const gray = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', src, '-ss', t.toFixed(3), '-frames:v', '1',
      '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},format=gray`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
    { maxBuffer: 1 << 28 },
  )
  let entry = null
  // a screen that is just lighting up is dimmer: try lower thresholds, keep the
  // first find that has the phone's shape and size
  for (const thr of [LIT, 125, 100]) {
    const mask = new Uint8Array(crop.w * crop.h)
    for (let k = 0; k < mask.length; k++) mask[k] = gray[k] > thr ? 1 : 0
    const found = screenQuad(mask, crop.w, crop.h, { seed })
    if (!found) continue
    // crop pixels (video) -> frame pixels
    const q = ['tl', 'tr', 'br', 'bl'].map((n) => {
      const [x, y] = found.corners[n]
      return [+((x + crop.x) / kx).toFixed(1), +((y + crop.y) / ky).toFixed(1)]
    })
    const width = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1])
    const height = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1])
    const area = found.area / (kx * ky)
    const shaped = height / width > 1.8 && height / width < 2.7 && area > phoneArea * 0.6 && area < phoneArea * 1.3
    if (!shaped) continue
    // how lit the screen is, for fading the live page in with it
    let sum = 0
    for (let k = 0; k < found.label.length; k++) if (found.label[k] === found.id) sum += gray[k]
    entry = { quad: q, mean: sum / found.area }
    seedCentre = centreOf(q)
    break
  }
  quads[i] = entry
}
const brightest = Math.max(...quads.filter(Boolean).map((e) => e.mean))
const DARK = 90
const phone = quads.map((e) =>
  e ? { quad: e.quad, light: +Math.min(1, Math.max(0, ((e.mean - DARK) / (brightest - DARK)) * 1.3)).toFixed(2) } : null,
)

writeFileSync(
  `${OUT}/manifest.json`,
  JSON.stringify({ count, width: outW, height: outH, box: VIDEO_BOX, phone }, null, 2),
)
const tracked = phone.map((p, i) => (p ? i : -1)).filter((i) => i >= 0)
console.log(`${count} frames ${outW}x${outH} from ${vw}x${vh}, ${duration.toFixed(2)} s -> ${OUT}`)
console.log(`phone screen tracked in frames ${tracked[0]}..${tracked[tracked.length - 1]} (${tracked.length})`)
console.log('last frame quad', JSON.stringify(phone[count - 1]?.quad), 'K5', JSON.stringify(PHONE))
