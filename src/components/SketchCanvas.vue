<script setup>
// The sketch drawn stroke by stroke (chapter 01). A tiny WebGL shader shows the sheet
// from K2 pixel by pixel, each when scroll reaches its time in the order map
// (scripts/build-sketch.mjs). Lies over K1 inside the stage, at the sheet's box.
// If WebGL is missing it reports "unsupported" and the scene falls back to the
// soft wipe down the sheet.
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { SKETCH_BOX } from '../scene/geometry.js'

const props = defineProps({
  t: { type: Number, default: 0 }, // 0 — blank sheet, 1 — finished sketch
})
const emit = defineEmits(['ready', 'unsupported'])

const canvas = ref(null)
let gl = null
let uT = null
let ready = false
let textures = []

const VERT = `
attribute vec2 p;
varying vec2 v;
void main() {
  v = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`

// soft edge 0.03: a stroke fades in over a short stretch of scroll, like graphite
const FRAG = `
precision mediump float;
uniform sampler2D sheet;
uniform sampler2D order;
uniform float t;
varying vec2 v;
void main() {
  vec4 c = texture2D(sheet, v);
  float at = texture2D(order, v).r;
  float a = smoothstep(at, at + 0.03, t);
  gl_FragColor = vec4(c.rgb * a, a);
}`

function shader(type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

function texture(unit, img) {
  const tex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  textures.push(tex)
}

function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function draw() {
  if (!ready) return
  gl.uniform1f(uT, props.t)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

onMounted(async () => {
  try {
    gl = canvas.value.getContext('webgl', { premultipliedAlpha: true, antialias: false })
    if (!gl) throw new Error('no WebGL')
    const prog = gl.createProgram()
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const p = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(p)
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0)

    const base = `${import.meta.env.BASE_URL}frames/sketch/`
    const [sheet, order] = await Promise.all([load(base + 'sheet.webp'), load(base + 'order.png')])
    if (!gl) return // unmounted while loading
    // keep the order values exactly as stored
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    texture(0, sheet)
    texture(1, order)
    gl.uniform1i(gl.getUniformLocation(prog, 'sheet'), 0)
    gl.uniform1i(gl.getUniformLocation(prog, 'order'), 1)
    uT = gl.getUniformLocation(prog, 't')
    gl.viewport(0, 0, SKETCH_BOX.w, SKETCH_BOX.h)
    ready = true
    draw()
    emit('ready')
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[SketchCanvas] falling back to a wipe:', err)
    emit('unsupported', err)
  }
})

watch(() => props.t, draw)

onBeforeUnmount(() => {
  if (gl) {
    textures.forEach((t) => gl.deleteTexture(t))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  gl = null
  textures = []
  ready = false
})
</script>

<template>
  <canvas
    ref="canvas"
    class="sketch"
    :width="SKETCH_BOX.w"
    :height="SKETCH_BOX.h"
    :style="{
      left: SKETCH_BOX.x + 'px',
      top: SKETCH_BOX.y + 'px',
      width: SKETCH_BOX.w + 'px',
      height: SKETCH_BOX.h + 'px',
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
.sketch {
  position: absolute;
  pointer-events: none;
}
</style>
