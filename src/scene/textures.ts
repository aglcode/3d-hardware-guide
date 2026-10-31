import * as THREE from 'three'

const SILK = '#f4f6f4'

function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')!
  draw(g)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** A small repeatable random so the copper traces come out the same on every load. */
function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return value / 2147483647
  }
}

function traces(g: CanvasRenderingContext2D, w: number, h: number, color: string, count: number, seed: number) {
  const random = seeded(seed)
  g.strokeStyle = color
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (let i = 0; i < count; i++) {
    let x = random() * w
    let y = random() * h
    g.lineWidth = 2 + random() * 3
    g.beginPath()
    g.moveTo(x, y)
    const bends = 2 + Math.floor(random() * 3)
    for (let b = 0; b < bends; b++) {
      const length = 40 + random() * 220
      const direction = Math.floor(random() * 8) * (Math.PI / 4)
      x += Math.cos(direction) * length
      y += Math.sin(direction) * length
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, rotate = 0, align: CanvasTextAlign = 'center') {
  g.save()
  g.translate(x, y)
  g.rotate(rotate)
  g.font = `600 ${size}px Arial, Helvetica, sans-serif`
  g.textAlign = align
  g.textBaseline = 'middle'
  g.fillText(text, 0, 0)
  g.restore()
}

/** Uno top side: scale is pixels per millimetre, y measured from the power-header edge. */
export function unoTexture(pins: Record<string, [number, number]>) {
  const scale = 30
  const w = 68.6 * scale
  const h = 53.4 * scale
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#0c4483'
    g.fillRect(0, 0, w, h)
    traces(g, w, h, '#135595', 170, 4242)

    const mm = (x: number, y: number): [number, number] => [x * scale, h - y * scale]

    g.fillStyle = SILK
    g.strokeStyle = SILK
    for (const [name, [x, y]] of Object.entries(pins)) {
      if (name === 'NC') continue
      const [px, py] = mm(x, y)
      const display = name.replace(/^GND\d$/, 'GND').replace(/^D(\d+)$/, '$1')
      const isPwm = ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'].includes(name)
      const text = isPwm ? `~${display}` : display
      const above = y > 25
      label(g, text, px, py + (above ? 100 : -100), 34, -Math.PI / 2)
    }

    label(g, 'DIGITAL (PWM ~)', ...mm(47, 41.5), 40)
    label(g, 'POWER', ...mm(37, 10.5), 36)
    label(g, 'ANALOG IN', ...mm(57, 10.5), 36)
    label(g, 'UNO', ...mm(49, 31), 120)
    label(g, 'L', ...mm(25.8, 43), 30)
    label(g, 'TX', ...mm(25.4, 36.6), 28)
    label(g, 'RX', ...mm(25.4, 33.9), 28)
    label(g, 'ON', ...mm(58.5, 39), 28)
    label(g, 'RESET', ...mm(6.2, 45.2), 26)
    label(g, 'ICSP', ...mm(60.5, 28), 26, -Math.PI / 2)
    label(g, 'ICSP1', ...mm(18.5, 42.8), 26)

    g.strokeStyle = '#e4e6e8'
    g.lineWidth = 12
    for (const [x, y] of [[14, 2.54], [15.3, 50.8], [66.1, 7.6], [66.1, 35.6]] as const) {
      const [px, py] = mm(x, y)
      g.beginPath()
      g.arc(px, py, 58, 0, Math.PI * 2)
      g.stroke()
    }
  })
}

