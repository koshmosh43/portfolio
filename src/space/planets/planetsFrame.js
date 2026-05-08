import * as THREE from 'three'

import {
  PLANET_D_RING_BASE_ROT,
  PLANET_D_RING_FOCUS_ROT,
  PLANET_D_RING_SPIN_AXIS,
} from './planetConstants'
import { lerpPlanetGroup, wrapTextureScroll } from './planetLayout'
import { updateTrailFromObject } from './planetTrails'

const saasRingSpinScratch = {
  euler: new THREE.Euler(),
  qBase: new THREE.Quaternion(),
  qSpin: new THREE.Quaternion(),
  axis: new THREE.Vector3(),
}

export function createPlanetFrameDefs(refs) {
  return {
    planetBodyFramePairs: [
      [
        refs.planetA,
        (t, o) => {
          o.rotation.y += 0.0031
          o.rotation.z = 0
        },
      ],
      [
        refs.planetB,
        (t, o) => {
          o.rotation.y += 0.0028
          o.rotation.x = Math.sin(t * 0.3) * 0.025
          o.rotation.z = 0
        },
      ],
      [
        refs.planetC,
        (t, o) => {
          o.rotation.y += 0.0024
          o.rotation.x = Math.sin(t * 0.26) * 0.022
        },
      ],
      [
        refs.planetD,
        (t, o) => {
          o.rotation.y += 0.00255
          o.rotation.x = Math.sin(t * 0.24 + 0.4) * 0.018
        },
      ],
      [
        refs.planetE,
        (t, o) => {
          o.rotation.y += 0.0036
          o.rotation.x = Math.sin(t * 0.4 + 0.8) * 0.02
        },
      ],
    ],
    cloudFieldFrameDefs: [
      { ref: refs.planetACloudField, dy: 0.0018, axis: 'x', f: 0.19, ph: 0, amp: 0.012 },
      { ref: refs.planetCCloudField, dy: 0.00155, axis: 'x', f: 0.17, ph: 0, amp: 0.012 },
      { ref: refs.planetDCloudField, dy: 0.00165, axis: 'x', f: 0.18, ph: 0, amp: 0.012 },
      { ref: refs.planetDCloudDarkField, dy: -0.00115, axis: 'x', f: 0.14, ph: 1.6, amp: 0.01 },
      { ref: refs.planetECloudField, dy: 0.0019, axis: 'z', f: 0.24, ph: 0.6, amp: 0.012 },
      { ref: refs.planetBCloudField, dy: -0.0014, axis: 'z', f: 0.2, ph: 0.7, amp: 0.01 },
    ],
    planetDShellFrameDefs: [
      {
        ref: refs.planetDCloudShellNear,
        dy: 0.00235,
        xF: 0.16,
        xPh: 0.8,
        xAmp: 0.012,
        zF: 0.1,
        zPh: 0.35,
        zAmp: 0.009,
        scroll: (t) => wrapTextureScroll(t * 0.0032),
      },
      {
        ref: refs.planetDCloudShellMid,
        dy: 0.00155,
        xF: 0.14,
        xPh: 1.4,
        xAmp: 0.015,
        zF: 0.11,
        zPh: 0.75,
        zAmp: 0.012,
        scroll: (t) => wrapTextureScroll(0.35 - t * 0.0024),
      },
      {
        ref: refs.planetDCloudShellFar,
        dy: 0.00095,
        xF: 0.12,
        xPh: 0.2,
        xAmp: 0.01,
        zF: 0.08,
        zPh: 1.1,
        zAmp: 0.008,
        scroll: (t) => wrapTextureScroll(0.68 + t * 0.0016),
      },
    ],
    moonOrbitFramePairs: [
      [
        refs.moonOrbit,
        (t, o) => {
          o.rotation.y += 0.015
          o.rotation.z = 0
        },
      ],
      [
        refs.moonOrbitB,
        (t, o) => {
          o.rotation.y -= 0.011
          o.rotation.x = 0
        },
      ],
      [
        refs.moonOrbitC,
        (t, o) => {
          o.rotation.y += 0.021
          o.rotation.z = 0
        },
      ],
    ],
    designMoonOrbitFramePairs: [
      [
        refs.designMoonOrbitA,
        (t, o) => {
          o.rotation.y += 0.026
          o.rotation.z = 0.08 + Math.sin(t * 0.68) * 0.045
        },
      ],
      [
        refs.designMoonOrbitB,
        (t, o) => {
          o.rotation.y -= 0.018
          o.rotation.x = -0.24 + Math.sin(t * 0.43 + 1.4) * 0.02
        },
      ],
    ],
    innerMoonBodyFramePairs: [
      [refs.moon, (t, o) => { o.rotation.y += 0.024 }],
      [
        refs.moonB,
        (t, o) => {
          o.rotation.y += 0.019
          o.rotation.z = Math.sin(t * 0.9) * 0.08
        },
      ],
      [
        refs.moonC,
        (t, o) => {
          o.rotation.y += 0.03
          o.rotation.x = Math.sin(t * 1.2) * 0.1
        },
      ],
    ],
    designMoonBodyFramePairs: [
      [
        refs.designMoonA,
        (t, o) => {
          o.rotation.y += 0.037
          o.rotation.x = Math.sin(t * 1.3) * 0.08
        },
      ],
      [
        refs.designMoonB,
        (t, o) => {
          o.rotation.y += 0.029
          o.rotation.z = Math.sin(t * 1.05 + 0.9) * 0.065
        },
      ],
    ],
    moonGlowPulseDefs: [
      [refs.moonGlow, 0.045, 0.028, 1.9, 0],
      [refs.moonBGlow, 0.038, 0.022, 1.4, 0.8],
      [refs.moonCGlow, 0.035, 0.02, 1.7, 1.6],
      [refs.designMoonAGlow, 0.04, 0.027, 1.92, 0.5],
      [refs.designMoonBGlow, 0.036, 0.024, 1.58, 1.7],
    ],
    pointsPuffDualDefs: [
      [refs.moonDustCoreMat, 0.24, 0.12, 1.35, 0, 0.033, 0.008, 1.2, 0.6],
      [refs.moonDustSoftMat, 0.09, 0.05, 1.05, 0.9, 0.084, 0.012, 0.95, 0.2],
      [refs.moonBDustCoreMat, 0.2, 0.09, 1.28, 1.1, 0.028, 0.007, 1.18, 0.8],
      [refs.moonBDustSoftMat, 0.075, 0.045, 0.94, 1.4, 0.064, 0.011, 0.9, 0.7],
      [refs.moonCDustCoreMat, 0.18, 0.09, 1.4, 2.2, 0.021, 0.006, 1.2, 1.9],
      [refs.moonCDustSoftMat, 0.07, 0.04, 0.98, 2.6, 0.054, 0.009, 0.92, 2.1],
      [refs.designMoonATrailCoreMat, 0.18, 0.12, 1.65, 0.2, 0.02, 0.007, 1.38, 0.9],
      [refs.designMoonATrailSoftMat, 0.07, 0.045, 1.12, 0.7, 0.05, 0.01, 0.96, 0.2],
      [refs.designMoonBTrailCoreMat, 0.16, 0.1, 1.42, 1.2, 0.018, 0.006, 1.2, 0.6],
      [refs.designMoonBTrailSoftMat, 0.06, 0.04, 1.05, 1.5, 0.046, 0.009, 0.9, 1.1],
    ],
    sparkPuffDualDefs: [
      [refs.moonSparkMat, 0.12, 0.1, 5.4, 0, 0.012, 0.006, 4.2, 0.5],
      [refs.moonBSparkMat, 0.1, 0.08, 4.8, 1.2, 0.01, 0.005, 3.9, 0.9],
      [refs.moonCSparkMat, 0.09, 0.07, 5.1, 2.1, 0.009, 0.004, 4.1, 1.6],
    ],
  }
}

