import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ModulePart, Vec3 } from '../data/types.ts'
import { live, setInput } from '../lib/bench-store.ts'
import { Box, BoxField, Cyl, Indicator } from './Primitives.tsx'
import { TextScreen } from './Parts.tsx'

function Servo({ id }: { id: string }) {
  const horn = useRef<THREE.Group>(null)
  useFrame(() => {
    const angle = Number(live.outputs[id] ?? 90)
    if (horn.current) horn.current.rotation.y = ((angle - 90) * Math.PI) / 180
  })
  return (
    <group>
      <Box at={[0, 1.15, 0]} size={[1.25, 2.3, 2.32]} color="#2d62a8" rough={0.45} />
      <Box at={[0, 1.65, 0]} size={[1.25, 0.2, 3.2]} color="#2d62a8" rough={0.45} />
      <Cyl at={[0, 2.5, -0.5]} radius={0.55} height={0.4} color="#2d62a8" rough={0.45} />
      <group position={[0, 2.78, -0.5]} ref={horn}>
        <Cyl at={[0, 0, 0]} radius={0.22} height={0.22} color="#efefea" />
        <Box at={[0, 0.03, -0.75]} size={[0.32, 0.1, 1.7]} color="#efefea" rough={0.5} />
      </group>
      <Box at={[-0.55, 0.3, 1.5]} size={[0.3, 0.1, 0.9]} color="#6d3f1a" />
    </group>
  )
}

function Motor({ id }: { id: string }) {
  const wheel = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const speed = Number(live.outputs[id] ?? 0)
    if (wheel.current) wheel.current.rotation.x -= speed * 22 * dt
  })
  return (
    <group>
      <group position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Cyl at={[0, 0, 0]} radius={0.62} height={2.2} color="#c8cbcf" metal={0.85} rough={0.32} />
        <Cyl at={[0, 1.16, 0]} radius={0.12} height={0.5} color="#a5a8ac" metal={0.9} rough={0.3} />
      </group>
      <Box at={[-1.14, 0.62, 0]} size={[0.08, 0.5, 0.7]} color="#d9c07d" />
      <group ref={wheel} position={[1.8, 1.4, 0]} rotation={[0, 0, 0]}>
        <group rotation={[0, 0, Math.PI / 2]}>
          <Cyl at={[0, 0, 0]} radius={1.4} height={0.5} color="#e0a31c" />
          <Cyl at={[0, 0, 0]} radius={1.45} height={0.32} color="#26282c" />
          <Cyl at={[0, 0.26, 0]} radius={0.4} height={0.04} color="#f5f2e4" />
        </group>
        <Box at={[0.3, 0.95, 0]} size={[0.02, 0.5, 0.2]} color="#f5f2e4" />
      </group>
    </group>
  )
}

function Pir() {
  return (
    <group>
      <Box at={[0, 0.3, 0]} size={[2.4, 0.1, 2.4]} color="#14662f" />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} at={[sx * 0.95, 0.13, sz * 0.95]} radius={0.1} height={0.25} color="#3a3d42" />))}
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f2f0e6" roughness={0.55} />
      </mesh>
      <BoxField points={[[-0.25, 0.42, 1.25], [0, 0.42, 1.25], [0.25, 0.42, 1.25]]} size={[0.07, 0.18, 0.07]} color="#d6ab45" metal={0.8} />
    </group>
  )
}

function Camera({ id }: { id: string }) {
  return (
    <group>
      <Box at={[0, 0.3, 0]} size={[2.5, 0.1, 2.4]} color="#14662f" />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} at={[sx * 1.05, 0.13, sz * 1]} radius={0.1} height={0.25} color="#3a3d42" />))}
      <Box at={[0, 0.5, 0]} size={[0.85, 0.32, 0.85]} color="#1a1b1e" />
      <Cyl at={[0, 0.72, 0]} radius={0.3} height={0.14} color="#0e0f11" />
      <Cyl at={[0, 0.8, 0]} radius={0.17} height={0.01} color="#1d3a66" metal={0.6} rough={0.1} />
      <Box at={[0, 0.38, -1.05]} size={[1.9, 0.1, 0.3]} color="#17181b" />
      <Indicator at={[0.9, 0.38, 0.9]} color="#f6f4e6" output={id} size={[0.2, 0.05, 0.2]} />
    </group>
  )
}

function Monitor({ id }: { id: string }) {
  return (
    <group>
      <Box at={[0, 0.1, 0]} size={[4.5, 0.2, 2.4]} color="#2b2d31" />
      <Box at={[0, 1.8, -0.2]} size={[0.8, 3.4, 0.3]} color="#2b2d31" />
      <Box at={[0, 6.8, 0]} size={[14, 8.1, 0.5]} color="#17181b" rough={0.4} />
      <TextScreen
        id={id}
        at={[0, 6.8, 0.26]}
        size={[13.4, 7.5]}
        pixels={[1024, 572]}
        style={{ background: '#0e2a33', ink: '#e8f2f2', size: 58 }}
        fallback=""
      />
    </group>
  )
}

