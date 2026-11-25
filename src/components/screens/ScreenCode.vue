<script setup>
// Chapter 03: the editor where the hero component is typed, top to bottom.
import { computed } from 'vue'
import { CODE_TEXT, CODE_LINE_COUNT } from './hero-code.js'
import { EDITOR } from './screen-layout.js'
import { tokenize } from './code-tokens.js'

const props = defineProps({
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  // characters typed so far, in file order
  chars: { type: Number, default: 0 },
})

const TOKENS = tokenize(CODE_TEXT)

const view = computed(() => {
  const lines = [[]]
  let budget = props.chars
  for (const t of TOKENS) {
    if (budget <= 0) break
    if (t.cls === 'nl') {
      lines.push([])
      budget -= 1
      continue
    }
    const text = t.text.slice(0, budget)
    budget -= text.length
    lines[lines.length - 1].push({ cls: t.cls, text })
  }
  return { lines, caret: lines.length - 1 }
})

// Keep the line being typed in view.
const scroll = computed(() => {
  const bottom = EDITOR.textY + (view.value.caret + 4) * EDITOR.lineH
  return Math.max(0, bottom - (props.h - EDITOR.status))
})

const typing = computed(() => props.chars > 0 && props.chars < CODE_TEXT.length)
</script>

<template>
  <div
    class="editor"
    :style="{
      width: w + 'px',
      height: h + 'px',
      gridTemplate: `${EDITOR.bar}px 1fr ${EDITOR.status}px / ${EDITOR.tree}px 1fr`,
      fontSize: EDITOR.fontSize + 'px',
    }"
  >
    <div class="editor__bar">
      <span class="editor__tab">HeroSection.vue</span>
      <span class="editor__tab editor__tab--dim">SiteNav.vue</span>
      <span class="editor__tab editor__tab--dim">main.js</span>
    </div>
    <aside class="editor__tree">
      <p class="editor__tree-title">Провідник</p>
      <p>▾ src</p>
      <p class="in">▾ components</p>
      <p class="in2 is-open">HeroSection.vue</p>
      <p class="in2">SiteNav.vue</p>
      <p class="in2">CaseRow.vue</p>
      <p class="in">App.vue</p>
      <p class="in">main.js</p>
      <p>package.json</p>
    </aside>
    <div class="editor__code" :style="{ paddingTop: EDITOR.padTop + 'px' }">
      <div
        class="editor__scroll"
        :style="{ transform: `translateY(${-scroll}px)`, lineHeight: EDITOR.lineH + 'px' }"
      >
        <div class="editor__gutter" :style="{ width: EDITOR.gutter + 'px' }">
          <span
            v-for="n in CODE_LINE_COUNT"
            :key="n"
            :class="{ 'is-current': n - 1 === view.caret }"
            >{{ n }}</span
          >
        </div>
        <pre class="editor__text"><template v-for="(line, i) in view.lines" :key="i"><span v-for="(t, j) in line" :key="j" :class="'tok-' + t.cls">{{ t.text }}</span><span v-if="i === view.caret" class="caret" :class="{ 'caret--idle': !typing }" />{{ '\n' }}</template></pre>
      </div>
      <!-- current line highlight -->
      <div
        class="editor__line"
        :style="{
          top: EDITOR.padTop + view.caret * EDITOR.lineH - scroll + 'px',
          height: EDITOR.lineH + 'px',
        }"
      />
    </div>
    <div class="editor__status">
      <span>Vue · UTF-8</span>
      <span>Рядок {{ view.caret + 1 }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.editor {
  position: relative;
  display: grid;
  background: #16161a;
  color: #c9c7c2;
  font-family: var(--mono);
}

.editor__bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: stretch;
  background: #101013;
  border-bottom: 1px solid #26262c;
}

.editor__tab {
  display: flex;
  align-items: center;
  padding: 0 22px;
  font-size: 13px;
  color: #ece9e3;
  background: #16161a;
  border-right: 1px solid #26262c;
}

.editor__tab--dim {
  color: #77757f;
  background: transparent;
}

.editor__tree {
  padding: 14px 0;
  border-right: 1px solid #26262c;
  background: #121215;
  font-size: 13px;
  line-height: 1.6;
  color: #8f8d96;
}

.editor__tree p {
  margin: 0;
  padding: 3px 18px;
}

.editor__tree-title {
  margin-bottom: 8px !important;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5d5b64;
}

.editor__tree .in {
  padding-left: 32px;
}

.editor__tree .in2 {
  padding-left: 48px;
}

.editor__tree .is-open {
  color: #ece9e3;
  background: #1f1f25;
}

.editor__code {
  position: relative;
  overflow: hidden;
}

.editor__scroll {
  position: relative;
  z-index: 1;
  display: flex;
}

.editor__line {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.035);
}

.editor__gutter {
  display: flex;
  flex: none;
  flex-direction: column;
  padding-right: 22px;
  text-align: right;
  color: #45434b;
}

.editor__gutter .is-current {
  color: #a9a6b0;
}

.editor__text {
  margin: 0;
  font: inherit;
  line-height: inherit;
  white-space: pre;
}

.editor__status {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  font-size: 12px;
  color: #77757f;
  background: #101013;
  border-top: 1px solid #26262c;
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1.15em;
  margin-left: 1px;
  vertical-align: -0.2em;
  background: #ece9e3;
}

.caret--idle {
  opacity: 0.5;
}
</style>