/** Pi 5 top side, printed labels placed to match the photo. */
export function piTexture() {
  const scale = 26
  const w = 85 * scale
  const h = 56 * scale
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#2f9c5c'
    g.fillRect(0, 0, w, h)
    traces(g, w, h, '#3aab69', 210, 90125)

    const mm = (x: number, y: number): [number, number] => [x * scale, h - y * scale]

    g.fillStyle = SILK
    label(g, 'Raspberry Pi 5', ...mm(30, 47), 62)
    label(g, 'HAT+ GPIO INTERFACE', ...mm(50, 48), 28)
    label(g, 'HDMI', ...mm(32.5, 9.6), 74)
    label(g, 'HDMI0', ...mm(25.8, 8.2), 22)
    label(g, 'HDMI1', ...mm(39.2, 8.2), 22)
    label(g, 'UART', ...mm(33, 1), 24)
    label(g, 'POWER', ...mm(11.2, 7.5), 24)
    label(g, 'RTC', ...mm(19.5, 1.8), 24)
    label(g, 'FAN', ...mm(62.8, 56 - 1.6), 24)
    label(g, 'CAM/DISP 0', ...mm(46.4, 9), 22, -Math.PI / 2)
    label(g, 'CAM/DISP 1', ...mm(52.6, 9), 22, -Math.PI / 2)
    label(g, 'PCIe', ...mm(6, 30), 26, -Math.PI / 2)
    label(g, 'ETHERNET', ...mm(75, 1), 24)
    label(g, 'PoE', ...mm(62, 12.5), 22)
    label(g, 'PWR', ...mm(5.4, 18.8), 18)
    label(g, 'ACT', ...mm(5.4, 17), 18)

    // The outline of pin 1, the one thing everyone needs to find on this header.
    g.strokeStyle = SILK
    g.lineWidth = 5
    const [px, py] = mm(8.37 - 1.27, 51.23 + 1.27)
    g.strokeRect(px, py, 2.54 * scale, 2.54 * scale)
    label(g, '1', ...mm(8.4, 49.2), 28)

    g.strokeStyle = '#efc23b'
    g.lineWidth = 34
    for (const [x, y] of [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]] as const) {
      const [cx, cy] = mm(x, y)
      g.beginPath()
      g.arc(cx, cy, 52, 0, Math.PI * 2)
      g.stroke()
    }
  })
}

export function breadboardTexture(holes: { x: number; z: number }[], rows: { row: number; x: number }[], letters: { letter: string; z: number }[], railLines: { z: number; color: string }[], width: number, depth: number) {
  const scale = 180
  const w = Math.round(width * scale)
  const h = Math.round(depth * scale)
  return canvasTexture(w, h, (g) => {
    const px = (x: number) => (x + width / 2) * scale
    const pz = (z: number) => (z + depth / 2) * scale

    g.fillStyle = '#efece3'
    g.fillRect(0, 0, w, h)

    // The groove down the middle, which a chip or button straddles.
    g.fillStyle = '#dcd8cb'
    g.fillRect(0, pz(-0.09), w, 0.18 * scale)

    for (const line of railLines) {
      g.fillStyle = line.color
      g.fillRect(px(-width / 2 + 0.2), pz(line.z) - 2, w - 0.4 * scale, 5)
    }

    g.fillStyle = '#2a2d31'
    const hole = 0.09 * scale
    for (const { x, z } of holes) g.fillRect(px(x) - hole / 2, pz(z) - hole / 2, hole, hole)

    g.fillStyle = '#6a6c6a'
    for (const { row, x } of rows) {
      if (row === 1 || row % 5 === 0) {
        label(g, String(row), px(x), pz(-1.68), 24)
        label(g, String(row), px(x), pz(1.68), 24)
      }
    }
    for (const { letter, z } of letters) {
      label(g, letter, px(-width / 2 + 0.17), pz(z), 22)
      label(g, letter, px(width / 2 - 0.17), pz(z), 22)
    }
  })
}

export type ScreenStyle = { background: string; ink: string; size: number; align?: CanvasTextAlign }

export function createScreen(width: number, height: number, style: ScreenStyle) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const draw = (text: string) => {
    g.fillStyle = style.background
    g.fillRect(0, 0, width, height)
    g.fillStyle = style.ink
    g.textBaseline = 'middle'
    g.textAlign = style.align ?? 'left'
    const lines = text.split('\n')
    const pitch = style.size * 1.35
    const top = height / 2 - ((lines.length - 1) * pitch) / 2
    const x = style.align === 'center' ? width / 2 : style.size
    lines.forEach((line, i) => {
      g.font = `${i === 0 ? 700 : 500} ${style.size}px "IBM Plex Sans", Arial, sans-serif`
      g.fillText(line, x, top + i * pitch)
    })
    texture.needsUpdate = true
  }
  draw('')
  return { texture, draw }
}
