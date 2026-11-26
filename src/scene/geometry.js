// Geometry of the desk scene, in pixels of the source frames (2736 x 1536).
// Every frame shares one locked-off camera, so these numbers hold for K1–K5.

export const FRAME = { w: 2736, h: 1536 }

// Wall above and floor below the photo (outpainted K1, scripts/build-extension.mjs),
// so the camera can frame the scene taller than 16:9: portrait screens and the laptop
// close-up. Stage coordinates: the top strip starts at y = -top. Each strip reaches
// `overlap` px into the photo, where it crossfades into it.
export const EXTEND = { top: 942, bottom: 942, overlap: 40 }

// Laptop display area: measured on the K2 -> K3 difference
//   npm run measure -- diff frames/test/k2-flux-sketch-no-letters.png frames/test/k3-flux-figma.png 1250 20 900 620 8
export const LAPTOP = [
  [1363.4, 67.6],
  [2080.7, 149.4],
  [2021.3, 601.2],
  [1317.7, 498.6],
]

// Phone glass in the hand, K5 (variant B), notch and status bar row included:
//   npm run measure -- bright frames/test/k5-flux-hand-b.png 1960 680 420 500 150
export const PHONE = [
  [1998.3, 752.1],
  [2173.6, 705.8],
  [2327.3, 1090.4],
  [2146.4, 1143.5],
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

// Area that catches the laptop screen light: keyboard and bottom bezel.
export const GLOW = { x: 1164, y: 470, w: 900, h: 400 }

// Size of the HTML on a screen when it is not the one we zoom into.
export const DESIGN = {
  laptop: { w: 1440, h: 900 },
  phone: { w: 390, h: 862 },
}