export function runPlanetsFrame({
  clock,
  refs,
  defs,
  layout,
  activePlanetId,
  assets,
}) {
  const t = clock.elapsedTime
  if (!refs.root.current) return
  const isFocused = Boolean(activePlanetId)

  refs.root.current.rotation.y = isFocused ? Math.sin(t * 0.03) * 0.03 : Math.sin(t * 0.05) * 0.055

  const planetTargets = layout.planets
  const targetKey = isFocused ? 'focus' : 'idle'
  lerpPlanetGroup(refs.planetAGroup, planetTargets.planetA[targetKey])
  lerpPlanetGroup(refs.planetBGroup, planetTargets.planetB[targetKey])
  lerpPlanetGroup(refs.planetCGroup, planetTargets.planetC[targetKey])
  lerpPlanetGroup(refs.planetDGroup, planetTargets.planetD[targetKey])
  lerpPlanetGroup(refs.planetEGroup, planetTargets.planetE[targetKey])

  for (const [ref, fn] of defs.planetBodyFramePairs) {
    const o = ref.current
    if (o) fn(t, o)
  }

  for (const { ref, dy, axis, f, ph, amp } of defs.cloudFieldFrameDefs) {
    const o = ref.current
    if (!o) continue
    o.rotation.y += dy
    const w = Math.sin(t * f + ph) * amp
    if (axis === 'x') o.rotation.x = w
    else o.rotation.z = w
  }

  if (refs.planetDSatelliteRing.current) {
    const ring = refs.planetDSatelliteRing.current
    const ud = ring.userData
    const wantD = activePlanetId === 'planetD'
    ud.focus01 = THREE.MathUtils.lerp(ud.focus01 ?? 0, wantD ? 1 : 0, 0.07)
    const f = ud.focus01
    const rx = THREE.MathUtils.lerp(PLANET_D_RING_BASE_ROT[0], PLANET_D_RING_FOCUS_ROT[0], f)
    const ry = THREE.MathUtils.lerp(PLANET_D_RING_BASE_ROT[1], PLANET_D_RING_FOCUS_ROT[1], f)
    const rz = THREE.MathUtils.lerp(PLANET_D_RING_BASE_ROT[2], PLANET_D_RING_FOCUS_ROT[2], f)
    const g = ud.saasMotion
    const tiltX = g?.tiltX ?? 0
    const tiltZ = g?.tiltZ ?? 0
    const bob = g?.bob ?? 1
    const spinAngle = (g?.ringSpin ?? 0) * (1 + 0.52 * f)
    saasRingSpinScratch.euler.set(rx + tiltX, ry, rz + tiltZ, 'XYZ')
    saasRingSpinScratch.qBase.setFromEuler(saasRingSpinScratch.euler)
    saasRingSpinScratch.axis.fromArray(PLANET_D_RING_SPIN_AXIS).normalize()
    saasRingSpinScratch.qSpin.setFromAxisAngle(saasRingSpinScratch.axis, spinAngle)
    ring.quaternion.copy(saasRingSpinScratch.qBase).multiply(saasRingSpinScratch.qSpin)
    ring.position.set(
      0,
      THREE.MathUtils.lerp(-0.05, -0.065, f) * bob,
      THREE.MathUtils.lerp(-0.1, -0.125, f),
    )
  }

  for (const def of defs.planetDShellFrameDefs) {
    const shell = def.ref.current
    if (!shell) continue
    shell.rotation.y += def.dy
    shell.rotation.x = Math.sin(t * def.xF + def.xPh) * def.xAmp
    shell.rotation.z = Math.sin(t * def.zF + def.zPh) * def.zAmp
    const ox = def.scroll(t)
    shell.material.map.offset.x = ox
    shell.material.alphaMap.offset.x = ox
  }

  if (refs.moonPivot.current) {
    refs.moonPivot.current.rotation.x = 0
    refs.moonPivot.current.rotation.z = 0
  }

  for (const [ref, fn] of defs.moonOrbitFramePairs) {
    const o = ref.current
    if (o) fn(t, o)
  }

  for (const [ref, fn] of defs.innerMoonBodyFramePairs) {
    const o = ref.current
    if (o) fn(t, o)
  }

  for (const [ref, fn] of defs.designMoonOrbitFramePairs) {
    const o = ref.current
    if (o) fn(t, o)
  }

  for (const [ref, fn] of defs.designMoonBodyFramePairs) {
    const o = ref.current
    if (o) fn(t, o)
  }

  for (const [ref, base, amp, freq, phase] of defs.moonGlowPulseDefs) {
    const s = ref.current
    if (!s) continue
    s.material.opacity = base + (0.5 + 0.5 * Math.sin(t * freq + phase)) * amp
  }

  for (const row of defs.pointsPuffDualDefs) {
    const [ref, opB, opA, opF, opPh, szB, szA, szF, szPh] = row
    const m = ref.current
    if (!m) continue
    m.opacity = opB + (0.5 + 0.5 * Math.sin(t * opF + opPh)) * opA
    m.size = szB + (0.5 + 0.5 * Math.sin(t * szF + szPh)) * szA
  }

  for (const row of defs.sparkPuffDualDefs) {
    const [ref, opB, opA, opF, opPh, szB, szA, szF, szPh] = row
    const m = ref.current
    if (!m) continue
    m.opacity = opB + (0.5 + 0.5 * Math.sin(t * opF + opPh)) * opA
    m.size = szB + (0.5 + 0.5 * Math.sin(t * szF + szPh)) * szA
  }

  updateTrailFromObject({
    sourceRef: refs.moon,
    parentRef: refs.planetBGroup,
    coreGeomRef: refs.moonDustGeom,
    softGeomRef: refs.moonDustWideGeom,
    corePositions: assets.moonTrailPositions,
    softPositions: assets.moonTrailWidePositions,
    readyRef: refs.moonTrailReady,
  })
  updateTrailFromObject({
    sourceRef: refs.moonB,
    parentRef: refs.planetBGroup,
    coreGeomRef: refs.moonBDustGeom,
    softGeomRef: refs.moonBDustWideGeom,
    corePositions: assets.moonBTrailPositions,
    softPositions: assets.moonBTrailWidePositions,
    readyRef: refs.moonBTrailReady,
  })
  updateTrailFromObject({
    sourceRef: refs.moonC,
    parentRef: refs.planetBGroup,
    coreGeomRef: refs.moonCDustGeom,
    softGeomRef: refs.moonCDustWideGeom,
    corePositions: assets.moonCTrailPositions,
    softPositions: assets.moonCTrailWidePositions,
    readyRef: refs.moonCTrailReady,
  })
  updateTrailFromObject({
    sourceRef: refs.designMoonA,
    parentRef: refs.planetEGroup,
    coreGeomRef: refs.designMoonATrailGeom,
    softGeomRef: refs.designMoonATrailWideGeom,
    corePositions: assets.designMoonATrailPositions,
    softPositions: assets.designMoonATrailWidePositions,
    readyRef: refs.designMoonATrailReady,
  })
  updateTrailFromObject({
    sourceRef: refs.designMoonB,
    parentRef: refs.planetEGroup,
    coreGeomRef: refs.designMoonBTrailGeom,
    softGeomRef: refs.designMoonBTrailWideGeom,
    corePositions: assets.designMoonBTrailPositions,
    softPositions: assets.designMoonBTrailWidePositions,
    readyRef: refs.designMoonBTrailReady,
  })
}
