import { START_PAGE, lessonGroups } from '../data/lessons.ts'
import type { BoardKind } from '../data/types.ts'

export function LessonNav({ board, currentId, done, onPick }: { board: BoardKind; currentId: string; done: string[]; onPick: (id: string) => void }) {
  return (
    <nav aria-label="Lessons" className="flex flex-col gap-5 px-2 pb-6 pt-1">
      <a
        href={`#${START_PAGE}`}
        aria-current={currentId === START_PAGE ? 'page' : undefined}
        onClick={() => onPick(START_PAGE)}
        className={`flex min-h-8 items-center rounded-control px-2.5 py-1.5 transition-colors ${currentId === START_PAGE ? 'bg-active font-medium text-ink' : 'text-ink hover:bg-active/60'}`}
      >
        Getting started
      </a>
      {lessonGroups(board).map((group) => (
        <div key={group.use}>
          <h2 className="mb-1 px-2.5 text-small text-muted">{group.use}</h2>
          <ul className="flex flex-col gap-0.5">
            {group.lessons.map((lesson) => {
              const current = lesson.id === currentId
              const isDone = done.includes(lesson.id)
              return (
                <li key={lesson.id}>
                  <a
                    href={`#${lesson.id}`}
                    aria-current={current ? 'page' : undefined}
                    onClick={() => onPick(lesson.id)}
                    className={`flex min-h-8 items-center justify-between gap-2 rounded-control px-2.5 py-1.5 transition-colors ${current ? 'bg-active font-medium text-ink' : 'text-ink hover:bg-active/60'}`}
                  >
                    {lesson.title}
                    {isDone && (
                      <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Run">
                        <path d="m3 8.5 3.2 3L13 4.5" />
                      </svg>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
