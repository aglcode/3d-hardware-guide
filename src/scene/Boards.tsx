import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { PI_SIZE, UNO_PINS, UNO_SIZE, piPinMm } from '../data/boards.ts'
import type { Vec2, Vec3 } from '../data/types.ts'
import { PCB_TOP } from '../lib/geometry.ts'
import { makePcbGeometry, roundedOutline } from './pcb.ts'
import { Box, BoxField, Cyl, Indicator } from './Primitives.tsx'
import { piTexture, unoTexture } from './textures.ts'

// Sizes and positions below are taken from the sources listed in docs/board-references.md.

const THICKNESS = 0.16
const STANDOFF = PCB_TOP - THICKNESS
const PLASTIC = '#1d1f23'
const STEEL = '#bfc2c6'
const STEEL_DARK = '#8f9398'
const GOLD = '#d9b04c'
const METAL = 0.62
const CHIP = '#16171a'
const JST = '#efe9d8'

/** Board-local point from millimetres measured off the lower-left corner; `up` is centimetres above the PCB. */
function unoAt(x: number, y: number, up = 0): Vec3 {
  return [x / 10 - UNO_SIZE.w / 2, PCB_TOP + up, -(y / 10 - UNO_SIZE.h / 2)]
}

function piAt(x: number, y: number, up = 0): Vec3 {
  return [x / 10 - PI_SIZE.w / 2, PCB_TOP + up, -(y / 10 - PI_SIZE.h / 2)]
}

/** A flat part given by its extents in millimetres on the board drawing. */
function Part({ at, x, y, height, color, metal, rough }: { at: typeof unoAt; x: [number, number]; y: [number, number]; height: number; color: string; metal?: number; rough?: number }) {
  const center = at((x[0] + x[1]) / 2, (y[0] + y[1]) / 2, height / 2)
  return <Box at={center} size={[(x[1] - x[0]) / 10, height, (y[1] - y[0]) / 10]} color={color} metal={metal} rough={rough} />
}

function Pcb({ outline, holes, w, h, texture }: { outline: [number, number][]; holes: [number, number, number][]; w: number; h: number; texture: THREE.Texture }) {
  const [geometry] = useState(() => makePcbGeometry(outline, holes, w, h, THICKNESS))
  useEffect(
    () => () => {
      geometry.body.dispose()
      geometry.top.dispose()
    },
    [geometry],
  )
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, STANDOFF, 0]}>
      <mesh geometry={geometry.body} castShadow receiveShadow>
        <meshStandardMaterial color="#20262a" roughness={0.8} />
      </mesh>
      <mesh geometry={geometry.top} position={[0, 0, THICKNESS + 0.002]} receiveShadow>
        <meshStandardMaterial map={texture} roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  )
}

