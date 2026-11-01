import { BOARDS } from '../data/boards.ts'
import { INTRO_SCENES } from '../data/intro-script.ts'
import { LESSONS, lessonGroups } from '../data/lessons.ts'
import type { BoardKind } from '../data/types.ts'

const BOARD_ORDER: BoardKind[] = ['uno', 'pi']

const CHOOSE_A_BOARD: Record<BoardKind, string> = {
  uno: 'Runs one program from the moment it gets power. Good for sensors, motors and exact timing, and the simplest place to begin.',
  pi: 'A small Linux computer you program in Python. Good for anything that needs a network, files, a camera or a screen.',
}

const LESSON_STEPS = [
  ['Pick a lesson', 'Choose a board at the top, then a lesson from the list.'],
  ['Look around', 'Drag the bench to orbit and scroll to zoom. Labels name each part.'],
  ['Follow the wiring', 'The Wiring and Pinout tabs show each connection. Hover a row to mark it on the bench.'],
  ['Press Run', 'The program runs in a simulation. The current line lights up and the output appears below the code.'],
  ['Change the inputs', 'Where a lesson has a slider or button, use it and watch the parts respond.'],
  ['Build it for real', 'Copy the code and use the Wiring tab as your parts list when you are ready.'],
] as const

const GUIDELINES = [
  'Run is a simulation. It needs no hardware, and it does not compile code or talk to a real board.',
  'Unplug the power before you change any wiring, and check every connection before you plug it back in.',
  'Raspberry Pi GPIO pins run at 3.3 V. Never connect 5 V to one, it can permanently damage the Pi.',
  'Give every LED a resistor, and do not power a motor straight from a pin.',
  'Sensor and display modules differ between makers, so follow the pin labels printed on yours.',
]

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-2 text-section font-semibold">{children}</h2>
}

export function GettingStarted({ done, onPick }: { done: string[]; onPick: (id: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-80">
          <h1 className="text-title font-semibold tracking-[-0.01em]">Getting started</h1>
          <p className="text-muted">Circuit Lab teaches Arduino and Raspberry Pi with 3D lessons you can run in your browser.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={`#${LESSONS.pi[0].id}`}
            onClick={() => onPick(LESSONS.pi[0].id)}
            className="flex h-9 items-center rounded-control border border-control px-3 transition-colors hover:bg-raised active:bg-active"
          >
            Start with {BOARDS.pi.short}
          </a>
          <a
            href={`#${LESSONS.uno[0].id}`}
            onClick={() => onPick(LESSONS.uno[0].id)}
            className="flex h-9 items-center rounded-control bg-ink px-4 font-medium whitespace-nowrap text-surface transition-opacity hover:opacity-85 active:opacity-70"
          >
            Start with {BOARDS.uno.short}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_384px]">
        <section aria-label="Introduction video">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/video/circuit-lab-intro-poster.jpg"
            width={1920}
            height={1080}
            className="aspect-video h-auto w-full rounded-card border border-line bg-raised"
          >
            <source src="/video/circuit-lab-intro.mp4" type="video/mp4" />
            <a href="/video/circuit-lab-intro.mp4">Download the introduction video</a>
          </video>
          <details className="mt-2 text-muted">
            <summary className="cursor-pointer py-1 hover:text-ink">The video has no sound. Read it as text</summary>
            <ul className="mt-1 flex flex-col gap-1 text-ink">
              {INTRO_SCENES.map((scene) => (
                <li key={scene.text}>{scene.text}</li>
              ))}
            </ul>
          </details>
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <SectionTitle>What Circuit Lab is for</SectionTitle>
            <p>
              Wiring your first circuit is easier when you have already seen it. Each lesson puts the board and its circuit on a 3D bench, explains every
              connection, and lets you run the code to watch what it does, all before you buy a part or plug anything in.
            </p>
          </section>
          <section>
            <SectionTitle>Which board should you choose?</SectionTitle>
            <dl className="flex flex-col gap-3">
              {BOARD_ORDER.map((board) => (
                <div key={board}>
                  <dt className="font-medium">{BOARDS[board].name}</dt>
                  <dd className="text-muted">{CHOOSE_A_BOARD[board]}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>How a lesson works</SectionTitle>
          <ol className="flex list-inside list-decimal flex-col">
            {LESSON_STEPS.map(([title, text]) => (
              <li key={title} className="border-t border-rule py-2 marker:text-muted">
                <span className="font-medium">{title}.</span> <span className="text-muted">{text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-muted">
            Press <kbd className="rounded-control border border-control bg-raised px-1.5 py-0.5 font-sans text-small font-medium text-ink">?</kbd> on any page to see the keyboard shortcuts.
          </p>
        </section>
        <section>
          <SectionTitle>Before you build for real</SectionTitle>
          <ul className="flex flex-col">
            {GUIDELINES.map((guideline) => (
              <li key={guideline} className="border-t border-rule py-2">
                {guideline}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <SectionTitle>What the lessons cover</SectionTitle>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {BOARD_ORDER.map((board) => (
            <div key={board}>
              <h3 className="mb-1 font-medium">
                {BOARDS[board].short} <span className="font-normal text-muted">{LESSONS[board].length} lessons</span>
              </h3>
              <dl>
                {lessonGroups(board).map((group) => (
                  <div key={group.use} className="grid grid-cols-[160px_1fr] gap-3 border-t border-rule py-2">
                    <dt className="text-muted">{group.use}</dt>
                    <dd className="flex flex-wrap gap-x-3 gap-y-1">
                      {group.lessons.map((lesson) => (
                        <a key={lesson.id} href={`#${lesson.id}`} onClick={() => onPick(lesson.id)} className="underline decoration-control underline-offset-3 hover:decoration-ink">
                          {lesson.title}
                          {done.includes(lesson.id) && <span className="sr-only"> (run)</span>}
                        </a>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
