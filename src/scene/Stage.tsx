import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Bench, Callout, Lesson } from '../data/types.ts'
import { stepRun, subscribeBench, useBench, setLabels } from '../lib/bench-store.ts'
import { benchBounds, resolvePoint } from '../lib/geometry.ts'
import { Breadboard, CableView, Jumper } from './BenchParts.tsx'
import { PiBoard, UnoBoard } from './Boards.tsx'
import { ModuleView } from './Modules.tsx'
import { BbPartView } from './Parts.tsx'

type OrbitHandle = { target: THREE.Vector3; update: () => void }
type ViewCommand = 'reset' | 'left' | 'right' | 'in' | 'out'

/** View buttons sit outside the canvas, so they leave their requests here for the next frame. */
const viewQueue: ViewCommand[] = []

const FOV = 20
const FRAME_PADDING = 0.98
const FRAME_PADDING_COMPACT = 0.92
const TURN_STEP = Math.PI / 6

function benchContents(bench: Bench) {
  return (
    <>
      {bench.boards.map((board) =>
        board.kind === 'uno' ? <UnoBoard key="uno" pos={board.pos} /> : <PiBoard key="pi" pos={board.pos} />,
      )}
      {bench.breadboard && <Breadboard pos={bench.breadboard} />}
      {bench.parts?.map((part) => <BbPartView key={part.id} bench={bench} part={part} />)}
      {bench.modules?.map((mod) => <ModuleView key={mod.id} mod={mod} />)}
      {bench.wires?.map((wire, i) => <Jumper key={`${wire.from}-${wire.to}`} bench={bench} wire={wire} index={i} />)}
      {bench.cables?.map((cable) => <CableView key={`${cable.from}-${cable.to}`} bench={bench} cable={cable} />)}
    </>
  )
}

function fitDistance(bench: Bench, direction: THREE.Vector3, aspect: number, padding: number) {
  const bounds = benchBounds(bench)
  const center = new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    bounds.max[1] * 0.3,
    (bounds.min[2] + bounds.max[2]) / 2,
  )
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(up, direction).normalize()
  const trueUp = new THREE.Vector3().crossVectors(direction, right).normalize()
  let halfWidth = 0
  let halfHeight = 0
  let depth = 0
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const corner = new THREE.Vector3(x, y, z).sub(center)
        halfWidth = Math.max(halfWidth, Math.abs(corner.dot(right)))
        halfHeight = Math.max(halfHeight, Math.abs(corner.dot(trueUp)))
        depth = Math.max(depth, corner.dot(direction))
      }
    }
  }
  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const distance = Math.max(halfWidth / (tan * aspect), halfHeight / tan) * padding + depth
  return { center, distance }
}

function CameraRig({ lesson, controlsRef, compact }: { lesson: Lesson; controlsRef: RefObject<OrbitHandle | null>; compact: boolean }) {
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const needsFit = useRef(true)
  const turning = useRef(0)

  useEffect(() => {
    needsFit.current = true
    invalidate()
  }, [lesson.id, size.width, size.height, compact, invalidate])

  useFrame((state, dt) => {
    const orbit = controlsRef.current
    if (!orbit) {
      invalidate()
      return
    }
    const { camera } = state
    if (needsFit.current || viewQueue.includes('reset')) {
      needsFit.current = false
      turning.current = 0
      // Uno scenes are seen from the USB side, Pi scenes from the ports side.
      const side = lesson.board === 'uno' ? -0.42 : 0.42
      const direction = new THREE.Vector3(side, 1.5, 1).normalize()
      const { center, distance } = fitDistance(lesson.bench, direction, size.width / size.height, compact ? FRAME_PADDING_COMPACT : FRAME_PADDING)
      camera.position.copy(center).addScaledVector(direction, distance)
      orbit.target.copy(center)
      orbit.update()
      state.invalidate()
    }
    for (const command of viewQueue) {
      if (command === 'left') turning.current += TURN_STEP
      if (command === 'right') turning.current -= TURN_STEP
      if (command === 'in' || command === 'out') {
        const offset = camera.position.clone().sub(orbit.target)
        camera.position.copy(orbit.target).addScaledVector(offset, command === 'in' ? 0.86 : 1.16)
        orbit.update()
      }
    }
    viewQueue.length = 0
    if (Math.abs(turning.current) > 0.001) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const step = reduced ? turning.current : turning.current * Math.min(1, dt * 9)
      turning.current -= step
      const offset = camera.position.clone().sub(orbit.target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), step)
      camera.position.copy(orbit.target).add(offset)
      orbit.update()
      state.invalidate()
    }
  })
  return null
}

