import * as THREE from 'three'

import { lerp } from '../mathUtils'
import {
  FINTECH_SATELLITE_COUNT,
  MOON_TRAIL_POINTS,
  TRAIL_MAX_SUBSTEPS,
  TRAIL_POINT_MAX_STEP,
} from './planetConstants'

export function createTrailColors(base, highlight, power = 1.6) {
  const colors = new Float32Array(MOON_TRAIL_POINTS * 3)
  for (let i = 0; i < MOON_TRAIL_POINTS; i += 1) {
    const t = Math.pow(1 - i / (MOON_TRAIL_POINTS - 1), power)
    colors[i * 3] = lerp(base[0], highlight[0], t)
    colors[i * 3 + 1] = lerp(base[1], highlight[1], t)
    colors[i * 3 + 2] = lerp(base[2], highlight[2], t)
  }
  return colors
}

/** FinTech now mirrors AR/VR satellite tails (purple + cyan). */
export function createFintechTrailPaletteSets() {
  const slots = []
  for (let i = 0; i < FINTECH_SATELLITE_COUNT; i += 1) {
    if (i === 0) {
      slots.push({
        core: createTrailColors([0.54, 0.22, 0.78], [1, 0.82, 0.98]),
        wide: createTrailColors([0.03, 0.015, 0.045], [0.54, 0.3, 0.78], 2.8),
      })
    } else {
      slots.push({
        core: createTrailColors([0.1, 0.74, 0.88], [0.88, 1, 1]),
        wide: createTrailColors([0.01, 0.04, 0.05], [0.28, 0.88, 0.98], 2.8),
      })
    }
  }
  return slots
}

export function createSparkHeadPositions(count, radius) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2
    const r = Math.pow(Math.random(), 1.9) * radius
    const z = (Math.random() - 0.5) * radius * 0.7
    arr[i * 3] = Math.cos(a) * r
    arr[i * 3 + 1] = Math.sin(a) * r
    arr[i * 3 + 2] = z
  }
  return arr
}

export function updateTrailFromObject({
  sourceRef,
  parentRef,
  coreGeomRef,
  softGeomRef,
  corePositions,
  softPositions,
  readyRef,
  coreGeomDupRefs,
}) {
  const dupGeomRefs = coreGeomDupRefs ?? []
  if (!sourceRef.current || !parentRef.current || !coreGeomRef.current || !softGeomRef.current) return
  const worldPos = new THREE.Vector3()
  const localPos = new THREE.Vector3()
  sourceRef.current.getWorldPosition(worldPos)
  localPos.copy(worldPos)
  parentRef.current.worldToLocal(localPos)

  if (!readyRef.current) {
    for (let i = 0; i < MOON_TRAIL_POINTS; i += 1) {
      corePositions[i * 3] = localPos.x
      corePositions[i * 3 + 1] = localPos.y
      corePositions[i * 3 + 2] = localPos.z
      softPositions[i * 3] = localPos.x
      softPositions[i * 3 + 1] = localPos.y
      softPositions[i * 3 + 2] = localPos.z
    }
    readyRef.current = true
  } else {
    const prevX = corePositions[0]
    const prevY = corePositions[1]
    const prevZ = corePositions[2]
    const dx = localPos.x - prevX
    const dy = localPos.y - prevY
    const dz = localPos.z - prevZ
    const distance = Math.hypot(dx, dy, dz)
    const substeps = Math.min(
      TRAIL_MAX_SUBSTEPS,
      Math.max(1, Math.ceil(distance / TRAIL_POINT_MAX_STEP)),
    )
    const shift = substeps * 3

    corePositions.copyWithin(shift, 0, corePositions.length - shift)
    softPositions.copyWithin(shift, 0, softPositions.length - shift)

    for (let s = 0; s < substeps; s += 1) {
      const t = (s + 1) / substeps
      const x = prevX + dx * t
      const y = prevY + dy * t
      const z = prevZ + dz * t
      const idx = s * 3
      corePositions[idx] = x
      corePositions[idx + 1] = y
      corePositions[idx + 2] = z
      softPositions[idx] = x
      softPositions[idx + 1] = y
      softPositions[idx + 2] = z
    }
  }

  coreGeomRef.current.attributes.position.needsUpdate = true
  softGeomRef.current.attributes.position.needsUpdate = true
  for (let i = 0; i < dupGeomRefs.length; i += 1) {
    const dup = dupGeomRefs[i]?.current
    if (dup?.attributes?.position) dup.attributes.position.needsUpdate = true
  }
}
