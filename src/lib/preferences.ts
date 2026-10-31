const PROGRESS_KEY = 'benchtop.lessons-run'
const THEME_KEY = 'benchtop.theme'

export type Theme = 'light' | 'dark'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private windows can refuse storage. Progress then lasts for this visit only.
  }
}

export function loadProgress(): string[] {
  const stored = read(PROGRESS_KEY)
  if (!stored) return []
  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function saveProgress(ids: string[]) {
  write(PROGRESS_KEY, JSON.stringify(ids))
}

export function initialTheme(): Theme {
  const stored = read(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme: Theme) {
  write(THEME_KEY, theme)
}

export function hasWebGl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
