import { useSyncExternalStore } from 'react'
import type { Lesson, SimContext, SimOutputs } from '../data/types.ts'

export type RunState = 'stopped' | 'loading' | 'running'

export type BenchUi = {
  run: RunState
  console: string[]
  line: number | null
  inputs: Record<string, number>
  highlight: string | null
  labels: boolean
}

const MAX_CONSOLE_LINES = 120
const LINE_GAP = 0.45

let ui: BenchUi = { run: 'stopped', console: [], line: null, inputs: {}, highlight: null, labels: true }
const listeners = new Set<() => void>()

function publish(next: Partial<BenchUi>) {
  ui = { ...ui, ...next }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useBench(): BenchUi {
  return useSyncExternalStore(subscribe, () => ui)
}

export function subscribeBench(listener: () => void) {
  return subscribe(listener)
}

/** Values the 3D parts read on each frame. Kept out of React so a running sketch never re-renders the page. */
export const live: { outputs: SimOutputs; inputs: Record<string, number> } = { outputs: {}, inputs: {} }

let lesson: Lesson | null = null
let clock = 0
let bootLeft: string[] = []
let bootTimer = 0
let ctx: SimContext | null = null

function initialInputs(target: Lesson): Record<string, number> {
  const inputs: Record<string, number> = {}
  for (const input of target.inputs ?? []) {
    inputs[input.id] = input.kind === 'slider' ? input.initial : 0
  }
  return inputs
}

export function loadLesson(target: Lesson) {
  lesson = target
  bootLeft = []
  ctx = null
  const inputs = initialInputs(target)
  live.inputs = inputs
  live.outputs = {}
  publish({ run: 'stopped', console: [], line: null, inputs, highlight: null })
}

export function startRun() {
  if (!lesson) return
  clock = 0
  bootLeft = [...lesson.boot]
  bootTimer = 0
  ctx = null
  live.outputs = {}
  publish({ run: 'loading', console: [], line: null })
}

export function stopRun() {
  ctx = null
  bootLeft = []
  live.outputs = {}
  publish({ run: 'stopped', line: null })
}

export function setInput(id: string, value: number) {
  live.inputs = { ...live.inputs, [id]: value }
  publish({ inputs: live.inputs })
}

export function setHighlight(ref: string | null) {
  if (ref !== ui.highlight) publish({ highlight: ref })
}

export function setLabels(labels: boolean) {
  publish({ labels })
}

/** Advances the running program. The 3D stage calls this once per frame. */
export function stepRun(dt: number) {
  if (!lesson || ui.run === 'stopped') return

  if (ui.run === 'loading') {
    bootTimer -= dt
    if (bootTimer > 0) return
    const next = bootLeft.shift()
    if (next !== undefined) {
      bootTimer = LINE_GAP
      publish({ console: [...ui.console, next] })
      return
    }
    const fresh: SimContext = {
      t: 0,
      input: (id) => live.inputs[id] ?? 0,
      print: (text) => pending.push(text),
      mem: {},
    }
    ctx = fresh
    clock = 0
    publish({ run: 'running' })
  }

  if (!ctx) return
  ctx.t = clock
  const outputs = lesson.tick(ctx)
  clock += dt
  live.outputs = outputs

  const line = typeof outputs.line === 'number' ? outputs.line : null
  if (pending.length || line !== ui.line) {
    const lines = pending.length ? [...ui.console, ...pending].slice(-MAX_CONSOLE_LINES) : ui.console
    pending.length = 0
    publish({ console: lines, line })
  }
}

const pending: string[] = []
