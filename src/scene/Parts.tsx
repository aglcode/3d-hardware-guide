import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BbPart, Bench, Vec3 } from '../data/types.ts'
import { live, setInput } from '../lib/bench-store.ts'
import { BB_TOP, resolvePoint } from '../lib/geometry.ts'
import { Box, BoxField, Cyl } from './Primitives.tsx'
import { createScreen, type ScreenStyle } from './textures.ts'

const LEAD = '#b9bcc0'
const GOLD = '#d6ab45'

/** A thin round bar between two points. */
export function Rod({ from, to, radius = 0.022, color = LEAD }: { from: Vec3; to: Vec3; radius?: number; color?: string }) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const direction = end.clone().sub(start)
  const length = direction.length()
  const center = start.clone().add(end).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return (
    <mesh position={center} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
    </mesh>
  )
}

function mid(a: Vec3, b: Vec3, up = 0): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + up, (a[2] + b[2]) / 2]
}

/** Keeps the pointer style honest over clickable parts and stops a click from starting an orbit. */
function Pressable({ onDown, children }: { onDown: () => void; children: ReactNode }) {
  return (
    <group
      onPointerDown={(event) => {
        event.stopPropagation()
        onDown()
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      {children}
    </group>
  )
}

function Led({ a, k, color, id }: { a: Vec3; k: Vec3; color: string; id: string }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const value = Number(live.outputs[id] ?? 0)
    if (material.current) material.current.emissiveIntensity = 0.05 + value * 2.2
    if (light.current) light.current.intensity = value * 1.6
  })
  const center = mid(a, k)
  const body: Vec3 = [center[0], BB_TOP + 0.62, center[2]]
  return (
    <group>
      <Rod from={a} to={[a[0], body[1], a[2]]} />
      <Rod from={k} to={[k[0], body[1], k[2]]} />
      <mesh position={body} castShadow>
        <cylinderGeometry args={[0.25, 0.27, 0.4, 24]} />
        <meshStandardMaterial ref={material} color={color} emissive={color} roughness={0.25} transparent opacity={0.92} />
      </mesh>
      <mesh position={[body[0], body[1] + 0.2, body[2]]} castShadow>
        <sphereGeometry args={[0.25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.2} transparent opacity={0.92} />
      </mesh>
      <pointLight ref={light} position={[body[0], body[1] + 0.8, body[2]]} color={color} intensity={0} distance={5} decay={1.5} />
    </group>
  )
}

const BAND_DIGITS = ['#1b1b1b', '#6d3f1a', '#c4242a', '#d9722a', '#d8b626', '#2c8c47', '#2f5fbf', '#7a4fa0', '#8c8c8c', '#f0f0ec']

function resistorBands(ohms: number): string[] {
  const exponent = Math.max(0, Math.floor(Math.log10(ohms)) - 1)
  const significant = Math.round(ohms / 10 ** exponent)
  return [BAND_DIGITS[Math.floor(significant / 10)], BAND_DIGITS[significant % 10], BAND_DIGITS[exponent], '#b89b3d']
}

function AxialBody({ a, b, bodyHeight, children }: { a: Vec3; b: Vec3; bodyHeight: number; children: ReactNode }) {
  const y = BB_TOP + bodyHeight
  const center = mid(a, b)
  const angle = Math.atan2(-(b[2] - a[2]), b[0] - a[0])
  return (
    <group>
      <Rod from={a} to={[a[0], y, a[2]]} />
      <Rod from={b} to={[b[0], y, b[2]]} />
      <Rod from={[a[0], y, a[2]]} to={[b[0], y, b[2]]} />
      <group position={[center[0], y, center[2]]} rotation={[0, angle, 0]}>
        <group rotation={[0, 0, Math.PI / 2]}>{children}</group>
      </group>
    </group>
  )
}

function Resistor({ a, b, ohms }: { a: Vec3; b: Vec3; ohms: number }) {
  const bands = resistorBands(ohms)
  return (
    <AxialBody a={a} b={b} bodyHeight={0.22}>
      <Cyl at={[0, 0, 0]} radius={0.095} height={0.68} color="#d9bd8d" rough={0.55} />
      {bands.map((color, i) => (
        <Cyl key={i} at={[0, [-0.2, -0.08, 0.04, 0.24][i], 0]} radius={0.1} height={0.055} color={color} />
      ))}
    </AxialBody>
  )
}

function Diode({ a, k }: { a: Vec3; k: Vec3 }) {
  return (
    <AxialBody a={a} b={k} bodyHeight={0.2}>
      <Cyl at={[0, 0, 0]} radius={0.09} height={0.52} color="#17181b" rough={0.4} />
      <Cyl at={[0, -0.2, 0]} radius={0.095} height={0.06} color="#d8dadc" />
    </AxialBody>
  )
}

function TactileButton({ part, points }: { part: BbPart; points: Vec3[] }) {
  const cap = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const pressed = (live.inputs[part.id] ?? 0) > 0
    if (cap.current) cap.current.position.y = BB_TOP + (pressed ? 0.33 : 0.42)
  })
  const center = points.reduce<Vec3>((acc, p) => [acc[0] + p[0] / 4, BB_TOP, acc[2] + p[2] / 4], [0, 0, 0])
  useEffect(() => {
    const release = () => {
      if ((live.inputs[part.id] ?? 0) > 0) setInput(part.id, 0)
    }
    window.addEventListener('pointerup', release)
    return () => window.removeEventListener('pointerup', release)
  }, [part.id])
  return (
    <Pressable onDown={() => setInput(part.id, 1)}>
      <Box at={[center[0], BB_TOP + 0.13, center[2]]} size={[0.62, 0.26, 0.62]} color="#26282c" />
      <Box at={[center[0], BB_TOP + 0.27, center[2]]} size={[0.6, 0.02, 0.6]} color="#b5b8bc" metal={0.8} rough={0.3} />
      <mesh ref={cap} position={[center[0], BB_TOP + 0.42, center[2]]} castShadow>
        <cylinderGeometry args={[0.17, 0.18, 0.3, 20]} />
        <meshStandardMaterial color="#c33a2c" roughness={0.5} />
      </mesh>
    </Pressable>
  )
}