function useTexture(make: () => THREE.Texture) {
  const [texture] = useState(make)
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Standoffs({ points }: { points: Vec3[] }) {
  return (
    <>
      {points.map((p, i) => (
        <Cyl key={i} at={[p[0], STANDOFF / 2, p[2]]} radius={0.16} height={STANDOFF} color="#3a3d42" />
      ))}
    </>
  )
}

function SocketHeader({ from, to }: { from: Vec3; to: Vec3 }) {
  const length = Math.abs(to[0] - from[0]) + 0.254
  const center: Vec3 = [(from[0] + to[0]) / 2, PCB_TOP + 0.425, from[2]]
  return <Box at={center} size={[length, 0.85, 0.25]} color={PLASTIC} rough={0.75} />
}

/** Six gold programming pins on a black base, three along x and two along y, centred in millimetres. */
function IcspHeader({ at, x, y, alongY }: { at: typeof unoAt; x: number; y: number; alongY?: boolean }) {
  const pins: Vec3[] = []
  for (const long of [-2.54, 0, 2.54]) {
    for (const short of [-1.27, 1.27]) {
      pins.push(alongY ? at(x + short, y + long, 0.45) : at(x + long, y + short, 0.45))
    }
  }
  return (
    <>
      <Box at={at(x, y, 0.13)} size={alongY ? [0.5, 0.26, 0.76] : [0.76, 0.26, 0.5]} color={PLASTIC} rough={0.75} />
      <BoxField points={pins} size={[0.064, 0.7, 0.064]} color={GOLD} metal={METAL} rough={0.3} castShadow />
    </>
  )
}

function Electrolytic({ x, y }: { x: number; y: number }) {
  return (
    <group>
      <Box at={unoAt(x, y, 0.04)} size={[0.66, 0.08, 0.66]} color={PLASTIC} />
      <Cyl at={unoAt(x, y, 0.42)} radius={0.31} height={0.7} color={STEEL} metal={METAL} rough={0.35} />
      <mesh position={unoAt(x, y, 0.775)}>
        <cylinderGeometry args={[0.27, 0.27, 0.004, 20, 1, false, 0, Math.PI / 2]} />
        <meshStandardMaterial color={CHIP} />
      </mesh>
    </group>
  )
}

const UNO_SOCKET_TOPS: Vec3[] = Object.values(UNO_PINS).map(([x, y]) => unoAt(x, y, 0.856))

const UNO_HOLE_MM = [
  [14, 2.54],
  [15.3, 50.8],
  [66.1, 7.6],
  [66.1, 35.6],
] as const

const UNO_HOLES: [number, number, number][] = UNO_HOLE_MM.map(([x, y]) => [x / 10 - UNO_SIZE.w / 2, y / 10 - UNO_SIZE.h / 2, 0.16])

/** Outline from Arduino's pinout: rounded at the USB end, chamfered around the far corners. */
const UNO_OUTLINE: [number, number][] = (
  [
    [1.5, 0],
    [66.1, 0],
    [68.6, 3],
    [68.6, 38.6],
    [66.1, 40.8],
    [66.1, 53.4],
    [1.5, 53.4],
    [0, 51.9],
    [0, 1.5],
  ] as [number, number][]
).map(([x, y]) => [x / 10 - UNO_SIZE.w / 2, y / 10 - UNO_SIZE.h / 2])

/** Small resistors and capacitors drawn on the pinout: [x, y, length along x, width]. */
const UNO_PASSIVES: [number, number, number, number][] = [
  [12, 29.6, 2, 1.1],
  [17, 29.6, 2, 1.1],
  [12, 32.4, 1.1, 2],
  [19, 39.5, 2, 1.1],
  [23, 32, 2, 1.1],
  [23, 37.5, 2, 1.1],
  [13.3, 42, 2.4, 1.2],
  [13.3, 39, 2.4, 1.2],
  [28, 25, 2.2, 1.2],
  [31.5, 25, 1.1, 2],
  [59.6, 27.7, 2, 4],
  [58.5, 33, 1.3, 3],
  [40, 24.6, 3, 1.4],
  [41.8, 24.6, 1.4, 3],
  [43.2, 10.4, 2.4, 1.1],
]

export function UnoBoard({ pos }: { pos: Vec2 }) {
  const texture = useTexture(() => unoTexture(UNO_PINS))
  const qfpLeads: Vec3[] = []
  const qfpSide: Vec3[] = []
  for (let i = 0; i < 8; i++) {
    const offset = -2.1 + i * 0.6
    qfpLeads.push(unoAt(42.3 + offset, 15.9 + 3.15, 0.03), unoAt(42.3 + offset, 15.9 - 3.15, 0.03))
    qfpSide.push(unoAt(42.3 + 3.15, 15.9 + offset, 0.03), unoAt(42.3 - 3.15, 15.9 + offset, 0.03))
  }
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <Pcb outline={UNO_OUTLINE} holes={UNO_HOLES} w={UNO_SIZE.w} h={UNO_SIZE.h} texture={texture} />
      <Standoffs points={UNO_HOLE_MM.map(([x, y]) => unoAt(x, y))} />

      <SocketHeader from={unoAt(18.796, 50.8)} to={unoAt(41.656, 50.8)} />
      <SocketHeader from={unoAt(45.72, 50.8)} to={unoAt(63.5, 50.8)} />
      <SocketHeader from={unoAt(27.94, 2.54)} to={unoAt(45.72, 2.54)} />
      <SocketHeader from={unoAt(50.8, 2.54)} to={unoAt(63.5, 2.54)} />
      <BoxField points={UNO_SOCKET_TOPS} size={[0.11, 0.01, 0.11]} color="#050506" />

      {/* USB-B: x -6.2 to 9.1, y 32.5 to 44.1 */}
      <Part at={unoAt} x={[-6.2, 9.1]} y={[32.5, 44.1]} height={1.1} color={STEEL} metal={METAL} rough={0.3} />
      <Part at={unoAt} x={[-6.2, 9.1]} y={[35.5, 41.1]} height={1.105} color={STEEL_DARK} metal={METAL} rough={0.4} />
      <Box at={unoAt(-6.25, 38.3, 0.55)} size={[0.02, 0.86, 0.96]} color="#121316" />
      <Box at={unoAt(-5.8, 38.3, 0.55)} size={[0.8, 0.34, 0.5]} color="#e7e4d6" />

      {/* Barrel jack: x -2.4 to 11.6, y 3.5 to 11.6 */}
      <Part at={unoAt} x={[0, 11.6]} y={[3.5, 11.6]} height={1.1} color={CHIP} rough={0.5} />
      <Part at={unoAt} x={[-2.4, 0]} y={[2.6, 12.6]} height={1.15} color={CHIP} rough={0.5} />
      <Cyl at={unoAt(-2.45, 7.6, 0.58)} rotation={[0, 0, Math.PI / 2]} radius={0.33} height={0.04} color="#050506" />
      <Cyl at={unoAt(-2.2, 7.6, 0.58)} rotation={[0, 0, Math.PI / 2]} radius={0.07} height={0.5} color={STEEL} metal={METAL} rough={0.3} />

      {/* Regulator, input diode and supply capacitors */}
      <Part at={unoAt} x={[6.5, 10.2]} y={[14, 20.6]} height={0.16} color={CHIP} rough={0.4} />
      <Part at={unoAt} x={[5.7, 6.5]} y={[15.3, 19.3]} height={0.05} color={STEEL} metal={METAL} rough={0.3} />
      <Part at={unoAt} x={[10.2, 11.8]} y={[14.5, 15.6]} height={0.04} color={STEEL} metal={METAL} rough={0.3} />
      <Part at={unoAt} x={[10.2, 11.8]} y={[16.8, 17.9]} height={0.04} color={STEEL} metal={METAL} rough={0.3} />
      <Part at={unoAt} x={[10.2, 11.8]} y={[19, 20.1]} height={0.04} color={STEEL} metal={METAL} rough={0.3} />
      <Part at={unoAt} x={[2.5, 5.9]} y={[24.5, 28.4]} height={0.18} color={CHIP} rough={0.45} />
      <Part at={unoAt} x={[3.2, 5.2]} y={[23, 24.5]} height={0.05} color={STEEL} metal={METAL} rough={0.35} />
      <Part at={unoAt} x={[3.2, 5.2]} y={[28.4, 29.9]} height={0.05} color={STEEL} metal={METAL} rough={0.35} />
      <Electrolytic x={18.5} y={9.2} />
      <Electrolytic x={25.6} y={9.2} />
      <Part at={unoAt} x={[18.2, 21.9]} y={[18.6, 21.8]} height={0.12} color={CHIP} rough={0.4} />
      <Part at={unoAt} x={[20.2, 23.6]} y={[14.3, 16.8]} height={0.1} color={CHIP} rough={0.4} />

      {/* 16 MHz crystal, a flat oval can */}
      <Part at={unoAt} x={[16.6, 23.4]} y={[24, 28.7]} height={0.36} color={STEEL} metal={METAL} rough={0.22} />
      <Cyl at={unoAt(16.6, 26.35, 0.18)} radius={0.235} height={0.36} color={STEEL} metal={METAL} rough={0.22} />
      <Cyl at={unoAt(23.4, 26.35, 0.18)} radius={0.235} height={0.36} color={STEEL} metal={METAL} rough={0.22} />

      {/* ATmega16U2, the USB interface chip */}
      <Part at={unoAt} x={[17.5, 22.5]} y={[32.2, 37.2]} height={0.09} color={CHIP} rough={0.35} />

      {/* ATmega328P, the small square chip in the middle of the board */}
      <Part at={unoAt} x={[39.2, 45.4]} y={[12.8, 19]} height={0.12} color={CHIP} rough={0.32} />
      <BoxField points={qfpLeads} size={[0.03, 0.03, 0.09]} color={STEEL} metal={METAL} rough={0.3} />
      <BoxField points={qfpSide} size={[0.09, 0.03, 0.03]} color={STEEL} metal={METAL} rough={0.3} />
      <Cyl at={unoAt(39.9, 18.3, 0.121)} radius={0.03} height={0.003} color="#55585c" />

      <IcspHeader at={unoAt} x={18.5} y={46} />
      <IcspHeader at={unoAt} x={65} y={28} alongY />

      {/* Reset button at (6.1, 49.8) */}
      <Part at={unoAt} x={[3.1, 9.1]} y={[46.8, 52.8]} height={0.2} color={STEEL} metal={METAL} rough={0.32} />
      <Cyl at={unoAt(6.1, 49.8, 0.27)} radius={0.17} height={0.14} color="#2a2c30" rough={0.45} />

      {UNO_PASSIVES.map(([x, y, length, width]) => (
        <Part key={`${x}-${y}`} at={unoAt} x={[x - length / 2, x + length / 2]} y={[y - width / 2, y + width / 2]} height={0.05} color={width > length ? '#2a2c30' : '#c8b28a'} />
      ))}

      <Indicator at={unoAt(28, 43, 0.05)} color="#f3a13a" output="uno.L" />
      <Indicator at={unoAt(28, 36.6, 0.05)} color="#f3a13a" />
      <Indicator at={unoAt(28, 33.9, 0.05)} color="#f3a13a" />
      <Indicator at={unoAt(58.5, 36.6, 0.05)} color="#47c96f" always />
    </group>
  )
}