function Runner() {
  useFrame((_, dt) => {
    stepRun(Math.min(dt, 0.1))
  })
  return null
}

/** Repaints the on-demand canvas whenever an input or the run state changes. */
function RepaintOnChange() {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => subscribeBench(() => invalidate()), [invalidate])
  return null
}

/** Moves the callout dots and leader lines to where their 3D anchors land on screen. */
function LeaderLines({ lesson, svg, cards }: { lesson: Lesson; svg: RefObject<SVGSVGElement | null>; cards: RefObject<HTMLDivElement | null> }) {
  const [points] = useState(() => lesson.callouts.map((c) => new THREE.Vector3(...resolvePoint(lesson.bench, c.at))))
  useFrame((state) => {
    const root = svg.current
    const cardRoot = cards.current
    if (!root || !cardRoot) return
    const projected = new THREE.Vector3()
    points.forEach((point, i) => {
      projected.copy(point).project(state.camera)
      const x = ((projected.x + 1) / 2) * state.size.width
      const y = ((1 - projected.y) / 2) * state.size.height
      const line = root.querySelector<SVGLineElement>(`[data-line="${i}"]`)
      const dot = root.querySelector<SVGCircleElement>(`[data-dot="${i}"]`)
      const number = root.querySelector<SVGTextElement>(`[data-number="${i}"]`)
      dot?.setAttribute('cx', String(x))
      dot?.setAttribute('cy', String(y))
      number?.setAttribute('x', String(x))
      number?.setAttribute('y', String(y))
      const card = cardRoot.querySelector<HTMLElement>(`[data-card="${i}"]`)
      if (!line) return
      if (!card || card.offsetParent === null) {
        line.setAttribute('visibility', 'hidden')
        return
      }
      const left = card.offsetLeft
      const top = card.offsetTop
      const right = left + card.offsetWidth
      const bottom = top + card.offsetHeight
      const startX = Math.min(Math.max(x, left + 12), right - 12)
      const startY = Math.min(Math.max(y, top), bottom)
      const edgeX = x < left ? left : x > right ? right : startX
      const edgeY = y < top ? top : y > bottom ? bottom : startY
      line.setAttribute('visibility', 'visible')
      line.setAttribute('x1', String(edgeX))
      line.setAttribute('y1', String(edgeY))
      line.setAttribute('x2', String(x))
      line.setAttribute('y2', String(y))
    })
  })
  return null
}

function HighlightMarker({ bench, highlight }: { bench: Bench; highlight: string | null }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ring.current) ring.current.quaternion.copy(state.camera.quaternion)
  })
  if (!highlight) return null
  const at = resolvePoint(bench, highlight)
  return (
    <mesh ref={ring} position={at} renderOrder={10}>
      <ringGeometry args={[0.2, 0.28, 32]} />
      <meshBasicMaterial color="#ff5b2e" depthTest={false} transparent side={THREE.DoubleSide} />
    </mesh>
  )
}

const SLOT_CLASS: Record<Callout['slot'], string> = {
  tl: 'left-3 top-3',
  tc: 'left-1/2 top-3 -translate-x-1/2',
  tr: 'right-3 top-3',
  ml: 'left-3 top-1/2 -translate-y-1/2',
  mr: 'right-3 top-1/2 -translate-y-1/2',
  bl: 'left-3 bottom-3',
  bc: 'left-1/2 bottom-3 -translate-x-1/2',
  br: 'right-3 bottom-3',
}

