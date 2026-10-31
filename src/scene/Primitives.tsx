import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../data/types.ts'
import { live } from '../lib/bench-store.ts'

type Surface = {
  color: string
  metal?: number
  rough?: number
}

export function Box({ at, size, color, metal = 0, rough = 0.65, rotation }: Surface & { at: Vec3; size: Vec3; rotation?: Vec3 }) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  )
}

/** A cylinder standing on the y axis. `at` is its centre. */
export function Cyl({ at, radius, height, color, metal = 0, rough = 0.6, rotation, top }: Surface & { at: Vec3; radius: number; height: number; rotation?: Vec3; top?: number }) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[top ?? radius, radius, height, 24]} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  )
}

/** Many identical small boxes (pins, sockets, keys) as a single draw call. */
export function BoxField({ points, size, color, metal = 0, rough = 0.5, castShadow = false }: Surface & { points: Vec3[]; size: Vec3; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new THREE.Matrix4()
    points.forEach((p, i) => mesh.setMatrixAt(i, matrix.setPosition(p[0], p[1], p[2])))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [points])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} castShadow={castShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </instancedMesh>
  )
}

/** A small SMD or through-hole indicator LED that lights from a simulation output. */
export function Indicator({ at, color, output, always, size = [0.16, 0.06, 0.09] }: { at: Vec3; color: string; output?: string; always?: boolean; size?: Vec3 }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(() => {
    const value = output ? Number(live.outputs[output] ?? 0) : 0
    const running = always && Object.keys(live.outputs).length > 0
    if (material.current) material.current.emissiveIntensity = running ? 2.6 : value * 3.2
  })
  return (
    <mesh position={at}>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={material} color={color} emissive={color} emissiveIntensity={0} roughness={0.35} />
    </mesh>
  )
}
