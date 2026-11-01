import type { ReactNode } from 'react'
import { loadFont } from '@remotion/google-fonts/IBMPlexSans'
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { BOARDS } from '../data/boards.ts'
import { INTRO_FPS, INTRO_HEIGHT, INTRO_SCENES, INTRO_WIDTH, type AppPoint, type IntroField, type IntroScene, type IntroStep } from '../data/intro-script.ts'
import { LESSONS, lessonGroups } from '../data/lessons.ts'
import type { BoardKind } from '../data/types.ts'

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600'], subsets: ['latin'] })

const GROUND = '#eef3ef'
const INK = '#131416'
const ACCENT = '#1b6c80'
const UNO_BLUE = '#0c4483'
const PI_GREEN = '#2f9c5c'
const WHITE = '#ffffff'
const LED = '#f3b23a'

const FIELDS: Record<IntroField, { background: string; color: string }> = {
  ground: { background: GROUND, color: INK },
  ink: { background: INK, color: WHITE },
  accent: { background: ACCENT, color: WHITE },
  uno: { background: UNO_BLUE, color: WHITE },
  pi: { background: PI_GREEN, color: INK },
}

/** Each scene slides over the last, and the one beneath stays until it is covered. */
const WIPE_FRAMES = 8
const APP_WIDTH = 1440
const APP_HEIGHT = 900
const PANEL_WIDTH = 620
const CARD_WIDTH = 1220
const CARD_HEIGHT = 1000

const snap = Easing.bezier(0.16, 1, 0.3, 1)

function clampedRange(frame: number, input: [number, number], output: [number, number], easing = snap) {
  return interpolate(frame, input, output, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
}

function usePop(delay: number) {
  const frame = useCurrentFrame()
  return spring({ frame: frame - delay, fps: INTRO_FPS, config: { damping: 13, stiffness: 210, mass: 0.55 } })
}

/** A line that rises out of a mask. */
function Rise({ delay, children }: { delay: number; children: ReactNode }) {
  const frame = useCurrentFrame()
  const y = clampedRange(frame, [delay, delay + 11], [108, 0])
  return (
    <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
      <span style={{ display: 'block', transform: `translateY(${y}%)` }}>{children}</span>
    </span>
  )
}

function Field({ field, children, padding = '0 130px', center = true }: { field: IntroField; children: ReactNode; padding?: string; center?: boolean }) {
  return (
    <AbsoluteFill style={{ ...FIELDS[field], padding, justifyContent: center ? 'center' : undefined }}>
      {children}
    </AbsoluteFill>
  )
}

function Logo() {
  const frame = useCurrentFrame()
  const body = usePop(2)
  const pins = clampedRange(frame, [6, 20], [1, 0])
  const gap = clampedRange(frame, [14, 28], [0, 1])
  return (
    <Field field="ground">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48 * gap + 8 }}>
        <svg viewBox="0 0 32 32" width={240} height={240} style={{ transform: `scale(${body})` }}>
          <rect x="7" y="7" width="18" height="18" rx="2.5" fill={ACCENT} />
          <rect x="12" y="12" width="8" height="8" rx="1" fill={GROUND} />
          <path
            d="M11 7V3M16 7V3M21 7V3M11 25v4M16 25v4M21 25v4M7 11H3M7 16H3M7 21H3M25 11h4M25 16h4M25 21h4"
            stroke={ACCENT}
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={pins}
            fill="none"
          />
        </svg>
        <div style={{ fontSize: 190, fontWeight: 600, letterSpacing: '-0.035em', color: INK }}>
          <Rise delay={15}>Circuit Lab</Rise>
        </div>
      </div>
    </Field>
  )
}

function Words({ lines, field }: { lines: string[]; field: IntroField }) {
  return (
    <Field field={field}>
      <div style={{ fontSize: 158, lineHeight: 1.08, fontWeight: 600, letterSpacing: '-0.035em' }}>
        {lines.map((line, i) => (
          <Rise key={line} delay={WIPE_FRAMES / 2 + i * 7}>
            {line}
          </Rise>
        ))}
      </div>
    </Field>
  )
}

