<script setup>
// One picture or video of a case (src/content/cases.js). Without `src` it is a
// placeholder frame with a hint of what goes there. `frame` draws a Figma-style
// selection around it (the list preview), `label` is the frame's name above it.
// Videos play muted in a loop only while on screen.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  media: { type: Object, default: () => ({}) },
  frame: { type: Boolean, default: false },
  label: { type: String, default: '' },
  eager: { type: Boolean, default: false },
})

const base = import.meta.env.BASE_URL
const src = computed(() => (props.media.src ? base + props.media.src : ''))
const poster = computed(() => (props.media.poster ? base + props.media.poster : undefined))
const isVideo = computed(() => props.media.kind === 'video')

const video = ref(null)
let io = null

onMounted(() => {
  if (!video.value) return
  io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) video.value.play().catch(() => {})
    else video.value.pause()
  })
  io.observe(video.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <figure
    class="media"
    :class="{ 'media--frame': frame, 'media--empty': !src }"
    :style="{ aspectRatio: media.ratio || '16 / 10' }"
  >
    <video
      v-if="src && isVideo"
      ref="video"
      class="media__el"
      :src="src"
      :poster="poster"
      muted
      loop
      playsinline
      preload="none"
      :aria-label="media.alt || null"
    />
    <img
      v-else-if="src"
      class="media__el"
      :src="src"
      :alt="media.alt || ''"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
    />
    <span v-else class="media__hint">{{ media.hint }}</span>
    <template v-if="frame">
      <figcaption v-if="label" class="media__label">{{ label }}</figcaption>
      <i class="media__handle media__handle--tl" />
      <i class="media__handle media__handle--tr" />
      <i class="media__handle media__handle--br" />
      <i class="media__handle media__handle--bl" />
    </template>
  </figure>
</template>

<style scoped>
.media {
  position: relative;
  width: 100%;
  margin: 0;
  background: color-mix(in srgb, var(--ink) 5%, transparent);
}

.media__el {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* placeholder: a hairline frame crossed corner to corner, as in a wireframe */
.media--empty {
  border: 1px solid color-mix(in srgb, var(--ink) 28%, transparent);
  background:
    linear-gradient(to top right, transparent calc(50% - 0.6px), color-mix(in srgb, var(--ink) 18%, transparent) 50%, transparent calc(50% + 0.6px)),
    color-mix(in srgb, var(--ink) 3%, transparent);
}

.media__hint {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 12px;
  font: 500 11px / 1.45 var(--mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.55;
}

/* Figma selection: blue outline, square handles, frame name above */
.media--frame {
  outline: 1px solid #0d99ff;
  outline-offset: 0;
}

.media__label {
  position: absolute;
  left: -1px;
  bottom: calc(100% + 8px);
  font: 500 11px / 1 var(--mono);
  letter-spacing: 0.04em;
  color: #0d99ff;
  white-space: nowrap;
}

.media__handle {
  position: absolute;
  width: 7px;
  height: 7px;
  border: 1px solid #0d99ff;
  background: #fff;
}

.media__handle--tl {
  left: -4px;
  top: -4px;
}
.media__handle--tr {
  right: -4px;
  top: -4px;
}
.media__handle--br {
  right: -4px;
  bottom: -4px;
}
.media__handle--bl {
  left: -4px;
  bottom: -4px;
}

/* «Кіно»: the Figma selection becomes a camera viewfinder —
   corner brackets instead of handles, the frame name in credits type */
.media--frame {
  outline: 0;
}

.media__label {
  bottom: calc(100% + 20px);
  color: var(--ink);
  font: 400 11px / 1 var(--credits);
  letter-spacing: 0.26em;
  text-transform: uppercase;
  opacity: 0.75;
}

.media__handle {
  width: 18px;
  height: 18px;
  border: 0 solid var(--ink);
  background: none;
}

.media__handle--tl {
  left: -10px;
  top: -10px;
  border-width: 1.5px 0 0 1.5px;
}

.media__handle--tr {
  right: -10px;
  top: -10px;
  border-width: 1.5px 1.5px 0 0;
}

.media__handle--br {
  right: -10px;
  bottom: -10px;
  border-width: 0 1.5px 1.5px 0;
}

.media__handle--bl {
  left: -10px;
  bottom: -10px;
  border-width: 0 0 1.5px 1.5px;
}

.media__hint {
  font-family: var(--credits);
  letter-spacing: 0.2em;
}
</style>