function Pot({ id, points }: { id: string; points: Vec3[] }) {
  const knob = useRef<THREE.Group>(null)
  useFrame(() => {
    const value = (live.inputs[id] ?? 0) / 1023
    if (knob.current) knob.current.rotation.y = 2.4 - value * 4.8
  })
  const center = points[1]
  return (
    <group>
      <BoxField points={points.map((p): Vec3 => [p[0], BB_TOP + 0.06, p[2]])} size={[0.05, 0.14, 0.05]} color={LEAD} metal={0.7} />
      <Box at={[center[0], BB_TOP + 0.26, center[2]]} size={[0.95, 0.38, 0.9]} color="#2d62a8" />
      <group ref={knob} position={[center[0], BB_TOP + 0.45, center[2]]}>
        <Cyl at={[0, 0.2, 0]} radius={0.34} height={0.4} color="#2a2c30" rough={0.45} />
        <Box at={[0, 0.41, -0.2]} size={[0.06, 0.02, 0.26]} color="#f2f2ee" />
      </group>
    </group>
  )
}

function Ldr({ a, b }: { a: Vec3; b: Vec3 }) {
  const center = mid(a, b)
  const y = BB_TOP + 0.5
  return (
    <group>
      <Rod from={a} to={[a[0], y, a[2]]} />
      <Rod from={b} to={[b[0], y, b[2]]} />
      <Cyl at={[center[0], y + 0.05, center[2]]} radius={0.28} height={0.1} color="#c9783a" />
      <Box at={[center[0], y + 0.105, center[2]]} size={[0.34, 0.01, 0.05]} color="#3a2a1a" />
      <Box at={[center[0], y + 0.105, center[2] + 0.1]} size={[0.3, 0.01, 0.05]} color="#3a2a1a" />
      <Box at={[center[0], y + 0.105, center[2] - 0.1]} size={[0.3, 0.01, 0.05]} color="#3a2a1a" />
    </group>
  )
}

function Buzzer({ id, p, n }: { id: string; p: Vec3; n: Vec3 }) {
  const body = useRef<THREE.Group>(null)
  useFrame(() => {
    const on = Number(live.outputs[id] ?? 0)
    if (body.current) body.current.scale.y = on ? 1.05 : 1
  })
  const center = mid(p, n)
  return (
    <group ref={body} position={[center[0], BB_TOP, center[2]]}>
      <Cyl at={[0, 0.42, 0]} radius={0.6} height={0.84} color="#1d1e21" rough={0.5} />
      <Cyl at={[0, 0.845, 0]} radius={0.12} height={0.01} color="#050506" />
      <Box at={[(p[0] - center[0]) * 0.75, 0.85, 0]} size={[0.12, 0.01, 0.03]} color="#d7dad8" />
      <Box at={[(p[0] - center[0]) * 0.75, 0.85, 0]} size={[0.03, 0.01, 0.12]} color="#d7dad8" />
    </group>
  )
}

