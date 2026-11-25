// Chapter 03 on the laptop, t in 0..1:
//   0.00–0.12  Figma slides away to the left, the editor comes in from the right,
//              like switching between full-screen apps
//   0.10–0.96  the component is typed top to bottom; a small Figma window in the
//              corner selects the element whose code is being written
// Chapter 04 then slides the editor away for the browser with the live page.

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const seg = (t, a, b) => clamp01((t - a) / (b - a))
export const inOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export function codeTimeline(t) {
  return {
    slide: inOut(seg(t, 0, 0.12)),
    typed: seg(t, 0.1, 0.96),
    pip: t > 0.14 && t < 0.97,
  }
}
