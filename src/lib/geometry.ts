import { PI_ANCHORS, PI_HEADER, PI_SIZE, UNO_ANCHORS, UNO_PINS, UNO_SIZE, piPinMm } from '../data/boards.ts'
import type { Bench, BbPart, ModuleKind, ModulePart, Vec3 } from '../data/types.ts'

export const PITCH = 0.254
export const PCB_TOP = 0.56
export const HEADER_TOP = PCB_TOP + 0.85
export const BB_TOP = 0.85
export const BB_SIZE = { w: 8.3, h: 5.5 }
export const BB_ROWS = 30

const COLUMN_Z: Record<string, number> = {
  a: 1.397,
  b: 1.143,
  c: 0.889,
  d: 0.635,
  e: 0.381,
  f: -0.381,
  g: -0.635,
  h: -0.889,
  i: -1.143,
  j: -1.397,
}

const RAIL_Z: Record<string, number> = {
  '+t': -2.413,
  '-t': -2.159,
  '+b': 2.159,
  '-b': 2.413,
}

export function rowX(row: number): number {
  return (row - (BB_ROWS + 1) / 2) * PITCH
}

export type Hole =
  | { type: 'row'; column: string; row: number }
  | { type: 'rail'; rail: string; row: number }

export function parseHole(name: string): Hole | null {
  const rail = name.match(/^([+-][tb])(\d+)$/)
  if (rail) {
    const row = Number(rail[2])
    // The power rails are printed in groups of five, so every sixth position has no hole.
    if (row < 1 || row > 29 || row % 6 === 0) return null
    return { type: 'rail', rail: rail[1], row }
  }
  const body = name.match(/^([a-j])(\d+)$/)
  if (!body) return null
  const row = Number(body[2])
  if (row < 1 || row > BB_ROWS) return null
  return { type: 'row', column: body[1], row }
}

export function holeLocal(name: string): Vec3 {
  const hole = parseHole(name)
  if (!hole) throw new Error(`No breadboard hole called "${name}"`)
  const z = hole.type === 'row' ? COLUMN_Z[hole.column] : RAIL_Z[hole.rail]
  return [rowX(hole.row), BB_TOP, z]
}

/** Local connection points on stand-alone modules: x, y, z in centimetres from the module's origin. */
export const MODULE_PINS: Record<ModuleKind, Record<string, Vec3>> = {
  servo: { GND: [-1.3, 0.25, 1.95], VCC: [-1.3, 0.25, 1.7], SIG: [-1.3, 0.25, 1.45], horn: [0.55, 2.9, 0] },
  motor: { P: [-1.15, 0.62, 0.22], N: [-1.15, 0.62, -0.22], wheel: [1.8, 1.4, 0] },
  pir: { VCC: [-0.25, 0.46, 1.25], OUT: [0, 0.46, 1.25], GND: [0.25, 0.46, 1.25], dome: [0, 1.5, 0] },
  camera: { ribbon: [0, 0.42, -1.3], lens: [0, 0.75, 0] },
  monitor: { in: [2, 1.2, -0.8], screen: [0, 6.8, 0.35] },
  keyboard: { usb: [0, 0.5, -2.4], keys: [0, 0.7, 0] },
  psu: { out: [0, 0.8, -1.5], body: [0, 1.5, 0] },
  ssd: { usb: [-1.2, 0.4, 0], body: [0, 0.8, 0] },
  router: { lan: [0, 1, -1.6], body: [0, 1.6, 0] },
  phone: { screen: [0, 3.3, 0.35] },
  car: { nose: [0, 1.1, -2.5] },
}

export function modulePoint(mod: ModulePart, local: Vec3): Vec3 {
  const rot = mod.rot ?? 0
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return [mod.pos[0] + local[0] * c + local[2] * s, local[1], mod.pos[1] - local[0] * s + local[2] * c]
}

function boardPos(bench: Bench, kind: 'uno' | 'pi') {
  const placed = bench.boards.find((b) => b.kind === kind)
  if (!placed) throw new Error(`This bench has no ${kind} board`)
  return placed.pos
}

export function unoPin(bench: Bench, name: string): Vec3 {
  const mm = UNO_PINS[name]
  if (!mm) throw new Error(`No Uno pin called "${name}"`)
  const pos = boardPos(bench, 'uno')
  return [pos[0] + mm[0] / 10 - UNO_SIZE.w / 2, HEADER_TOP, pos[1] - (mm[1] / 10 - UNO_SIZE.h / 2)]
}

export function piPin(bench: Bench, name: string): Vec3 {
  const physical = Number(name.replace(/^p/, ''))
  if (!/^p\d+$/.test(name) || physical < 1 || physical > PI_HEADER.length) {
    throw new Error(`No Pi pin called "${name}", use a physical number such as p11`)
  }
  const mm = piPinMm(physical)
  const pos = boardPos(bench, 'pi')
  return [pos[0] + mm[0] / 10 - PI_SIZE.w / 2, HEADER_TOP, pos[1] - (mm[1] / 10 - PI_SIZE.h / 2)]
}