function ToNinetyTwo({ points }: { points: Vec3[] }) {
  const center = points[1]
  const y = BB_TOP + 0.55
  return (
    <group>
      {points.map((p, i) => (
        <Rod key={i} from={p} to={[center[0] + (p[0] - center[0]) * 0.6, y, center[2]]} />
      ))}
      <mesh position={[center[0], y + 0.22, center[2]]} rotation={[0, Math.PI, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.44, 24, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#1a1b1e" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <Box at={[center[0], y + 0.22, center[2] + 0.005]} size={[0.46, 0.44, 0.01]} color="#25262a" />
    </group>
  )
}

/** A canvas-backed display that repaints only when its simulation output changes. */
export function TextScreen({ id, at, rotation, size, pixels, style, fallback = '' }: { id: string; at: Vec3; rotation?: Vec3; size: [number, number]; pixels: [number, number]; style: ScreenStyle; fallback?: string }) {
  const [screen] = useState(() => createScreen(pixels[0], pixels[1], style))
  const shown = useRef<string | null>(null)
  useEffect(() => () => screen.texture.dispose(), [screen])
  useFrame(() => {
    const value = live.outputs[id]
    const text = typeof value === 'string' ? value : fallback
    if (text !== shown.current) {
      shown.current = text
      screen.draw(text)
    }
  })
  return (
    <mesh position={at} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={screen.texture} toneMapped={false} />
    </mesh>
  )
}

function UprightPins({ points, up = 0.32 }: { points: Vec3[]; up?: number }) {
  return (
    <BoxField
      points={points.map((p): Vec3 => [p[0], BB_TOP + up / 2 - 0.02, p[2]])}
      size={[0.06, up, 0.06]}
      color={GOLD}
      metal={0.85}
      rough={0.3}
    />
  )
}

function Sonar({ points }: { points: Vec3[] }) {
  const cx = (points[0][0] + points[points.length - 1][0]) / 2
  const z = points[0][2]
  const y = BB_TOP + 0.3 + 1
  return (
    <group>
      <UprightPins points={points} />
      <Box at={[cx, y, z]} size={[4.5, 2, 0.14]} color="#1c5fa8" />
      {[-1.3, 1.3].map((dx) => (
        <group key={dx} position={[cx + dx, y, z + 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <Cyl at={[0, 0.34, 0]} radius={0.8} height={0.68} color="#c6c9cd" metal={0.8} rough={0.35} />
          <Cyl at={[0, 0.685, 0]} radius={0.66} height={0.01} color="#2a2c30" rough={0.95} />
        </group>
      ))}
      <Box at={[cx, y + 0.72, z + 0.08]} size={[0.8, 0.28, 0.02]} color="#17181b" />
    </group>
  )
}

function Oled({ id, points }: { id: string; points: Vec3[] }) {
  const cx = (points[0][0] + points[points.length - 1][0]) / 2
  const z = points[0][2]
  const y = BB_TOP + 0.3 + 1.35
  return (
    <group>
      <UprightPins points={points} />
      <Box at={[cx, y, z]} size={[2.7, 2.7, 0.12]} color="#1d2c5e" />
      <Box at={[cx, y - 0.05, z + 0.07]} size={[2.55, 1.6, 0.05]} color="#0a0a0c" />
      <TextScreen id={id} at={[cx, y - 0.05, z + 0.1]} size={[2.3, 1.2]} pixels={[256, 134]} style={{ background: '#050608', ink: '#dbeeff', size: 54, align: 'center' }} />
    </group>
  )
}

function Bme({ points }: { points: Vec3[] }) {
  const cx = (points[0][0] + points[points.length - 1][0]) / 2
  const z = points[0][2]
  const y = BB_TOP + 0.3 + 0.65
  return (
    <group>
      <UprightPins points={points} />
      <Box at={[cx, y, z]} size={[1.3, 1.3, 0.1]} color="#1c5fa8" />
      <Box at={[cx - 0.05, y + 0.25, z + 0.075]} size={[0.26, 0.26, 0.05]} color="#c9ccd0" metal={0.8} rough={0.3} />
      <Box at={[cx + 0.3, y - 0.25, z + 0.07]} size={[0.2, 0.12, 0.04]} color="#17181b" />
    </group>
  )
}

export function BbPartView({ bench, part }: { bench: Bench; part: BbPart }) {
  const pin = (name: string) => resolvePoint(bench, `${part.id}.${name}`)
  const points = Object.keys(part.pins).map(pin)
  switch (part.kind) {
    case 'led':
      return <Led id={part.id} a={pin('a')} k={pin('k')} color={part.color ?? '#e0322b'} />
    case 'resistor':
      return <Resistor a={pin('a')} b={pin('b')} ohms={part.ohms ?? 220} />
    case 'diode':
      return <Diode a={pin('a')} k={pin('k')} />
    case 'button':
      return <TactileButton part={part} points={points} />
    case 'pot':
      return <Pot id={part.id} points={points} />
    case 'ldr':
      return <Ldr a={pin('a')} b={pin('b')} />
    case 'buzzer':
      return <Buzzer id={part.id} p={pin('p')} n={pin('n')} />
    case 'transistor':
    case 'tmp36':
      return <ToNinetyTwo points={points} />
    case 'hcsr04':
      return <Sonar points={points} />
    case 'oled':
      return <Oled id={part.id} points={points} />
    case 'bme280':
      return <Bme points={points} />
  }
}
