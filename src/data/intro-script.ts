/**
 * The words and shots of the intro video. The Remotion composition renders from this and the Getting
 * started page prints the same words as the transcript, so the two cannot drift apart.
 */

/** A point on a 1440 x 900 screenshot of the app. */
export type AppPoint = [number, number]

export type IntroField = 'ground' | 'ink' | 'accent' | 'uno' | 'pi'

type SceneBase = {
  /** The scene's words as one sentence, for the transcript. */
  text: string
  seconds: number
}

export type IntroStep = SceneBase & {
  kind: 'step'
  word: string
  field: IntroField
  /** Files in video-assets/. A second file cuts in at `swapAt` of the way through. */
  frames: string[]
  swapAt?: number
  at: AppPoint
  /** Screenshot pixels to card pixels. */
  scale: number
  cursor?: { from: AppPoint; to: AppPoint; click?: boolean }
}

export type IntroScene =
  | (SceneBase & { kind: 'logo' })
  | (SceneBase & { kind: 'words'; lines: string[]; field: IntroField })
  | (SceneBase & { kind: 'beats'; beats: { word: string; field: IntroField }[] })
  | (SceneBase & { kind: 'circuit' })
  | (SceneBase & { kind: 'numbers' })
  | (SceneBase & { kind: 'groups' })
  | IntroStep
  | (SceneBase & { kind: 'end' })

export const INTRO_SCENES: IntroScene[] = [
  { kind: 'logo', text: 'Circuit Lab.', seconds: 2 },
  {
    kind: 'words',
    text: 'Learn Arduino and Raspberry Pi in 3D.',
    lines: ['Learn Arduino', 'and Raspberry Pi', 'in 3D.'],
    field: 'accent',
    seconds: 2.5,
  },
  {
    kind: 'beats',
    text: 'See it. Run it. Build it.',
    beats: [
      { word: 'See it.', field: 'ground' },
      { word: 'Run it.', field: 'uno' },
      { word: 'Build it.', field: 'pi' },
    ],
    seconds: 2.4,
  },
  { kind: 'circuit', text: 'Every connection on the bench is explained.', seconds: 3 },
  { kind: 'numbers', text: 'Lessons for two boards.', seconds: 2.5 },
  { kind: 'groups', text: 'From blinking lights to home servers.', seconds: 3 },
  {
    kind: 'step',
    word: 'Pick',
    text: 'Pick a lesson from the list.',
    field: 'accent',
    frames: ['blink.jpg'],
    at: [250, 330],
    scale: 1.6,
    cursor: { from: [420, 420], to: [60, 212], click: true },
    seconds: 2.5,
  },
  {
    kind: 'step',
    word: 'Look',
    text: 'Drag to orbit and scroll to zoom.',
    field: 'uno',
    frames: ['blink.jpg', 'orbit.jpg'],
    swapAt: 0.45,
    at: [630, 480],
    scale: 1.35,
    cursor: { from: [500, 620], to: [760, 620] },
    seconds: 2.5,
  },
  {
    kind: 'step',
    word: 'Wire',
    text: 'Hover a row to find it on the bench.',
    field: 'ink',
    frames: ['wiring.jpg'],
    at: [1120, 300],
    scale: 1.6,
    cursor: { from: [1040, 180], to: [1215, 300] },
    seconds: 2.5,
  },
  {
    kind: 'step',
    word: 'Run',
    text: 'Press Run and the current line lights up.',
    field: 'accent',
    frames: ['dimmer-idle.jpg', 'running.jpg'],
    swapAt: 0.5,
    at: [930, 450],
    scale: 1.25,
    cursor: { from: [1180, 300], to: [1355, 91], click: true },
    seconds: 2.5,
  },
  {
    kind: 'step',
    word: 'Tweak',
    text: 'Move a control and the parts respond.',
    field: 'uno',
    frames: ['servo-low.jpg', 'servo-high.jpg'],
    swapAt: 0.55,
    at: [630, 600],
    scale: 1.3,
    cursor: { from: [771, 842], to: [904, 842] },
    seconds: 2.5,
  },
  {
    kind: 'step',
    word: 'Go further',
    text: 'Desktops, web switches, cameras and servers on the Pi.',
    field: 'pi',
    frames: ['pi-tour.jpg', 'file-server.jpg'],
    swapAt: 0.5,
    at: [630, 480],
    scale: 1.35,
    seconds: 2.5,
  },
  {
    kind: 'step',
    word: 'Press ?',
    text: 'See every keyboard shortcut.',
    field: 'ink',
    frames: ['shortcuts.jpg'],
    at: [720, 450],
    scale: 1.3,
    seconds: 2,
  },
  {
    kind: 'words',
    text: 'Run is a simulation. Check your wiring before you power it.',
    lines: ['Run is a simulation.', 'Check your wiring', 'before you power it.'],
    field: 'ink',
    seconds: 3,
  },
  { kind: 'end', text: 'Choose a board and start.', seconds: 2.5 },
]

export const INTRO_FPS = 30
export const INTRO_WIDTH = 1920
export const INTRO_HEIGHT = 1080

export const INTRO_FRAMES = INTRO_SCENES.reduce((total, scene) => total + Math.round(scene.seconds * INTRO_FPS), 0)