function holePoint(bench: Bench, hole: string): Vec3 {
  if (!bench.breadboard) throw new Error('This bench has no breadboard')
  const local = holeLocal(hole)
  return [bench.breadboard[0] + local[0], local[1], bench.breadboard[1] + local[2]]
}

export function partCenter(bench: Bench, part: BbPart): Vec3 {
  const points = Object.values(part.pins).map((h) => holePoint(bench, h))
  const sum = points.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0])
  return [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length]
}

const PART_HEIGHT: Record<BbPart['kind'], number> = {
  led: 1,
  resistor: 0.4,
  button: 0.6,
  pot: 1.4,
  ldr: 0.7,
  buzzer: 1,
  transistor: 0.8,
  diode: 0.4,
  tmp36: 0.8,
  hcsr04: 1.5,
  oled: 1.5,
  bme280: 1.2,
}

/**
 * Turns a reference into a point on the bench. References look like
 * "uno.D13", "pi.p11", "bb.a5", "r1.a" (a leg), "uno@usb" (a place on a board),
 * "servo1.SIG" (a module pin) or a bare part id.
 */
export function resolvePoint(bench: Bench, ref: string): Vec3 {
  const at = ref.indexOf('@')
  if (at > 0) {
    const kind = ref.slice(0, at)
    const name = ref.slice(at + 1)
    if (kind !== 'uno' && kind !== 'pi') throw new Error(`Unknown board in "${ref}"`)
    const table = kind === 'uno' ? UNO_ANCHORS : PI_ANCHORS
    const size = kind === 'uno' ? UNO_SIZE : PI_SIZE
    const anchor = table[name]
    if (!anchor) throw new Error(`No place called "${ref}"`)
    const pos = boardPos(bench, kind)
    return [pos[0] + anchor[0] / 10 - size.w / 2, PCB_TOP + anchor[2], pos[1] - (anchor[1] / 10 - size.h / 2)]
  }
  const dot = ref.indexOf('.')
  const owner = dot > 0 ? ref.slice(0, dot) : ref
  const name = dot > 0 ? ref.slice(dot + 1) : ''
  if (owner === 'uno') return unoPin(bench, name)
  if (owner === 'pi') return piPin(bench, name)
  if (owner === 'bb') return holePoint(bench, name)

  const part = bench.parts?.find((p) => p.id === owner)
  if (part) {
    if (!name) {
      const center = partCenter(bench, part)
      return [center[0], center[1] + PART_HEIGHT[part.kind], center[2]]
    }
    const hole = part.pins[name]
    if (!hole) throw new Error(`Part "${owner}" has no leg "${name}"`)
    return holePoint(bench, hole)
  }
  const mod = bench.modules?.find((m) => m.id === owner)
  if (mod) {
    const pins = MODULE_PINS[mod.kind]
    const local = name ? pins[name] : Object.values(pins).at(-1)
    if (!local) throw new Error(`Module "${owner}" has no point "${name}"`)
    return modulePoint(mod, local)
  }
  throw new Error(`Cannot find "${ref}" on this bench`)
}

export type Bounds = { min: Vec3; max: Vec3 }

const MODULE_EXTENT: Record<ModuleKind, [number, number, number]> = {
  servo: [1.6, 3, 2.1],
  motor: [3, 2.8, 1.8],
  pir: [1.3, 2, 1.5],
  camera: [1.3, 0.8, 1.5],
  monitor: [7, 9.5, 1.2],
  keyboard: [6, 0.8, 2.5],
  psu: [1.5, 2.8, 1.8],
  ssd: [2, 1, 3.2],
  router: [3, 3.6, 2],
  phone: [1.8, 6.4, 1],
  car: [1.6, 2, 4.2],
}

/** The space everything on a bench occupies, used to frame the camera. */
export function benchBounds(bench: Bench): Bounds {
  const min: Vec3 = [Infinity, 0, Infinity]
  const max: Vec3 = [-Infinity, 2, -Infinity]
  const add = (x: number, y: number, z: number) => {
    min[0] = Math.min(min[0], x)
    max[0] = Math.max(max[0], x)
    max[1] = Math.max(max[1], y)
    min[2] = Math.min(min[2], z)
    max[2] = Math.max(max[2], z)
  }
  for (const board of bench.boards) {
    const size = board.kind === 'uno' ? UNO_SIZE : PI_SIZE
    add(board.pos[0] - size.w / 2 - 0.6, 1.6, board.pos[1] - size.h / 2)
    add(board.pos[0] + size.w / 2 + 0.3, 1.6, board.pos[1] + size.h / 2 + 0.3)
  }
  if (bench.breadboard) {
    add(bench.breadboard[0] - BB_SIZE.w / 2, 2.5, bench.breadboard[1] - BB_SIZE.h / 2)
    add(bench.breadboard[0] + BB_SIZE.w / 2, 2.5, bench.breadboard[1] + BB_SIZE.h / 2)
  }
  for (const mod of bench.modules ?? []) {
    const e = MODULE_EXTENT[mod.kind]
    add(mod.pos[0] - e[0], e[1], mod.pos[1] - e[2])
    add(mod.pos[0] + e[0], e[1], mod.pos[1] + e[2])
  }
  return { min, max }
}
