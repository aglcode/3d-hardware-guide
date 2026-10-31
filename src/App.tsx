import { Suspense, lazy, useEffect, useState } from 'react'
import { CodePanel } from './components/CodePanel.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { InputControls } from './components/InputControls.tsx'
import { LessonNav } from './components/LessonNav.tsx'
import { BOARDS } from './data/boards.ts'
import { LESSONS, findLesson } from './data/lessons.ts'
import type { BoardKind } from './data/types.ts'
import { loadLesson, startRun, stopRun, useBench } from './lib/bench-store.ts'
import { applyTheme, hasWebGl, initialTheme, loadProgress, saveProgress, saveTheme, type Theme } from './lib/preferences.ts'

// A failed download (a dropped connection, a stale deploy) stays inside the stage instead of blanking the page.
const Stage = lazy(() =>
  import('./scene/Stage.tsx').catch(() => ({
    default: () => (
      <div className="grid h-full place-items-center rounded-card bg-raised p-6 text-center text-muted">
        <p>
          The 3D bench did not load.{' '}
          <button type="button" onClick={() => window.location.reload()} className="font-medium text-ink underline">
            Reload the page
          </button>
        </p>
      </div>
    ),
  })),
)

const BOARD_ORDER: BoardKind[] = ['uno', 'pi']

function lessonFromHash() {
  return findLesson(window.location.hash.slice(1)) ?? LESSONS.uno[0]
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6 shrink-0" aria-hidden="true">
      <rect x="7" y="7" width="18" height="18" rx="2.5" fill="var(--accent)" />
      <rect x="12" y="12" width="8" height="8" rx="1" fill="var(--surface)" />
      <path d="M11 3v4M16 3v4M21 3v4M11 25v4M16 25v4M21 25v4M3 11h4M3 16h4M3 21h4M25 11h4M25 16h4M25 21h4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function StagePlaceholder({ children }: { children: string }) {
  return <div className="grid h-full place-items-center rounded-card bg-raised p-6 text-center text-muted">{children}</div>
}

export default function App() {
  const [lesson, setLesson] = useState(lessonFromHash)
  const [done, setDone] = useState(loadProgress)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [webGl] = useState(hasWebGl)
  const { run } = useBench()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onHash = () => setLesson(lessonFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    loadLesson(lesson)
    document.title = `${lesson.title}: Benchtop`
  }, [lesson])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const pick = (id: string) => {
    const next = findLesson(id)
    if (next) setLesson(next)
    setMenuOpen(false)
  }

  const toggleRun = () => {
    if (run === 'stopped') {
      startRun()
      if (!done.includes(lesson.id)) {
        const next = [...done, lesson.id]
        setDone(next)
        saveProgress(next)
      }
    } else {
      stopRun()
    }
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveTheme(next)
  }

  const boardLessons = LESSONS[lesson.board]
  const nextLesson = boardLessons[boardLessons.indexOf(lesson) + 1]
  const doneHere = boardLessons.filter((l) => done.includes(l.id)).length
  const runLabel = lesson.code[0].lang === 'cpp' ? 'sketch' : lesson.code[0].lang === 'python' ? 'program' : 'commands'

  return (
    <div className="flex h-dvh flex-col bg-ground">
      <header className="flex h-12 shrink-0 items-center gap-2 px-3 sm:gap-4">
        <button
          type="button"
          aria-label="Lessons"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid size-9 place-items-center rounded-control text-ink hover:bg-active lg:hidden"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
          </svg>
        </button>
        <a href={`#${LESSONS.uno[0].id}`} onClick={() => pick(LESSONS.uno[0].id)} className="flex items-center gap-2 lg:w-[208px]">
          <Mark />
          <span className="hidden text-section font-semibold sm:inline">Benchtop</span>
        </a>
        <nav aria-label="Boards" className="flex h-full items-stretch gap-4">
          {BOARD_ORDER.map((board) => (
            <a
              key={board}
              href={`#${LESSONS[board][0].id}`}
              aria-current={lesson.board === board ? 'true' : undefined}
              onClick={() => pick(LESSONS[board][0].id)}
              className={`flex items-center border-b-2 pt-0.5 whitespace-nowrap transition-colors ${lesson.board === board ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {BOARDS[board].short}
            </a>
          ))}
        </nav>
        <p className="ml-auto hidden text-muted tabular-nums md:block">
          {doneHere} of {boardLessons.length} lessons run
        </p>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
          title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
          className="ml-auto grid size-9 place-items-center rounded-control text-muted hover:bg-active hover:text-ink md:ml-0"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" />
            <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[228px] shrink-0 overflow-y-auto lg:block">
          <LessonNav board={lesson.board} currentId={lesson.id} done={done} onPick={pick} />
        </aside>

        {menuOpen && (
          <div className="fixed inset-x-0 bottom-0 top-12 z-20 overflow-y-auto bg-ground lg:hidden">
            <LessonNav board={lesson.board} currentId={lesson.id} done={done} onPick={pick} />
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-surface p-4 sm:p-6 lg:mb-2 lg:mr-2 lg:rounded-sheet lg:border lg:border-line">
          <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1 basis-80">
              <h1 className="text-title font-semibold tracking-[-0.01em]">{lesson.title}</h1>
              <p className="text-muted">{lesson.summary}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {nextLesson && (
                <a
                  href={`#${nextLesson.id}`}
                  onClick={() => pick(nextLesson.id)}
                  className="flex h-9 items-center rounded-control border border-control px-3 transition-colors hover:bg-raised active:bg-active"
                >
                  Next: {nextLesson.title}
                </a>
              )}
              <button
                type="button"
                onClick={toggleRun}
                className="h-9 rounded-control bg-ink px-4 font-medium whitespace-nowrap text-surface transition-opacity hover:opacity-85 active:opacity-70"
              >
                {run === 'stopped' ? `Run ${runLabel}` : 'Stop'}
              </button>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_384px]">
            <div className="h-[46dvh] min-h-[340px] overflow-hidden sm:h-[62dvh] rounded-card border border-line xl:h-auto xl:min-h-0">
              {webGl ? (
                <Suspense fallback={<StagePlaceholder>Setting out the parts</StagePlaceholder>}>
                  <Stage lesson={lesson}>
                    <InputControls lesson={lesson} />
                  </Stage>
                </Suspense>
              ) : (
                <StagePlaceholder>This browser has WebGL turned off, so the 3D bench cannot be drawn. The wiring table and code still work.</StagePlaceholder>
              )}
            </div>
            <div className="flex flex-col gap-4 xl:min-h-0">
              <div className="flex h-[380px] flex-col xl:h-auto xl:min-h-0 xl:flex-1">
                <InfoPanel lesson={lesson} />
              </div>
              <div className="flex h-[440px] flex-col xl:h-auto xl:min-h-0 xl:flex-[1.15]">
                <CodePanel key={lesson.id} lesson={lesson} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
