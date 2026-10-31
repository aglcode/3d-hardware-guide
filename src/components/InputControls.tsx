import type { Lesson } from '../data/types.ts'
import { setInput, useBench } from '../lib/bench-store.ts'

const CONTROL = 'h-8 rounded-control border border-control bg-surface px-3 text-body transition-colors hover:bg-raised active:bg-active'

export function InputControls({ lesson }: { lesson: Lesson }) {
  const { inputs } = useBench()
  if (!lesson.inputs?.length) return null
  return (
    <div className="ml-auto flex min-w-0 flex-wrap items-center gap-3 pl-3">
      {lesson.inputs.map((input) => {
        const value = inputs[input.id] ?? 0
        if (input.kind === 'slider') {
          const inputId = `input-${input.id}`
          return (
            <div key={input.id} className="flex min-w-0 items-center gap-2">
              <label htmlFor={inputId} className="text-muted">
                {input.label}
              </label>
              <input
                id={inputId}
                type="range"
                min={input.min}
                max={input.max}
                step={input.step}
                value={value}
                onChange={(event) => setInput(input.id, Number(event.target.value))}
                className="w-32 sm:w-44"
              />
              <output htmlFor={inputId} className="w-16 text-right tabular-nums">
                {value}
                {input.unit && <span className="text-small text-muted"> {input.unit}</span>}
              </output>
            </div>
          )
        }
        if (input.kind === 'hold') {
          return (
            <button
              key={input.id}
              type="button"
              aria-pressed={value > 0}
              onPointerDown={() => setInput(input.id, 1)}
              onPointerUp={() => setInput(input.id, 0)}
              onPointerLeave={() => value > 0 && setInput(input.id, 0)}
              onKeyDown={(event) => {
                if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) setInput(input.id, 1)
              }}
              onKeyUp={() => setInput(input.id, 0)}
              className={`${CONTROL} touch-none aria-pressed:bg-active`}
            >
              {input.label}
            </button>
          )
        }
        return (
          <button
            key={input.id}
            type="button"
            aria-pressed={value > 0}
            onClick={() => setInput(input.id, value > 0 ? 0 : 1)}
            className={`${CONTROL} aria-pressed:bg-active`}
          >
            {input.label}: {value > 0 ? input.on : input.off}
          </button>
        )
      })}
    </div>
  )
}
