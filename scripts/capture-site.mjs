// Screenshots of a live site for a case: desktop and phone, at several scroll
// positions, as PNG. Pick the good ones and convert them to WebP for
// public/cases/<slug>/ (see src/content/cases.js).
//
//   node scripts/capture-site.mjs <url> <out-dir> [--desktop 0,1,2] [--mobile 0,1,2]
//
// Positions are in screen heights: 0 — the first screen, 1.5 — one and a half screens
// down. Scrolling is done with the mouse wheel, so smooth-scroll libraries
// (Locomotive Scroll and the like) follow it too.
// Needs Google Chrome and Node 22+ (built-in WebSocket); with nvm on this machine:
//   C:\Users\admin\AppData\Local\nvm\v24.13.1\node.exe scripts/capture-site.mjs …

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url, out, ...rest] = process.argv.slice(2)
if (!url || !out) {
  console.log('usage: node scripts/capture-site.mjs <url> <out-dir> [--desktop 0,1,2] [--mobile 0,1,2]')
  process.exit(1)
}
if (typeof WebSocket === 'undefined') {
  console.log('Needs Node 22 or newer (built-in WebSocket).')
  process.exit(1)
}
const opt = (name, def) => {
  const i = rest.indexOf(name)
  return (i >= 0 ? rest[i + 1] : def).split(',').map(Number)
}
const DESKTOP = opt('--desktop', '0,1,2')
const MOBILE = opt('--mobile', '0,1,2')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9333
const profile = mkdtempSync(join(tmpdir(), 'capture-'))
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--hide-scrollbars',
  '--no-first-run',
  '--mute-audio',
  'about:blank',
])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json())
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(200)
  }
  throw new Error('Chrome did not start')
}

const ws = new WebSocket(await target())
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
const waiters = []
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
  } else if (msg.method) {
    for (const w of waiters.splice(0)) w(msg)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
const event = (name, timeout = 30000) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, timeout)
    const check = (msg) => (msg.method === name ? (clearTimeout(t), resolve(msg)) : waiters.push(check))
    waiters.push(check)
  })

// close cookie notes and the like: a visible button that just says OK in a fixed box
const DISMISS = `(() => {
  for (const el of document.querySelectorAll('button, a, .btn, [class*=btn]')) {
    const t = el.textContent.trim().toLowerCase()
    if (!['ok', 'ок', 'okay', 'принять', 'согласен', 'зрозуміло'].includes(t)) continue
    let p = el
    while (p && getComputedStyle(p).position !== 'fixed') p = p.parentElement
    if (p) el.click()
  }
})()`

async function shoot(file) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(file)
}

async function pass(kind, metrics, positions) {
  await send('Emulation.setDeviceMetricsOverride', metrics)
  await send('Emulation.setTouchEmulationEnabled', { enabled: metrics.mobile })
  if (metrics.mobile) {
    await send('Emulation.setUserAgentOverride', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
  }
  const loaded = event('Page.loadEventFired')
  await send('Page.navigate', { url })
  await loaded
  await sleep(4000) // preloaders, fonts, entrance animations
  await send('Runtime.evaluate', { expression: DISMISS })
  await sleep(600)
  let at = 0
  for (const k of positions) {
    // scroll down in wheel steps, like a visitor, so scroll-triggered animations run
    let rest = (k - at) * metrics.height
    while (rest > 1) {
      const step = Math.min(240, rest)
      await send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: metrics.width / 2,
        y: metrics.height / 2,
        deltaX: 0,
        deltaY: step,
      })
      rest -= step
      await sleep(60)
    }
    at = k
    await sleep(1800)
    await shoot(join(out, `${kind}-${String(k).replace('.', '_')}.png`))
  }
}

try {
  mkdirSync(out, { recursive: true })
  await send('Page.enable')
  await pass('desktop', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false }, DESKTOP)
  await pass('mobile', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, MOBILE)
} finally {
  ws.close()
  chrome.kill()
  await sleep(500)
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {}
}