function IconButton({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-control border border-control bg-surface text-muted transition-colors hover:text-ink active:bg-active aria-pressed:bg-active aria-pressed:text-ink"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}

export default function Stage({ lesson, children }: { lesson: Lesson; children?: React.ReactNode }) {
  const { run, labels, highlight } = useBench()
  const controls = useRef<OrbitHandle | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const cards = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [invalidator, setInvalidator] = useState<null | (() => void)>(null)

  useEffect(() => {
    const element = wrap.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 680))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const send = (command: ViewCommand) => {
    viewQueue.push(command)
    invalidator?.()
  }

  const showCards = labels && !compact

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={wrap} className="relative min-h-0 flex-1 overflow-hidden rounded-t-card bg-raised">
        <Canvas
          shadows
          dpr={[1, 2]}
          frameloop={run === 'stopped' ? 'demand' : 'always'}
          camera={{ fov: FOV, position: [0, 30, 30], near: 1, far: 400 }}
          aria-label={`3D view of ${lesson.title}. Drag to orbit, scroll to zoom.`}
          onCreated={({ gl, invalidate }) => {
            gl.toneMapping = THREE.NeutralToneMapping
            gl.toneMappingExposure = 1.05
            setInvalidator(() => () => invalidate())
          }}
        >
          <hemisphereLight args={['#ffffff', '#b9bfc4', 0.72]} />
          <directionalLight
            position={[-10, 22, 12]}
            intensity={1.75}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-26}
            shadow-camera-right={26}
            shadow-camera-top={26}
            shadow-camera-bottom={-26}
            shadow-camera-far={70}
            shadow-bias={-0.0004}
          />
          <Suspense fallback={null}>
            <Environment resolution={64} frames={1} environmentIntensity={1.2}>
              <Lightformer form="rect" intensity={2.4} position={[0, 8, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 10, 1]} />
              <Lightformer form="rect" intensity={1} position={[-8, 3, 6]} rotation={[0, Math.PI / 2, 0]} scale={[8, 6, 1]} />
              <Lightformer form="rect" intensity={0.8} position={[8, 3, -4]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 6, 1]} />
            </Environment>
          </Suspense>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <shadowMaterial opacity={0.16} />
          </mesh>
          <group key={lesson.id}>{benchContents(lesson.bench)}</group>
          <HighlightMarker key={`${lesson.id}-${highlight}`} bench={lesson.bench} highlight={highlight} />
          <OrbitControls
            ref={(handle) => {
              controls.current = handle as unknown as OrbitHandle | null
            }}
            makeDefault
            enableDamping={false}
            minPolarAngle={0.15}
            maxPolarAngle={Math.PI / 2 - 0.06}
            minDistance={8}
            maxDistance={260}
          />
          <CameraRig lesson={lesson} controlsRef={controls} compact={compact} />
          <LeaderLines key={`lines-${lesson.id}`} lesson={lesson} svg={svg} cards={cards} />
          <Runner />
          <RepaintOnChange />
        </Canvas>

        <svg ref={svg} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          {lesson.callouts.map((callout, i) => (
            <g key={`${lesson.id}-${callout.title}`} visibility={labels ? 'visible' : 'hidden'}>
              <line data-line={i} stroke="var(--accent)" strokeWidth="1" />
              <circle data-dot={i} r={compact ? 8 : 3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
              {compact && (
                <text data-number={i} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="var(--surface)">
                  {i + 1}
                </text>
              )}
            </g>
          ))}
        </svg>

        <div ref={cards} className="pointer-events-none absolute inset-0">
          {showCards &&
            lesson.callouts.map((callout, i) => (
              <div
                key={`${lesson.id}-${i}`}
                data-card={i}
                className={`absolute w-44 rounded-card border border-line bg-surface px-3 py-2 ${SLOT_CLASS[callout.slot]}`}
              >
                <p className="text-small font-semibold text-ink">{callout.title}</p>
                <p className="text-small leading-snug text-muted">{callout.body}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-b-card border-t border-line bg-surface px-2 py-2" role="toolbar" aria-label="3D view">
        <IconButton label="Turn left" onClick={() => send('left')}>
          <path d="M3 7a5.5 5.5 0 1 1 1 4" />
          <path d="M2.5 3v4h4" />
        </IconButton>
        <IconButton label="Turn right" onClick={() => send('right')}>
          <path d="M13 7a5.5 5.5 0 1 0-1 4" />
          <path d="M13.5 3v4h-4" />
        </IconButton>
        <IconButton label="Zoom out" onClick={() => send('out')}>
          <path d="M3.5 8h9" />
        </IconButton>
        <IconButton label="Zoom in" onClick={() => send('in')}>
          <path d="M3.5 8h9M8 3.5v9" />
        </IconButton>
        <IconButton label="Reset view" onClick={() => send('reset')}>
          <path d="M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3" />
          <circle cx="8" cy="8" r="2" />
        </IconButton>
        <IconButton label="Show part labels" pressed={labels} onClick={() => setLabels(!labels)}>
          <path d="M2.5 3.5h7l4 4.5-4 4.5h-7z" />
        </IconButton>
        {children}
      </div>
    </div>
  )
}
