// Photographs the real app for the intro video. Needs Node 22 and `npm run preview` running on port 4173.
// Writes to video-assets/, which only the Remotion render reads.
import { mkdirSync, writeFileSync } from 'node:fs'
import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = 'video-assets'
mkdirSync(OUT, { recursive: true })

const browser = await Browser.launch({ width: 1440, height: 900 })
const page = await browser.newPage()
await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false })

const ev = async (expression) => {
  const result = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  return result.result.value
}

const open = async (id) => {
  await page.send('Page.navigate', { url: `${BASE}/#${id}` })
  await sleep(300)
  await ev(`localStorage.setItem('benchtop.theme','light');location.reload()`)
  await sleep(4500)
}

const shot = async (name) => {
  const { data } = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 86 }, 45000)
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(data, 'base64'))
  console.log(`saved ${name}.jpg`)
}

const key = async (text) => {
  const code = `Key${text.toUpperCase()}`
  const vk = text.toUpperCase().charCodeAt(0)
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: text, code, text, windowsVirtualKeyCode: vk })
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: text, code, windowsVirtualKeyCode: vk })
  await sleep(1000)
}

const setSlider = (value) =>
  ev(`(()=>{const i=document.querySelector('input[type=range]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${value}');i.dispatchEvent(new Event('input',{bubbles:true}))})()`)

const run = async () => {
  await ev(`[...document.querySelectorAll('button')].find((b)=>/^Run /.test(b.textContent)).click()`)
  await sleep(4000)
}

await open('blink-an-led')
await shot('blink')
await key('q')
await key('q')
await shot('orbit')
await key('r')

await ev(`document.querySelector('[data-tab="Wiring"]').click()`)
await sleep(300)
const row = await ev(`(()=>{const r=document.querySelectorAll('[role=tabpanel] tbody tr')[1].getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`)
await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: row[0], y: row[1] })
await sleep(800)
await shot('wiring')
await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 30 })

await open('dimmer-knob')
await setSlider(820)
await sleep(500)
await shot('dimmer-idle')
await run()
await shot('running')

await open('servo-knob')
await setSlider(120)
await run()
await sleep(1000)
await shot('servo-low')
await setSlider(900)
await sleep(1500)
await shot('servo-high')

await open('meet-the-pi')
await shot('pi-tour')
await open('file-server')
await shot('file-server')

await open('blink-an-led')
await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '?', code: 'Slash', text: '?', windowsVirtualKeyCode: 191, modifiers: 8 })
await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '?', code: 'Slash', windowsVirtualKeyCode: 191, modifiers: 8 })
await sleep(600)
await shot('shortcuts')

await browser.close()
process.exit(0)
