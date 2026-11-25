// Converts the approved Higgsfield frames into WebP sets for the site:
//   public/frames/2736/<name>.webp  — full resolution, for the camera moving in
//   public/frames/1920/<name>.webp  — desktop without close-ups
//   public/frames/960/<name>.webp   — lighter set for small screens
// Run: npm run frames   (needs ffmpeg with libwebp on PATH)
// The approved source for each frame is listed in docs/storyboard.md.

import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const FRAMES = {
  k1: 'frames/test/k1-flux-open-laptop.png',
  k2: 'frames/test/k2-flux-sketch-no-letters.png',
  k5: 'frames/test/k5-flux-hand-b.png',
}
const WIDTHS = [2736, 1920, 960]

for (const width of WIDTHS) {
  const dir = `public/frames/${width}`
  mkdirSync(dir, { recursive: true })
  for (const [name, src] of Object.entries(FRAMES)) {
    const out = `${dir}/${name}.webp`
    execFileSync('ffmpeg', [
      '-v', 'error', '-y', '-i', src,
      '-vf', `scale=${width}:-2:flags=lanczos`,
      '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6',
      out,
    ])
    console.log(out)
  }
}