const PI_HOLE_MM = [
  [3.5, 3.5],
  [61.5, 3.5],
  [3.5, 52.5],
  [61.5, 52.5],
] as const

const PI_HOLES: [number, number, number][] = PI_HOLE_MM.map(([x, y]) => [x / 10 - PI_SIZE.w / 2, y / 10 - PI_SIZE.h / 2, 0.135])

function PiHeader() {
  const pins = Array.from({ length: 40 }, (_, i): Vec3 => {
    const [x, y] = piPinMm(i + 1)
    return piAt(x, y, 0.42)
  })
  return (
    <>
      <Box at={piAt(32.5, 52.5, 0.125)} size={[5.08, 0.25, 0.5]} color={PLASTIC} rough={0.75} />
      <BoxField points={pins} size={[0.064, 0.86, 0.064]} color={STEEL} metal={METAL} rough={0.28} castShadow />
    </>
  )
}

/** A stacked pair of USB-A sockets, opening towards +x. Centre y from the drawing; 16 mm tall. */
function UsbStack({ y, tongue }: { y: number; tongue: string }) {
  const front = 88
  return (
    <group>
      <Part at={piAt} x={[71.5, front]} y={[y - 6.6, y + 6.6]} height={1.6} color={STEEL} metal={METAL} rough={0.26} />
      <Part at={piAt} x={[74, 86]} y={[y - 5.4, y + 5.4]} height={1.604} color={STEEL_DARK} metal={METAL} rough={0.36} />
      {[0.42, 1.18].map((up) => (
        <group key={up}>
          <Box at={piAt(front + 0.02, y, up)} size={[0.01, 0.58, 1.15]} color="#0c0d0f" />
          <Box at={piAt(front + 0.03, y, up + 0.02)} size={[0.01, 0.14, 0.92]} color={tongue} rough={0.45} />
        </group>
      ))}
    </group>
  )
}

