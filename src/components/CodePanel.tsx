import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '../data/types.ts'
import { useBench } from '../lib/bench-store.ts'
import { highlight } from '../lib/highlight.ts'

export function CodePanel({ lesson }: { lesson: Lesson }) {
  const { run, console: lines, line } = useBench()
  const [fileName, setFileName] = useState(lesson.code[0].name)
  const [copied, setCopied] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const output = useRef<HTMLDivElement>(null)

  const file = lesson.code.find((f) => f.name === fileName) ?? lesson.code[0]
  const isPrimary = file === lesson.code[0]
  const active = isPrimary ? line : null

  useEffect(() => {
    const box = scroller.current
    const row = box?.querySelector<HTMLElement>('[data-active="true"]')
    if (!box || !row) return
    const top = row.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + row.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = top - box.clientHeight / 2
    }
  }, [active])

  useEffect(() => {
    const box = output.current
    if (box) box.scrollTop = box.scrollHeight
  }, [lines])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.source)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const rows = highlight(file.source, file.lang)
  const showConsole = run !== 'stopped' || lines.length > 0

  return (
    <section aria-label="Code" className="flex min-h-0 flex-[1.15] flex-col overflow-hidden rounded-card border border-line">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line py-1 pl-4 pr-1.5">
        <div className="flex min-w-0 gap-3">
          {lesson.code.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => setFileName(f.name)}
              aria-pressed={f === file}
              className={`truncate py-1 font-mono text-small ${f === file ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="shrink-0 rounded-control px-2 py-1 text-small text-muted transition-colors hover:bg-raised hover:text-ink">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </header>

      <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto bg-surface py-2" tabIndex={0} aria-label={`${file.name} source`}>
        <pre className="m-0 w-max min-w-full font-mono text-[12.5px] leading-[19px]">
          <code>
            {rows.map((tokens, i) => {
              const number = i + 1
              return (
                <span key={number} data-active={active === number} className={`flex pr-4 ${active === number ? 'bg-(--code-line)' : ''}`}>
                  <span className="w-9 shrink-0 select-none pr-3 text-right text-muted">{number}</span>
                  <span>
                    {tokens.map((token, t) => (
                      <span key={t} className={token.kind === 'plain' ? undefined : `tok-${token.kind}`}>
                        {token.text}
                      </span>
                    ))}
                    {tokens.length === 0 && ' '}
                  </span>
                </span>
              )
            })}
          </code>
        </pre>
      </div>

      {showConsole && (
        <div className="flex h-24 shrink-0 flex-col border-t border-line bg-raised">
          <p className="flex items-center gap-2 px-4 pt-1.5 text-small text-muted">
            {lesson.consoleTitle}
            <span className="text-small">
              {run === 'running' ? 'Running in simulation' : run === 'loading' ? 'Loading' : 'Stopped'}
            </span>
          </p>
          <div ref={output} role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 pb-1.5 font-mono text-small">
            {lines.map((text, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
