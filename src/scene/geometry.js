// Geometry of the desk scene, in pixels of the source frames (2736 x 1536).
// Every frame shares one locked-off camera, so these numbers hold for K1–K5.

export const FRAME = { w: 2736, h: 1536 }

// Laptop display area: measured on the K2 -> K3 difference
//   npm run measure -- diff frames/test/k2-flux-sketch-no-letters.png frames/test/k3-flux-figma.png 1250 20 900 620 8
export const LAPTOP = [
  [1364.8, 68.8],
  [2081.1, 149.7],
  [2016.9, 600.1],
  [1318.3, 498.2],
]

// Phone screen in the hand, K5 (variant B):
//   npm run measure -- bright frames/test/k5-flux-hand-b.png 1960 680 420 500 150
export const PHONE = [
  [2006.1, 770.9],
  [2176.7, 714.0],
  [2326.6, 1090.1],
  [2146.5, 1143.1],
]

// Sheet of paper (approximate, for the sketch reveal direction).
export const SHEET = {
  tl: [636, 917],
  tr: [1156, 807],
  br: [1491, 1252],
  bl: [889, 1423],
}

// Box around the sheet (with its curled corner) that the stroke-by-stroke drawing
// covers; scripts/build-sketch.mjs cuts the sheet image and the order map to it.
export const SKETCH_BOX = { x: 620, y: 795, w: 890, h: 640 }

// The part of the frame that moves in the V3 video (hand picks up the phone);
// scripts/build-video.mjs keeps only this box, the photos show the rest.
export const VIDEO_BOX = { x: 1800, y: 600, w: 936, h: 936 }

// Horizontal focus points for portrait screens, where only a slice of the frame fits.
export const FOCUS = { sheet: 1060, laptop: 1690, phone: 2166 }

// Area that catches the laptop screen light: keyboard and bottom bezel.
export const GLOW = { x: 1164, y: 470, w: 900, h: 400 }

// Size of the HTML on a screen when it is not the one we zoom into.
export const DESIGN = {
  laptop: { w: 1440, h: 900 },
  phone: { w: 390, h: 862 },
}