function Ethernet() {
  const front = 88.6
  const y = 10.2
  return (
    <group>
      <Part at={piAt} x={[67.4, front]} y={[2.2, 18.2]} height={1.37} color={STEEL} metal={METAL} rough={0.26} />
      <Part at={piAt} x={[70, 82]} y={[4.5, 15.9]} height={1.375} color="#c6c9cd" metal={0.65} rough={0.5} />
      <Box at={piAt(front + 0.02, y, 0.62)} size={[0.01, 0.98, 1.3]} color="#0c0d0f" />
    </group>
  )
}

/** Micro-HDMI or USB-C shell on the near edge, opening towards the viewer. Sizes in millimetres. */
function EdgeShell({ x, width, height, back }: { x: number; width: number; height: number; back: number }) {
  return (
    <group>
      <Part at={piAt} x={[x - width / 2, x + width / 2]} y={[-2.3, back]} height={height / 10} color={STEEL} metal={METAL} rough={0.26} />
      <Box at={piAt(x, -2.32, height / 20)} size={[(width - 0.9) / 10, (height - 0.9) / 10, 0.01]} color="#0c0d0f" />
    </group>
  )
}

/** A vertical CAM/DISP connector with its dark latch. */
function Fpc({ x }: { x: [number, number] }) {
  return (
    <group>
      <Part at={piAt} x={x} y={[1.5, 16.5]} height={0.2} color={JST} rough={0.6} />
      <Part at={piAt} x={[x[0] + 0.7, x[1] - 0.7]} y={[2, 16]} height={0.24} color="#6d5237" rough={0.55} />
    </group>
  )
}

function Jst({ x, y }: { x: [number, number]; y: [number, number] }) {
  return (
    <group>
      <Part at={piAt} x={x} y={y} height={0.3} color={JST} rough={0.6} />
      <Part at={piAt} x={[x[0] + 0.5, x[1] - 0.5]} y={[y[0] + 0.5, y[1] - 0.5]} height={0.302} color="#b7ae97" rough={0.7} />
    </group>
  )
}

