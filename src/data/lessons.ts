import { BOTH_LESSONS } from './lessons-both.ts'
import { PI_LESSONS } from './lessons-pi.ts'
import { UNO_LESSONS } from './lessons-uno.ts'
import type { Lesson, Track } from './types.ts'

export const LESSONS: Record<Track, Lesson[]> = {
  uno: UNO_LESSONS,
  pi: PI_LESSONS,
  both: BOTH_LESSONS,
}

/** The route of the Getting started page, which is also where the site opens. */
export const START_PAGE = 'getting-started'

export const ALL_LESSONS: Lesson[] = [...UNO_LESSONS, ...PI_LESSONS, ...BOTH_LESSONS]

export function findLesson(id: string | null | undefined): Lesson | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === id)
}

/** Lessons grouped by what the board is used for, in teaching order. */
export function lessonGroups(board: Track): { use: string; lessons: Lesson[] }[] {
  const groups: { use: string; lessons: Lesson[] }[] = []
  for (const lesson of LESSONS[board]) {
    const group = groups.find((g) => g.use === lesson.use)
    if (group) group.lessons.push(lesson)
    else groups.push({ use: lesson.use, lessons: [lesson] })
  }
  return groups
}
