import * as THREE from 'three'

/** Board outline with a printed top: the side wall is dark laminate, the top carries the texture. */
export function makePcbGeometry(outline: [number, number][], holes: [number, number, number][], w: number, h: number, thickness: number) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)))
  for (const [x, y, r] of holes) {
    const hole = new THREE.Path()
    hole.absarc(x, y, r, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  }
  const body = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 16 })
  const top = new THREE.ShapeGeometry(shape, 16)
  const positions = top.getAttribute('position')
  const uv = top.getAttribute('uv')
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, positions.getX(i) / w + 0.5, positions.getY(i) / h + 0.5)
  }
  uv.needsUpdate = true
  return { body, top }
}

/** Rounded rectangle outline centred on the origin, optionally with one clipped corner. */
export function roundedOutline(w: number, h: number, r: number): [number, number][] {
  const points: [number, number][] = []
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
    [w / 2 - r, -h / 2 + r, Math.PI * 1.5],
  ]
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= 6; i++) {
      const angle = start + (i / 6) * (Math.PI / 2)
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
    }
  }
  return points
}
