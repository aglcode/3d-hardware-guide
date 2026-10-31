import { PI_LESSONS } from './lessons-pi.ts'
import { UNO_LESSONS } from './lessons-uno.ts'
import type { BoardKind, Lesson } from './types.ts'

export const LESSONS: Record<BoardKind, Lesson[]> = {
  uno: UNO_LESSONS,
  pi: PI_LESSONS,
}

export const ALL_LESSONS: Lesson[] = [...UNO_LESSONS, ...PI_LESSONS]

export function findLesson(id: string | null | undefined): Lesson | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === id)
}

/** Lessons grouped by what the board is used for, in teaching order. */
export function lessonGroups(board: BoardKind): { use: string; lessons: Lesson[] }[] {
  const groups: { use: string; lessons: Lesson[] }[] = []
  for (const lesson of LESSONS[board]) {
    const group = groups.find((g) => g.use === lesson.use)
    if (group) group.lessons.push(lesson)
    else groups.push({ use: lesson.use, lessons: [lesson] })
  }
  return groups
}