export function PiBoard({ pos }: { pos: Vec2 }) {
  const texture = useTexture(piTexture)
  const ribs: Vec3[] = [piAt(33.5, 17, 0.2), piAt(33.5, 28.5, 0.2)]
  const poe: Vec3[] = [0, 1].flatMap((c) => [0, 1].map((r): Vec3 => piAt(60.73 + c * 2.54, 7.33 + r * 2.54, 0.38)))
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <Pcb outline={roundedOutline(PI_SIZE.w, PI_SIZE.h, 0.3)} holes={PI_HOLES} w={PI_SIZE.w} h={PI_SIZE.h} texture={texture} />
      <Standoffs points={PI_HOLE_MM.map(([x, y]) => piAt(x, y))} />
      <PiHeader />

      {/* Wi-Fi and Bluetooth can */}
      <Part at={piAt} x={[7.3, 18]} y={[35.6, 49.4]} height={0.2} color={STEEL} metal={METAL} rough={0.28} />

      {/* LPDDR4X, BCM2712 under its ribbed shield, RP1 */}
      <Part at={piAt} x={[26, 41]} y={[34, 44]} height={0.12} color={CHIP} rough={0.32} />
      <Part at={piAt} x={[25, 42]} y={[14, 31.5]} height={0.2} color={STEEL} metal={METAL} rough={0.3} />
      {ribs.map((p, i) => (
        <Box key={i} at={p} size={[1.72, 0.02, 0.14]} color={STEEL_DARK} metal={METAL} rough={0.35} />
      ))}
      <Part at={piAt} x={[52.5, 65]} y={[29, 41]} height={0.11} color={CHIP} rough={0.32} />
      <Box at={piAt(64.5, 24.7, 0.05)} size={[0.5, 0.1, 0.5]} color={CHIP} rough={0.35} rotation={[0, Math.PI / 4, 0]} />

      {/* Ports */}
      <UsbStack y={47} tongue="#17181a" />
      <UsbStack y={29.1} tongue="#2467c1" />
      <Ethernet />
      <EdgeShell x={11.2} width={8.7} height={3.2} back={6.4} />
      <EdgeShell x={25.8} width={5.7} height={3.4} back={7.1} />
      <EdgeShell x={39.2} width={5.7} height={3.4} back={7.1} />

      {/* Small connectors */}
      <Jst x={[17.4, 21.5]} y={[3, 6.4]} />
      <Jst x={[30.4, 35.4]} y={[2, 6]} />
      <Jst x={[64, 69]} y={[49, 55]} />
      <Part at={piAt} x={[65, 70]} y={[41, 48]} height={0.25} color="#26282c" rough={0.5} />
      <Fpc x={[47.5, 50.5]} />
      <Fpc x={[53.7, 57]} />

      {/* PoE header, PCIe connector, microSD underneath */}
      <Box at={piAt(62, 8.6, 0.1)} size={[0.5, 0.2, 0.5]} color={PLASTIC} />
      <BoxField points={poe} size={[0.064, 0.76, 0.064]} color={GOLD} metal={METAL} rough={0.3} castShadow />
      <Part at={piAt} x={[0.7, 4.8]} y={[24.7, 35.7]} height={0.2} color={JST} rough={0.6} />
      <Part at={piAt} x={[1.3, 4.2]} y={[25.2, 35.2]} height={0.24} color="#6d5237" rough={0.55} />
      <Box at={piAt(-0.55, 28, -0.2)} size={[0.35, 0.08, 1.1]} color="#2a2d32" />

      {/* Power management: the PMIC and its row of inductors */}
      <Part at={piAt} x={[8.2, 14.9]} y={[12, 18]} height={0.1} color={CHIP} rough={0.35} />
      {[5.7, 8.2, 10.7, 13.2].map((x) => (
        <Part key={x} at={piAt} x={[x, x + 2]} y={[20, 24]} height={0.13} color="#55585d" rough={0.6} />
      ))}

      {/* Power button on the left edge */}
      <Part at={piAt} x={[-0.4, 2.2]} y={[12, 14.6]} height={0.14} color={CHIP} rough={0.5} />

      {/* Status LEDs, placed from the photo */}
      <Indicator at={piAt(3, 17, 0.05)} color="#3fc76b" output="pi.ACT" size={[0.1, 0.05, 0.14]} />
      <Indicator at={piAt(3, 18.8, 0.05)} color="#df3c30" always size={[0.1, 0.05, 0.14]} />
    </group>
  )
}
