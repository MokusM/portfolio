// Cuts the V3 video (hand picks up the phone) into a frame sequence for scroll scrubbing.
// Only the part of the frame that changes is kept (VIDEO_BOX in src/scene/geometry.js):
// everywhere else the scene shows the photos, so the frames stay light.
//   node scripts/build-video.mjs [video] [frames]
//   -> public/frames/v3/000.webp … and public/frames/v3/manifest.json
// Needs ffmpeg/ffprobe on PATH. Drawing on a canvas, not seeking a <video>,
// because currentTime scrubbing stutters in Safari.

import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { FRAME, VIDEO_BOX } from '../src/scene/geometry.js'

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

writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ count, width: outW, height: outH, box: VIDEO_BOX }, null, 2))
console.log(`${count} frames ${outW}x${outH} from ${vw}x${vh}, ${duration.toFixed(2)} s -> ${OUT}`)