function Beats({ beats }: { beats: { word: string; field: IntroField }[] }) {
  const { durationInFrames } = useVideoConfig()
  const each = Math.round((durationInFrames - WIPE_FRAMES) / beats.length)
  return (
    <>
      {beats.map((beat, i) => (
        <Sequence key={beat.word} from={i * each} durationInFrames={durationInFrames - i * each}>
          <WipeIn direction={i % 2 === 0 ? 'x' : 'y'}>
            <Field field={beat.field}>
              <div style={{ fontSize: 300, fontWeight: 600, letterSpacing: '-0.045em' }}>
                <Rise delay={3}>{beat.word}</Rise>
              </div>
            </Field>
          </WipeIn>
        </Sequence>
      ))}
    </>
  )
}

/** The Blink lesson's real loop: pin 13, a 220 ohm resistor, an LED, and back through ground. */
const LOOP = 'M 300 300 H 1000 V 300 H 1620 V 760 H 300 Z'
const NODES: { x: number; y: number; label: string; note: string; delay: number; w: number }[] = [
  { x: 300, y: 300, label: 'Pin 13', note: '5 V', delay: 6, w: 280 },
  { x: 880, y: 300, label: '220 Ω', note: 'resistor', delay: 22, w: 280 },
  { x: 1620, y: 530, label: 'LED', note: 'long leg in', delay: 34, w: 280 },
  { x: 300, y: 760, label: 'GND', note: 'back to the board', delay: 48, w: 360 },
]

