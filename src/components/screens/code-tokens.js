// A tiny Vue-SFC highlighter for the code shown on the laptop screen.
// Colours are global classes .tok-<kind> in src/styles/base.css.

const RULES = [
  ['str', /^("[^"\n]*"|'[^'\n]*')/],
  ['tag', /^(<\/?[A-Za-z][\w-]*|\/?>)/],
  ['attr', /^[:@]?[a-zA-Z-]+(?==)/],
  ['kw', /^(import|from|const|export|default|setup)\b/],
  ['fn', /^[A-Za-z_$][\w$]*(?=\()/],
  ['num', /^\d+(\.\d+)?/],
  ['nl', /^\n/],
  ['txt', /^[^\s<>"'=(){}:,.\d]+/],
  ['txt', /^[\s\S]/],
]

export function tokenize(src) {
  const out = []
  let rest = src
  while (rest.length) {
    for (const [cls, re] of RULES) {
      const m = rest.match(re)
      if (m) {
        out.push({ cls, text: m[0] })
        rest = rest.slice(m[0].length)
        break
      }
    }
  }
  return out
}

