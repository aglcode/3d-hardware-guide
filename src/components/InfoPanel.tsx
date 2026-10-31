import { useState, type KeyboardEvent } from 'react'
import { PI_HEADER, UNO_PIN_GROUPS, pinTone } from '../data/boards.ts'
import type { Lesson } from '../data/types.ts'
import { setHighlight } from '../lib/bench-store.ts'

const TABS = ['Overview', 'Wiring', 'Pinout', 'Specs'] as const
type Tab = (typeof TABS)[number]

function highlightProps(at: string | undefined) {
  if (!at) return {}
  return {
    onMouseEnter: () => setHighlight(at),
    onMouseLeave: () => setHighlight(null),
    onFocus: () => setHighlight(at),
    onBlur: () => setHighlight(null),
    tabIndex: 0,
  }
}

function Overview({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex flex-col gap-3">
      <p>{lesson.overview}</p>
      <ul className="flex flex-col gap-1.5">
        {lesson.learn.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      {lesson.caution && (
        <p className="rounded-control bg-caution-bg px-3 py-2 text-caution-ink">{lesson.caution}</p>
      )}
      {/* On narrow screens the bench shows numbered dots, and this list says what they are. */}
      <ol className="flex flex-col gap-1 sm:hidden">
        {lesson.callouts.map((callout, i) => (
          <li key={callout.title}>
            <span className="font-semibold">
              {i + 1}. {callout.title}.
            </span>{' '}
            <span className="text-muted">{callout.body}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Wiring({ lesson }: { lesson: Lesson }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="text-small text-muted">
          <th scope="col" className="pb-1.5 pr-3 font-normal">From</th>
          <th scope="col" className="pb-1.5 font-normal">To</th>
        </tr>
      </thead>
      <tbody>
        {lesson.wiring.map((row) => (
          <tr key={`${row.from}-${row.to}`} className="border-t border-rule align-top outline-accent hover:bg-raised" {...highlightProps(row.at)}>
            <td className="py-2 pr-3 font-medium">{row.from}</td>
            <td className="py-2">
              {row.to}
              <span className="block text-small text-muted">{row.why}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PiPinout({ lesson }: { lesson: Lesson }) {
  const used = new Set(
    (lesson.bench.wires ?? []).flatMap((wire) => [wire.from, wire.to]).filter((ref) => ref.startsWith('pi.')),
  )
  const rows = Array.from({ length: PI_HEADER.length / 2 }, (_, i) => i)
  return (
    <div>
      <p className="mb-2 text-muted">Pin 1 is at the end furthest from the USB ports. Pins this lesson uses are in bold.</p>
      <table className="w-full border-collapse text-small tabular-nums">
        <tbody>
          {rows.map((row) => {
            const odd = row * 2 + 1
            const even = odd + 1
            const cell = (physical: number, side: 'left' | 'right') => {
              const name = PI_HEADER[physical - 1]
              const ref = `pi.p${physical}`
              const isUsed = used.has(ref)
              return (
                <td {...highlightProps(ref)} className={`w-1/2 py-[3px] hover:bg-raised ${side === 'left' ? 'pr-2 text-right' : 'pl-2'} ${isUsed ? 'font-semibold text-ink' : 'text-muted'}`}>
                  <span className={`inline-flex items-center gap-1.5 ${side === 'left' ? 'flex-row-reverse' : ''}`}>
                    <span className={`pin-${pinTone(name)} inline-block size-2 rounded-full`} aria-hidden="true" />
                    <span className="w-5 text-center font-mono">{physical}</span>
                    <span>{name}</span>
                  </span>
                </td>
              )
            }
            return (
              <tr key={row}>
                {cell(odd, 'left')}
                {cell(even, 'right')}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function UnoPinout() {
  const unoRef = (label: string) => {
    const first = label.split(/[ ,]/)[0]
    return `uno.${first === 'GND' ? 'GND1' : first}`
  }
  return (
    <div className="flex flex-col gap-3">
      {UNO_PIN_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-1 font-semibold">{group.title}</h3>
          <dl>
            {group.pins.map(([label, text]) => (
              <div key={label} className="grid grid-cols-[92px_1fr] gap-2 border-t border-rule py-1.5 hover:bg-raised" {...highlightProps(unoRef(label))}>
                <dt className="font-medium">{label}</dt>
                <dd className="text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

function Specs({ lesson }: { lesson: Lesson }) {
  return (
    <dl>
      {lesson.specs.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[120px_1fr] gap-2 border-t border-rule py-2 first:border-t-0">
          <dt className="text-muted">{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function InfoPanel({ lesson }: { lesson: Lesson }) {
  const [tab, setTab] = useState<Tab>('Overview')

  const onKeyDown = (event: KeyboardEvent) => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const next = TABS[(TABS.indexOf(tab) + direction + TABS.length) % TABS.length]
    setTab(next)
    event.currentTarget.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus()
  }

  const usesPi = lesson.bench.boards.some((b) => b.kind === 'pi')

  return (
    <section aria-label="Lesson information" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-line">
      <div role="tablist" aria-label="Lesson information" onKeyDown={onKeyDown} className="flex shrink-0 gap-4 border-b border-line px-4">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            data-tab={name}
            type="button"
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
            className={`-mb-px border-b-2 py-2.5 transition-colors ${tab === name ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {tab === 'Overview' && <Overview lesson={lesson} />}
        {tab === 'Wiring' && <Wiring lesson={lesson} />}
        {tab === 'Pinout' && (usesPi ? <PiPinout lesson={lesson} /> : <UnoPinout />)}
        {tab === 'Specs' && <Specs lesson={lesson} />}
      </div>
    </section>
  )
}