function Circuit({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const draw = clampedRange(frame, [6, 54], [1, 0], Easing.bezier(0.4, 0, 0.3, 1))
  const lit = frame > 58
  const current = interpolate(frame, [54, 90], [0, -1.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const led = usePop(58)
  return (
    <AbsoluteFill style={{ background: INK, color: WHITE }}>
      <svg viewBox={`0 0 ${INTRO_WIDTH} ${INTRO_HEIGHT}`} style={{ position: 'absolute', inset: 0 }}>
        <path d={LOOP} fill="none" stroke="#3b4044" strokeWidth="14" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={draw} />
        {lit && <path d={LOOP} fill="none" stroke={LED} strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="0.05 0.15" strokeDashoffset={current} />}
      </svg>
      {NODES.map((node) => (
        <Node key={node.label} node={node} lit={lit && node.label === 'LED'} glow={led} />
      ))}
      <div style={{ position: 'absolute', left: 130, top: 76, right: 130, fontSize: 84, fontWeight: 600, letterSpacing: '-0.025em' }}>
        <Rise delay={3}>{text}</Rise>
      </div>
    </AbsoluteFill>
  )
}

function Node({ node, lit, glow }: { node: (typeof NODES)[number]; lit: boolean; glow: number }) {
  const pop = usePop(node.delay)
  return (
    <div
      style={{
        position: 'absolute',
        left: node.x - node.w / 2,
        top: node.y - 72,
        width: node.w,
        height: 144,
        borderRadius: 16,
        background: lit ? LED : WHITE,
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${pop * (lit ? 1 + 0.08 * (1 - glow) : 1)})`,
      }}
    >
      <span style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.1 }}>{node.label}</span>
      <span style={{ fontSize: 30, lineHeight: 1.2 }}>{node.note}</span>
    </div>
  )
}

function BoardCount({ board, delay, field }: { board: BoardKind; delay: number; field: IntroField }) {
  const pop = usePop(delay)
  return (
    <div style={{ ...FIELDS[field], flex: 1, height: 340, borderRadius: 24, padding: '34px 48px', transform: `translateY(${(1 - pop) * 160}px) scale(${0.85 + pop * 0.15})`, opacity: Math.min(1, pop * 2) }}>
      <div style={{ fontSize: 150, lineHeight: 1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{LESSONS[board].length}</div>
      <div style={{ fontSize: 56, fontWeight: 500, marginTop: 28 }}>{BOARDS[board].short}</div>
    </div>
  )
}

function Numbers() {
  const frame = useCurrentFrame()
  const total = LESSONS.uno.length + LESSONS.pi.length
  const shown = Math.round(clampedRange(frame, [4, 34], [0, total]))
  return (
    <Field field="ground">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 44, color: INK }}>
        <span style={{ fontSize: 300, lineHeight: 1, fontWeight: 600, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{shown}</span>
        <span style={{ fontSize: 130, fontWeight: 500, letterSpacing: '-0.03em' }}>lessons</span>
      </div>
      <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
        <BoardCount board="uno" delay={26} field="uno" />
        <BoardCount board="pi" delay={32} field="pi" />
      </div>
    </Field>
  )
}

const GROUP_FIELDS: IntroField[] = ['accent', 'ground', 'uno', 'pi']
const USES = [...new Set(([...lessonGroups('uno'), ...lessonGroups('pi')]).map((group) => group.use))].filter((use) => use !== 'First look')

function UseChip({ use, index }: { use: string; index: number }) {
  const pop = usePop(WIPE_FRAMES + index * 4)
  return (
    <span
      style={{
        ...FIELDS[GROUP_FIELDS[index % GROUP_FIELDS.length]],
        display: 'inline-block',
        fontSize: 62,
        fontWeight: 500,
        padding: '20px 40px',
        borderRadius: 16,
        transform: `scale(${pop}) rotate(${(1 - pop) * (index % 2 === 0 ? -8 : 8)}deg)`,
      }}
    >
      {use}
    </span>
  )
}

function Groups({ text }: { text: string }) {
  return (
    <Field field="ink">
      <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 60 }}>
        <Rise delay={3}>{text}</Rise>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26 }}>
        {USES.map((use, i) => (
          <UseChip key={use} use={use} index={i} />
        ))}
      </div>
    </Field>
  )
}

function cameraOffset(at: AppPoint, scale: number) {
  return {
    x: Math.min(0, Math.max(CARD_WIDTH - APP_WIDTH * scale, CARD_WIDTH / 2 - at[0] * scale)),
    y: Math.min(0, Math.max(CARD_HEIGHT - APP_HEIGHT * scale, CARD_HEIGHT / 2 - at[1] * scale)),
  }
}

function Cursor({ x, y, ripple }: { x: number; y: number; ripple: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y }}>
      {ripple > 0 && ripple < 1 && (
        <div
          style={{
            position: 'absolute',
            left: -60,
            top: -60,
            width: 120,
            height: 120,
            borderRadius: 60,
            border: `8px solid ${ACCENT}`,
            opacity: 1 - ripple,
            transform: `scale(${0.3 + ripple})`,
          }}
        />
      )}
      <svg width="64" height="76" viewBox="0 0 26 31">
        <path d="M2 2v23l6.500-6 4 10 4.500-2-4-10h9z" fill={INK} stroke={WHITE} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function Step({ step }: { step: IntroStep }) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const swap = Math.round((step.swapAt ?? 2) * durationInFrames)
  const slide = clampedRange(frame, [3, 15], [CARD_WIDTH + 120, 0])
  const push = interpolate(frame, [0, durationInFrames], [1, 1.07])
  const kick = step.swapAt ? spring({ frame: frame - swap, fps: INTRO_FPS, config: { damping: 12, stiffness: 240, mass: 0.5 } }) : 1
  const scale = step.scale * push * (frame >= swap ? 1.03 - 0.03 * kick : 1)
  const camera = cameraOffset(step.at, scale)
  const file = step.frames[frame >= swap && step.frames[1] ? 1 : 0]

  let cursor: AppPoint | null = null
  let ripple = 0
  if (step.cursor) {
    const arrive = Math.round((step.swapAt ?? 0.6) * durationInFrames) - 2
    const move = clampedRange(frame, [12, arrive], [0, 1], Easing.bezier(0.5, 0, 0.2, 1))
    cursor = [
      step.cursor.from[0] + (step.cursor.to[0] - step.cursor.from[0]) * move,
      step.cursor.from[1] + (step.cursor.to[1] - step.cursor.from[1]) * move,
    ]
    if (step.cursor.click) ripple = interpolate(frame, [arrive, arrive + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }

  return (
    <AbsoluteFill style={FIELDS[step.field]}>
      <div style={{ position: 'absolute', left: 70, top: 0, bottom: 0, width: PANEL_WIDTH - 110, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 134, lineHeight: 1, fontWeight: 600, letterSpacing: '-0.04em' }}>
          <Rise delay={4}>{step.word}</Rise>
        </div>
        <div style={{ fontSize: 44, lineHeight: 1.22, fontWeight: 500, marginTop: 34 }}>
          <Rise delay={9}>{step.text}</Rise>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: PANEL_WIDTH,
          top: (INTRO_HEIGHT - CARD_HEIGHT) / 2,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 20,
          overflow: 'hidden',
          background: WHITE,
          transform: `translateX(${slide}px)`,
        }}
      >
        <Img
          src={staticFile(file)}
          style={{ position: 'absolute', left: 0, top: 0, width: APP_WIDTH, height: APP_HEIGHT, transformOrigin: '0 0', transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale})` }}
        />
        {cursor && <Cursor x={camera.x + cursor[0] * scale} y={camera.y + cursor[1] * scale} ripple={ripple} />}
      </div>
    </AbsoluteFill>
  )
}

function EndTile({ board, delay, field }: { board: BoardKind; delay: number; field: IntroField }) {
  const pop = usePop(delay)
  return (
    <div style={{ ...FIELDS[field], flex: 1, borderRadius: 24, padding: '56px 56px', fontSize: 84, fontWeight: 600, letterSpacing: '-0.025em', transform: `scale(${pop})` }}>
      {BOARDS[board].short}
    </div>
  )
}

function End({ text }: { text: string }) {
  return (
    <Field field="ground">
      <div style={{ fontSize: 150, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.035em', color: INK, marginBottom: 70 }}>
        <Rise delay={5}>{text}</Rise>
      </div>
      <div style={{ display: 'flex', gap: 40 }}>
        <EndTile board="uno" delay={14} field="uno" />
        <EndTile board="pi" delay={20} field="pi" />
      </div>
    </Field>
  )
}

function Scene({ scene }: { scene: IntroScene }) {
  switch (scene.kind) {
    case 'logo':
      return <Logo />
    case 'words':
      return <Words lines={scene.lines} field={scene.field} />
    case 'beats':
      return <Beats beats={scene.beats} />
    case 'circuit':
      return <Circuit text={scene.text} />
    case 'numbers':
      return <Numbers />
    case 'groups':
      return <Groups text={scene.text} />
    case 'step':
      return <Step step={scene} />
    case 'end':
      return <End text={scene.text} />
  }
}

function WipeIn({ direction, children }: { direction: 'x' | 'y'; children: ReactNode }) {
  const frame = useCurrentFrame()
  const offset = clampedRange(frame, [0, WIPE_FRAMES], [100, 0])
  return <AbsoluteFill style={{ transform: direction === 'x' ? `translateX(${offset}%)` : `translateY(${offset}%)` }}>{children}</AbsoluteFill>
}

function sceneFrames(scene: IntroScene) {
  return Math.round(scene.seconds * INTRO_FPS)
}

export function IntroVideo() {
  return (
    <AbsoluteFill style={{ background: GROUND, fontFamily, overflow: 'hidden' }}>
      {INTRO_SCENES.map((scene, i) => (
        <Sequence
          key={scene.text}
          from={INTRO_SCENES.slice(0, i).reduce((total, earlier) => total + sceneFrames(earlier), 0)}
          durationInFrames={sceneFrames(scene) + WIPE_FRAMES}
        >
          <WipeIn direction={i % 2 === 0 ? 'x' : 'y'}>
            <Scene scene={scene} />
          </WipeIn>
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
