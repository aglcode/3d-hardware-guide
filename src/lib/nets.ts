import { PI_HEADER, UNO_PINS } from '../data/boards.ts'
import type { Bench, BbPart } from '../data/types.ts'
import { MODULE_PINS, parseHole, resolvePoint } from './geometry.ts'

/** The node a breadboard hole belongs to: five holes in a row, or a whole power rail. */
function holeNode(name: string): string {
  const hole = parseHole(name)
  if (!hole) throw new Error(`No breadboard hole called "${name}"`)
  if (hole.type === 'rail') return `rail:${hole.rail}`
  return `row:${hole.row}:${'abcde'.includes(hole.column) ? 'near' : 'far'}`
}

function boardNode(ref: string): string | null {
  if (ref.startsWith('uno.')) {
    const name = ref.slice(4)
    if (!UNO_PINS[name]) throw new Error(`No Uno pin called "${name}"`)
    return name.startsWith('GND') ? 'uno:GND' : `uno:${name}`
  }
  if (ref.startsWith('pi.')) {
    const physical = Number(ref.slice(4))
    const signal = PI_HEADER[physical - 1]
    if (!signal) throw new Error(`No Pi pin called "${ref}"`)
    return `pi:${signal}`
  }
  return null
}

/** Legs that a part joins together internally, such as the pairs on a tactile button. */
const INTERNAL_LINKS: Partial<Record<BbPart['kind'], [string, string][]>> = {
  button: [
    ['a', 'a2'],
    ['b', 'b2'],
  ],
}

function legNode(part: BbPart, leg: string): string {
  return `leg:${part.id}.${leg}`
}

/** Pins that must never share a net: tying these together shorts a supply or feeds 5 V into a 3.3 V pin. */
function forbiddenPairs(nodes: Iterable<string>): [string, string][] {
  const all = [...nodes]
  const pairs: [string, string][] = [
    ['uno:5V', 'uno:GND'],
    ['uno:3V3', 'uno:GND'],
    ['uno:5V', 'uno:3V3'],
    ['pi:5V', 'pi:GND'],
    ['pi:3V3', 'pi:GND'],
    ['pi:5V', 'pi:3V3'],
  ]
  for (const node of all) {
    if (node.startsWith('pi:GPIO')) pairs.push(['pi:5V', node])
  }
  return pairs
}

export function checkBench(lessonId: string, bench: Bench): string[] {
  const problems: string[] = []
  const report = (message: string) => problems.push(`${lessonId}: ${message}`)

  const parent = new Map<string, string>()
  const find = (node: string): string => {
    if (!parent.has(node)) parent.set(node, node)
    const up = parent.get(node)!
    if (up === node) return node
    const root = find(up)
    parent.set(node, root)
    return root
  }
  const union = (a: string, b: string) => parent.set(find(a), find(b))

  const parts = bench.parts ?? []
  const modules = bench.modules ?? []

  const ids = [...parts.map((p) => p.id), ...modules.map((m) => m.id)]
  if (new Set(ids).size !== ids.length) report('two parts share an id')

  const usedHoles = new Map<string, string>()
  const claimHole = (hole: string, owner: string) => {
    const previous = usedHoles.get(hole)
    if (previous) report(`hole ${hole} is used by both ${previous} and ${owner}`)
    usedHoles.set(hole, owner)
  }

  for (const part of parts) {
    for (const [leg, hole] of Object.entries(part.pins)) {
      if (!parseHole(hole)) {
        report(`${part.id}.${leg} sits in a hole that does not exist: ${hole}`)
        continue
      }
      claimHole(hole, `${part.id}.${leg}`)
      union(legNode(part, leg), holeNode(hole))
    }
    for (const [a, b] of INTERNAL_LINKS[part.kind] ?? []) {
      union(legNode(part, a), legNode(part, b))
    }
  }

  const nodeFor = (ref: string): string => {
    const board = boardNode(ref)
    if (board) return board
    if (ref.startsWith('bb.')) return holeNode(ref.slice(3))
    const dot = ref.indexOf('.')
    const owner = ref.slice(0, dot)
    const name = ref.slice(dot + 1)
    const part = parts.find((p) => p.id === owner)
    if (part) {
      if (!part.pins[name]) throw new Error(`Part "${owner}" has no leg "${name}"`)
      return legNode(part, name)
    }
    const mod = modules.find((m) => m.id === owner)
    if (mod) {
      if (!MODULE_PINS[mod.kind][name]) throw new Error(`Module "${owner}" has no pin "${name}"`)
      return `mod:${ref}`
    }
    throw new Error(`Cannot find "${ref}" on this bench`)
  }

  const usedBoardPins = new Map<string, string>()
  for (const wire of bench.wires ?? []) {
    for (const ref of [wire.from, wire.to]) {
      try {
        resolvePoint(bench, ref)
        const node = nodeFor(ref)
        find(node)
        if (ref.startsWith('bb.')) claimHole(ref.slice(3), `the wire ${wire.from} to ${wire.to}`)
        if (ref.startsWith('uno.') || ref.startsWith('pi.')) {
          if (usedBoardPins.has(ref)) report(`two wires share the one socket ${ref}`)
          usedBoardPins.set(ref, wire.from)
        }
      } catch (error) {
        report((error as Error).message)
      }
    }
    try {
      union(nodeFor(wire.from), nodeFor(wire.to))
    } catch {
      // Already reported above.
    }
  }

  for (const cable of bench.cables ?? []) {
    for (const ref of [cable.from, cable.to]) {
      try {
        resolvePoint(bench, ref)
      } catch (error) {
        report((error as Error).message)
      }
    }
  }

  for (const [a, b] of forbiddenPairs(parent.keys())) {
    if (parent.has(a) && parent.has(b) && find(a) === find(b)) {
      report(`${a} and ${b} are shorted together`)
    }
  }

  const netRoots = (bench.nets ?? []).map((net) => {
    const roots = new Set<string>()
    for (const ref of net) {
      try {
        roots.add(find(nodeFor(ref)))
      } catch (error) {
        report((error as Error).message)
      }
    }
    if (roots.size > 1) report(`expected these to be connected: ${net.join(', ')}`)
    return [...roots][0]
  })
  if (new Set(netRoots).size !== netRoots.length) {
    report('two nets that should stay separate are connected')
  }

  // Every leg must reach something other than its own row, or the part does nothing.
  const netSize = new Map<string, number>()
  const members = new Set<string>()
  for (const part of parts) {
    for (const leg of Object.keys(part.pins)) members.add(legNode(part, leg))
  }
  for (const wire of bench.wires ?? []) {
    try {
      members.add(nodeFor(wire.from))
      members.add(nodeFor(wire.to))
    } catch {
      // Already reported above.
    }
  }
  for (const node of members) {
    const root = find(node)
    netSize.set(root, (netSize.get(root) ?? 0) + 1)
  }
  for (const part of parts) {
    for (const [leg] of Object.entries(part.pins)) {
      const node = legNode(part, leg)
      const linked = (INTERNAL_LINKS[part.kind] ?? []).some((pair) => pair.includes(leg))
      if (!linked && netSize.get(find(node)) === 1) report(`${part.id}.${leg} is not connected to anything`)
    }
  }

  return problems
}
