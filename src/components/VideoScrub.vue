<script setup>
// The V3 video (a hand picks up the phone) scrubbed by scroll: a frame sequence drawn
// on a canvas inside the stage, only over the box that moves. Its edges are feathered
// into the photo underneath. Frames come from scripts/build-video.mjs.
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { VIDEO_BOX } from '../scene/geometry.js'

const props = defineProps({
  t: { type: Number, default: 0 }, // 0 — phone on the desk, 1 — phone in the hand
  // start loading the frames (≈1.6 MB) only once the visitor gets close
  load: { type: Boolean, default: false },
})
const emit = defineEmits(['ready', 'unsupported'])

const canvas = ref(null)
let ctx = null
let frames = []
let drawn = -1
let alive = true

function draw() {
  if (!ctx || !frames.length) return
  const i = Math.round(props.t * (frames.length - 1))
  if (i === drawn) return
  ctx.drawImage(frames[i], 0, 0, canvas.value.width, canvas.value.height)
  drawn = i
}

function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

let started = false

async function start() {
  if (started) return
  started = true
  try {
    const base = `${import.meta.env.BASE_URL}frames/v3/`
    const manifest = await fetch(base + 'manifest.json').then((r) => {
      if (!r.ok) throw new Error('no V3 frames')
      return r.json()
    })
    const list = Array.from({ length: manifest.count }, (_, i) => `${base}${String(i).padStart(3, '0')}.webp`)
    const imgs = await Promise.all(list.map(load))
    await Promise.all(imgs.map((img) => img.decode?.().catch(() => {})))
    if (!alive) return
    canvas.value.width = manifest.width
    canvas.value.height = manifest.height
    ctx = canvas.value.getContext('2d')
    frames = imgs
    draw()
    emit('ready')
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[VideoScrub] falling back to a crossfade:', err)
    emit('unsupported', err)
  }
}

onMounted(() => props.load && start())
watch(
  () => props.load,
  (on) => on && start(),
)
watch(() => props.t, draw)

onBeforeUnmount(() => {
  alive = false
  frames = []
  ctx = null
})
</script>

<template>
  <canvas
    ref="canvas"
    class="video"
    :style="{
      left: VIDEO_BOX.x + 'px',
      top: VIDEO_BOX.y + 'px',
      width: VIDEO_BOX.w + 'px',
      height: VIDEO_BOX.h + 'px',
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
/* feathered top and left edges; right and bottom are the frame's own edges */
.video {
  position: absolute;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 12%),
    linear-gradient(to bottom, transparent, #000 12%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to right, transparent, #000 12%),
    linear-gradient(to bottom, transparent, #000 12%);
  mask-composite: intersect;
}
</style>
