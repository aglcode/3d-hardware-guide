import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { WIRE_COLORS, type Bench, type Cable, type Vec2, type Vec3, type Wire } from '../data/types.ts'
import { BB_ROWS, BB_SIZE, BB_TOP, holeLocal, resolvePoint, rowX } from '../lib/geometry.ts'
import { roundedOutline } from './pcb.ts'
import { Box } from './Primitives.tsx'
import { breadboardTexture } from './textures.ts'

function makeBreadboard() {
  const holes: { x: number; z: number }[] = []
  const rows: { row: number; x: number }[] = []
  for (let row = 1; row <= BB_ROWS; row++) {
    rows.push({ row, x: rowX(row) })
    for (const column of 'abcdefghij') {
      const [x, , z] = holeLocal(`${column}${row}`)
      holes.push({ x, z })
    }
    if (row < 30 && row % 6 !== 0) {
      for (const rail of ['+t', '-t', '+b', '-b']) {
        const [x, , z] = holeLocal(`${rail}${row}`)
        holes.push({ x, z })
      }
    }
  }
  const letters = [...'abcdefghij'].map((letter) => ({ letter, z: holeLocal(`${letter}1`)[2] }))
  const railLines = [
    { z: -2.6, color: '#c4242a' },
    { z: -1.97, color: '#2f70bb' },
    { z: 1.97, color: '#c4242a' },
    { z: 2.6, color: '#2f70bb' },
  ]
  return breadboardTexture(holes, rows, letters, railLines, BB_SIZE.w, BB_SIZE.h)
}

export function Breadboard({ pos }: { pos: Vec2 }) {
  const [texture] = useState(makeBreadboard)
  const [shape] = useState(() => new THREE.Shape(roundedOutline(BB_SIZE.w, BB_SIZE.h, 0.1).map(([x, y]) => new THREE.Vector2(x, y))))
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[shape, { depth: BB_TOP - 0.002, bevelEnabled: false }]} />
          <meshStandardMaterial color="#e4e1d7" roughness={0.75} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BB_TOP, 0]} receiveShadow>
        <planeGeometry args={[BB_SIZE.w - 0.02, BB_SIZE.h - 0.02]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
    </group>
  )
}

function jumperPath(a: Vec3, b: Vec3, index: number) {
  const span = Math.hypot(a[0] - b[0], a[2] - b[2])
  const peak = Math.max(a[1], b[1]) + 0.55 + Math.min(span * 0.16, 1.6) + (index % 5) * 0.12
  const up = 0.5
  const points = [
    new THREE.Vector3(a[0], a[1] + up * 0.7, a[2]),
    new THREE.Vector3(a[0], a[1] + up, a[2]),
    new THREE.Vector3(a[0] + (b[0] - a[0]) * 0.22, peak, a[2] + (b[2] - a[2]) * 0.22),
    new THREE.Vector3(a[0] + (b[0] - a[0]) * 0.78, peak, a[2] + (b[2] - a[2]) * 0.78),
    new THREE.Vector3(b[0], b[1] + up, b[2]),
    new THREE.Vector3(b[0], b[1] + up * 0.7, b[2]),
  ]
  return new THREE.CatmullRomCurve3(points, false, 'centripetal')
}

function WireEnd({ at }: { at: Vec3 }) {
  return (
    <group>
      <Box at={[at[0], at[1] + 0.22, at[2]]} size={[0.2, 0.36, 0.2]} color="#17181b" rough={0.55} />
    </group>
  )
}

export function Jumper({ bench, wire, index }: { bench: Bench; wire: Wire; index: number }) {
  const a = resolvePoint(bench, wire.from)
  const b = resolvePoint(bench, wire.to)
  const [geometry] = useState(() => new THREE.TubeGeometry(jumperPath(a, b, index), 36, 0.042, 8, false))
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={WIRE_COLORS[wire.color]} roughness={0.5} />
      </mesh>
      <WireEnd at={a} />
      <WireEnd at={b} />
    </group>
  )
}

function cablePath(a: Vec3, b: Vec3) {
  const dx = b[0] - a[0]
  const dz = b[2] - a[2]
  const ground = 0.16
  const points = [
    new THREE.Vector3(a[0], a[1], a[2]),
    new THREE.Vector3(a[0] + dx * 0.15, Math.max(a[1] * 0.6, ground), a[2] + dz * 0.15 + 0.5),
    new THREE.Vector3(a[0] + dx * 0.5, ground, a[2] + dz * 0.5 + 0.9),
    new THREE.Vector3(a[0] + dx * 0.85, Math.max(b[1] * 0.6, ground), a[2] + dz * 0.85 + 0.3),
    new THREE.Vector3(b[0], b[1], b[2]),
  ]
  return new THREE.CatmullRomCurve3(points, false, 'centripetal')
}

function ribbonGeometry(a: Vec3, b: Vec3, width: number) {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(...a),
      new THREE.Vector3(a[0] + (b[0] - a[0]) * 0.3, Math.max(a[1], b[1]) + 0.5, a[2] + (b[2] - a[2]) * 0.3),
      new THREE.Vector3(a[0] + (b[0] - a[0]) * 0.7, Math.max(a[1], b[1]) + 0.5, a[2] + (b[2] - a[2]) * 0.7),
      new THREE.Vector3(...b),
    ],
    false,
    'centripetal',
  )
  const steps = 40
  const positions: number[] = []
  const indices: number[] = []
  const side = new THREE.Vector3(b[2] - a[2], 0, -(b[0] - a[0])).normalize().multiplyScalar(width / 2)
  for (let i = 0; i <= steps; i++) {
    const p = curve.getPoint(i / steps)
    positions.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z)
    if (i < steps) {
      const s = i * 2
      indices.push(s, s + 1, s + 2, s + 1, s + 3, s + 2)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function CableView({ bench, cable }: { bench: Bench; cable: Cable }) {
  const a = resolvePoint(bench, cable.from)
  const b = resolvePoint(bench, cable.to)
  const [geometry] = useState(() =>
    cable.ribbon ? ribbonGeometry(a, b, 1.1) : new THREE.TubeGeometry(cablePath(a, b), 48, 0.13, 10, false),
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color={cable.color ?? '#26282c'} roughness={0.6} side={cable.ribbon ? THREE.DoubleSide : THREE.FrontSide} />
    </mesh>
  )
}
