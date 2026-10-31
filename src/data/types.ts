export type BoardKind = 'uno' | 'pi'

/** Bench coordinates in centimetres: x to the right, z towards the viewer. */
export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export type BbPartKind =
  | 'led'
  | 'resistor'
  | 'button'
  | 'pot'
  | 'ldr'
  | 'buzzer'
  | 'transistor'
  | 'diode'
  | 'tmp36'
  | 'hcsr04'
  | 'oled'
  | 'bme280'

/** A part whose legs sit in breadboard holes. `pins` maps a leg name to a hole such as "c12" or "-b4". */
export type BbPart = {
  id: string
  kind: BbPartKind
  pins: Record<string, string>
  color?: string
  ohms?: number
}

export type ModuleKind =
  | 'servo'
  | 'motor'
  | 'pir'
  | 'camera'
  | 'monitor'
  | 'keyboard'
  | 'psu'
  | 'ssd'
  | 'router'
  | 'phone'
  | 'car'

/** A part that stands on the bench on its own and is reached by wires or cables. */
export type ModulePart = {
  id: string
  kind: ModuleKind
  pos: Vec2
  rot?: number
}

export const WIRE_COLORS = {
  red: '#d7352b',
  black: '#23262b',
  yellow: '#e4b21c',
  green: '#2d9a55',
  blue: '#2f70bb',
  orange: '#e0761d',
  white: '#e9e9e4',
} as const

export type WireColor = keyof typeof WIRE_COLORS

/** A jumper wire. It is part of the circuit and the checker follows it. */
export type Wire = {
  from: string
  to: string
  color: WireColor
}

/** A manufactured cable between ports. Drawn on the bench, not part of the circuit. */
export type Cable = {
  from: string
  to: string
  color?: string
  ribbon?: boolean
}

export type Bench = {
  boards: { kind: BoardKind; pos: Vec2 }[]
  breadboard?: Vec2
  parts?: BbPart[]
  modules?: ModulePart[]
  wires?: Wire[]
  cables?: Cable[]
  /** Connections that must exist, each listed as references that share one net. */
  nets?: string[][]
}

export type Slot = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br'

export type Callout = {
  title: string
  body: string
  at: string
  slot: Slot
}

export type WiringRow = {
  from: string
  to: string
  why: string
  /** Point on the bench lit up while this row is hovered. */
  at?: string
}

export type CodeLang = 'cpp' | 'python' | 'bash'

export type CodeFile = {
  name: string
  lang: CodeLang
  source: string
}

export type SimInput =
  | {
      id: string
      kind: 'slider'
      label: string
      min: number
      max: number
      step: number
      initial: number
      unit?: string
    }
  | { id: string; kind: 'hold' | 'toggle'; label: string; on?: string; off?: string }

export type SimOutputs = Record<string, number | string>

export type SimContext = {
  /** Seconds since the program started. */
  t: number
  input: (id: string) => number
  print: (line: string) => void
  /** Scratch values kept between ticks; cleared on every run. */
  mem: Record<string, number>
}

export type Lesson = {
  id: string
  board: BoardKind
  use: string
  title: string
  /** The sentence under the title: what you end up with. */
  summary: string
  overview: string
  learn: string[]
  /** Set when getting this wrong can damage something. */
  caution?: string
  bench: Bench
  callouts: Callout[]
  wiring: WiringRow[]
  specs: [string, string][]
  code: CodeFile[]
  inputs?: SimInput[]
  /** Lines printed while the program is being loaded. */
  boot: string[]
  consoleTitle: string
  tick: (ctx: SimContext) => SimOutputs
}