function Keyboard() {
  const keys: Vec3[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 14; col++) keys.push([-5.2 + col * 0.8, 0.55, -1.5 + row * 0.8])
  }
  return (
    <group>
      <Box at={[0, 0.25, 0]} size={[12, 0.5, 4.6]} color="#e8e8e3" />
      <BoxField points={keys} size={[0.68, 0.14, 0.68]} color="#2b2d31" rough={0.7} castShadow />
    </group>
  )
}

function Psu() {
  return (
    <group>
      <Box at={[0, 1, 0]} size={[2.8, 2, 3.2]} color="#f0f0ec" rough={0.5} />
      <Box at={[0, 2.02, 0]} size={[1.4, 0.03, 1.4]} color="#d9d9d4" />
      <Cyl at={[0, 0.8, -1.65]} rotation={[Math.PI / 2, 0, 0]} radius={0.2} height={0.2} color="#f0f0ec" />
    </group>
  )
}

function Ssd({ id }: { id: string }) {
  return (
    <group>
      <Box at={[0, 0.5, 0]} size={[3.2, 1, 5.6]} color="#2a2d32" rough={0.5} />
      <Box at={[0, 1.01, -0.5]} size={[2.2, 0.01, 3]} color="#3a3d42" />
      <Indicator at={[1.1, 1.02, 2.3]} color="#3fc76b" output={id} size={[0.2, 0.05, 0.2]} />
    </group>
  )
}

function Router() {
  return (
    <group>
      <Box at={[0, 0.7, 0]} size={[5, 1.4, 3.2]} color="#f0f0ec" rough={0.5} />
      {[-2, 2].map((x) => (
        <Cyl key={x} at={[x, 2.4, -1.2]} radius={0.14} height={2} top={0.1} color="#26282c" />
      ))}
      <Indicator at={[-1.5, 1.42, 1.3]} color="#3fc76b" size={[0.15, 0.03, 0.15]} always />
      <Indicator at={[-1, 1.42, 1.3]} color="#3fc76b" size={[0.15, 0.03, 0.15]} always />
    </group>
  )
}

function Phone({ id }: { id: string }) {
  const tilt = -0.32
  return (
    <group
      onPointerDown={(event) => {
        event.stopPropagation()
        setInput(id, (live.inputs[id] ?? 0) > 0 ? 0 : 1)
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <Box at={[0, 0.2, 0.4]} size={[3.4, 0.4, 2.2]} color="#3a3d42" />
      <group position={[0, 3.3, 0]} rotation={[tilt, 0, 0]}>
        <Box at={[0, 0, 0]} size={[3.3, 6.5, 0.25]} color="#17181b" rough={0.3} />
        <TextScreen
          id={id}
          at={[0, 0, 0.13]}
          size={[3, 6.1]}
          pixels={[300, 610]}
          style={{ background: '#f6f7f8', ink: '#131416', size: 46, align: 'center' }}
          fallback={'Lamp is off\n\nSwitch it'}
        />
      </group>
    </group>
  )
}

function Car({ id }: { id: string }) {
  const body = useRef<THREE.Group>(null)
  useFrame(() => {
    const cm = live.inputs[id] ?? 60
    if (body.current) body.current.position.z = (cm / 100) * 3.5
  })
  return (
    <group ref={body}>
      <Box at={[0, 0.65, 0]} size={[2.6, 0.7, 5]} color="#c33a2c" rough={0.35} />
      <Box at={[0, 1.25, 0.3]} size={[2.2, 0.6, 2.4]} color="#21313f" rough={0.2} />
      {[-1, 1].flatMap((sx) =>
        [-1.5, 1.5].map((z) => (
          <Cyl key={`${sx}${z}`} at={[sx * 1.3, 0.42, z]} rotation={[0, 0, Math.PI / 2]} radius={0.42} height={0.32} color="#17181b" />
        )),
      )}
    </group>
  )
}

export function ModuleView({ mod }: { mod: ModulePart }) {
  const inner = () => {
    switch (mod.kind) {
      case 'servo':
        return <Servo id={mod.id} />
      case 'motor':
        return <Motor id={mod.id} />
      case 'pir':
        return <Pir />
      case 'camera':
        return <Camera id={mod.id} />
      case 'monitor':
        return <Monitor id={mod.id} />
      case 'keyboard':
        return <Keyboard />
      case 'psu':
        return <Psu />
      case 'ssd':
        return <Ssd id={mod.id} />
      case 'router':
        return <Router />
      case 'phone':
        return <Phone id={mod.id} />
      case 'car':
        return <Car id={mod.id} />
    }
  }
  return (
    <group position={[mod.pos[0], 0, mod.pos[1]]} rotation={[0, mod.rot ?? 0, 0]}>
      {inner()}
    </group>
  )
}
