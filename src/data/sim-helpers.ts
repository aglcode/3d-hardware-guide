import type { SimContext } from './types.ts'

/** The 1-based line a snippet appears on, so a highlighted line cannot drift away from the code. */
export function lineOf(source: string, snippet: string, occurrence = 1): number {
  const lines = source.split('\n')
  let seen = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(snippet)) {
      seen++
      if (seen === occurrence) return i + 1
    }
  }
  throw new Error(`The code has no line containing "${snippet}"`)
}

/** True once each time `period` seconds have passed. */
export function every(ctx: SimContext, key: string, period: number): boolean {
  const due = ctx.mem[key] ?? 0
  if (ctx.t < due) return false
  ctx.mem[key] = ctx.t + period
  return true
}

/** True on the tick where a value differs from the one seen last time. */
export function changed(ctx: SimContext, key: string, value: number): boolean {
  const before = ctx.mem[key]
  ctx.mem[key] = value
  return before !== undefined && before !== value
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export const UPLOAD = ['Compiling sketch', 'Uploading over USB', 'Upload finished, the board restarts']
