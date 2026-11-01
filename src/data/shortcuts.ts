export type ShortcutAction =
  | 'help'
  | 'run'
  | 'next'
  | 'previous'
  | 'board'
  | 'left'
  | 'right'
  | 'in'
  | 'out'
  | 'reset'
  | 'labels'
  | 'theme'

export type Shortcut = {
  action: ShortcutAction
  /** What the sheet shows. */
  keys: string[]
  /** Values of KeyboardEvent.key that trigger it, in lower case. */
  match: string[]
  label: string
}

export const SHORTCUT_GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Lessons',
    shortcuts: [
      { action: 'run', keys: ['Space'], match: [' '], label: 'Run or stop the program' },
      { action: 'next', keys: ['N'], match: ['n'], label: 'Next lesson' },
      { action: 'previous', keys: ['P'], match: ['p'], label: 'Previous lesson' },
      { action: 'board', keys: ['B'], match: ['b'], label: 'Switch board' },
    ],
  },
  {
    title: '3D view',
    shortcuts: [
      { action: 'left', keys: ['Q'], match: ['q'], label: 'Turn left' },
      { action: 'right', keys: ['E'], match: ['e'], label: 'Turn right' },
      { action: 'in', keys: ['+'], match: ['+', '='], label: 'Zoom in' },
      { action: 'out', keys: ['−'], match: ['-'], label: 'Zoom out' },
      { action: 'reset', keys: ['R'], match: ['r'], label: 'Reset view' },
      { action: 'labels', keys: ['L'], match: ['l'], label: 'Show or hide part labels' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { action: 'theme', keys: ['T'], match: ['t'], label: 'Switch light or dark theme' },
      { action: 'help', keys: ['?'], match: ['?'], label: 'Open this sheet' },
    ],
  },
]

export function findShortcut(action: ShortcutAction): Shortcut {
  const found = SHORTCUT_GROUPS.flatMap((group) => group.shortcuts).find((shortcut) => shortcut.action === action)
  if (!found) throw new Error(`No shortcut for "${action}"`)
  return found
}

export function shortcutFor(key: string): ShortcutAction | undefined {
  const pressed = key.toLowerCase()
  for (const group of SHORTCUT_GROUPS) {
    const found = group.shortcuts.find((shortcut) => shortcut.match.includes(pressed))
    if (found) return found.action
  }
  return undefined
}
