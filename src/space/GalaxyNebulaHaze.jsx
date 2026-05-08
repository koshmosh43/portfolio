import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import '../materials/nebulaHazeMaterial'

/**
 * Far haze: keep renderOrder below Stars (58+) and CentralGalaxy (55–57) so the starfield sits
 * “in front” of nebula; depthTest off avoids false rejects from camera-locked background quads.
 */
const C = {
  dustVoid: new THREE.Color(0.001, 0.0012, 0.015),
  dustCyan: new THREE.Color(0.002, 0.011, 0.026),
  dustPink: new THREE.Color(0.01, 0.004, 0.013),
  dustBlue: new THREE.Color(0.002, 0.008, 0.026),
  dustTeal: new THREE.Color(0.002, 0.013, 0.021),
  dustRose: new THREE.Color(0.012, 0.004, 0.011),

  /* Matched to CosmicSceneBackground gradient — cooler, less poster chroma. */
  bgA: new THREE.Color(0.06, 0.08, 0.16),
  bgB: new THREE.Color(0.11, 0.13, 0.24),

  cyanA: new THREE.Color(0.09, 0.36, 0.58),
  cyanB: new THREE.Color(0.16, 0.5, 0.68),
  cyanHot: new THREE.Color(0.48, 0.72, 0.86),

  pinkA: new THREE.Color(0.32, 0.16, 0.36),
  pinkB: new THREE.Color(0.44, 0.26, 0.44),
  pinkHot: new THREE.Color(0.62, 0.52, 0.72),

  blueA: new THREE.Color(0.12, 0.3, 0.62),
  blueB: new THREE.Color(0.18, 0.42, 0.74),
  blueHot: new THREE.Color(0.42, 0.62, 0.88),

  tealA: new THREE.Color(0.1, 0.42, 0.52),
  tealB: new THREE.Color(0.17, 0.56, 0.66),
  tealHot: new THREE.Color(0.52, 0.76, 0.82),

  roseA: new THREE.Color(0.42, 0.2, 0.34),
  roseB: new THREE.Color(0.54, 0.28, 0.44),
  roseHot: new THREE.Color(0.7, 0.58, 0.7),
}

/** Layer gain — slightly higher on far washes so volumetric depth reads on the sky sphere. */
const LAYER_ALPHA = {
  bg: 0.68,
  bgDeep: 0.52,
  cyan: 0.26,
  pink: 0.19,
  blue: 0.26,
  teal: 0.17,
  rose: 0.15,
}

const LAYERS = Object.freeze([
  {
    key: 'bg',
    material: 'bg',
    z: -10.2,
    renderOrder: 54.25,
    scaleMul: 1.0,
    phase: 0.55,
    blob: [0.05, -0.04],
    iBase: 0.58,
    iAmp: 0.045,
    colors: { A: C.bgA, B: C.bgB, dust: C.dustVoid },
    blobRadius: 0.84,
    patternScale: 1.12,
  },
  {
    key: 'bgDeep',
    material: 'bg',
    z: -10.35,
    renderOrder: 54.15,
    scaleMul: 1.02,
    phase: 2.15,
    blob: [-0.08, 0.06],
    iBase: 0.48,
    iAmp: 0.04,
    colors: { A: C.blueA, B: C.pinkA, dust: C.dustVoid },
    blobRadius: 0.92,
    patternScale: 1.16,
    rot: { z: [-0.018, 0.021, 1.1], x: [0.009, 0.018, 2.4] },
  },
  {
    key: 'cyan',
    material: 'main',
    z: -10.0,
    renderOrder: 50,
    scaleMul: 1.05,
    phase: 0.3,
    blob: [-0.18, 0.12],
    iBase: 0.48,
    iAmp: 0.006,
    colors: { A: C.cyanA, B: C.cyanB, hot: C.cyanHot, dust: C.dustCyan },
    blobRadius: 0.74,
    patternScale: 1.22,
    rot: { z: [0.035, 0.038, 0], x: [0.012, 0.026, 0.7] },
  },
  {
    key: 'pink',
    material: 'main',
    z: -10.4,
    renderOrder: 50.5,
    scaleMul: 1.07,
    phase: 2.9,
    blob: [0.22, -0.1],
    iBase: 0.4,
    iAmp: 0.032,
    colors: { A: C.pinkA, B: C.pinkB, hot: C.pinkHot, dust: C.dustPink },
    blobRadius: 0.74,
    patternScale: 1.24,
    rot: { z: [-0.03, 0.03, 1.4], x: [0.011, 0.02, 2.1] },
  },
  {
    key: 'blue',
    material: 'main',
    z: -10.8,
    renderOrder: 51,
    scaleMul: 1.1,
    phase: 5.15,
    blob: [-0.14, 0.06],
    iBase: 0.46,
    iAmp: 0.03,
    colors: { A: C.blueA, B: C.blueB, hot: C.blueHot, dust: C.dustBlue },
    blobRadius: 0.72,
    patternScale: 1.26,
    rot: { z: [0.028, 0.027, 2.4], x: [-0.01, 0.021, 0.35] },
  },
  {
    key: 'teal',
    material: 'main',
    z: -10.15,
    renderOrder: 51.5,
    scaleMul: 1.11,
    phase: 4.05,
    blob: [-0.2, -0.08],
    iBase: 0.34,
    iAmp: 0.026,
    colors: { A: C.tealA, B: C.tealB, hot: C.tealHot, dust: C.dustTeal },
    blobRadius: 0.7,
    patternScale: 1.28,
    rot: { z: [-0.026, 0.029, 0.8], x: [0.014, 0.023, 1.9] },
  },
  {
    key: 'rose',
    material: 'main',
    z: -10.55,
    renderOrder: 52,
    scaleMul: 1.13,
    phase: 6.8,
    blob: [0.16, -0.14],
    iBase: 0.3,
    iAmp: 0.022,
    colors: { A: C.roseA, B: C.roseB, hot: C.roseHot, dust: C.dustRose },
    blobRadius: 0.68,
    patternScale: 1.3,
    rot: { z: [0.024, 0.025, 3.2], x: [-0.012, 0.019, 0.2] },
  },
])

export function GalaxyNebulaHaze() {
  const { camera } = useThree()
  const rootRef = useRef()
  const planeRefs = useRef({})
  const materialRefs = useRef({})
  const baseQuat = useMemo(() => new THREE.Quaternion(), [])

  const setPlaneRef = (key) => (el) => {
    planeRefs.current[key] = el
  }
  const setMaterialRef = (key) => (el) => {
    materialRefs.current[key] = el
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (rootRef.current) {
      camera.getWorldQuaternion(baseQuat)
      rootRef.current.quaternion.copy(baseQuat)
      rootRef.current.position.copy(camera.position)
    }

    const tanHalf = Math.tan((camera.fov * Math.PI) / 180 / 2)
    const overscan = 1.72

    const globalPulse = 0.88 + 0.035 * Math.sin(t * 0.095)

    LAYERS.forEach(({ key, scaleMul, rot, phase, blob, iBase, iAmp, z }) => {
      const dist = Math.abs(z)
      const h = 2 * tanHalf * dist
      const fullW = h * camera.aspect * overscan
      const fullH = h * overscan

      const plane = planeRefs.current[key]
      if (plane) {
        plane.scale.set(fullW * scaleMul, fullH * scaleMul, 1)
        if (rot) {
          const [[zAmp, zSpeed, zPhase], [xAmp, xSpeed, xPhase]] = [rot.z, rot.x]
          plane.rotation.z = Math.sin(t * zSpeed + zPhase) * zAmp
          plane.rotation.x = Math.sin(t * xSpeed + xPhase) * xAmp
        }
      }

      const mat = materialRefs.current[key]
      if (!mat) return
      mat.uTime = t
      mat.uPhase = phase
      const blobUv = mat.uniforms?.uBlob?.value
      if (blobUv?.set) {
        blobUv.set(
          blob[0] + Math.sin(t * 0.047 + phase * 1.7) * 0.022,
          blob[1] + Math.cos(t * 0.041 + phase * 1.3) * 0.018,
        )
      }
      mat.uIntensity = (iBase + Math.sin(t * 0.118 + phase) * iAmp) * globalPulse
    })
  })

  const commonMatProps = {
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  }

  return (
    <group ref={rootRef}>
      {LAYERS.map(({ key, material, z, renderOrder, colors, blobRadius, patternScale }) => (
        <mesh
          key={key}
          ref={setPlaneRef(key)}
          position={[0, 0, z]}
          renderOrder={renderOrder}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1, 1, 1]} />
          {material === 'bg' ? (
            <nebulaHazeBgMaterial
              ref={setMaterialRef(key)}
              {...commonMatProps}
              blending={THREE.NormalBlending}
              uAlpha={LAYER_ALPHA[key]}
              uColorA={colors.A}
              uColorB={colors.B}
              uDustColor={colors.dust}
              uBlobRadius={blobRadius}
              uPatternScale={patternScale}
            />
          ) : (
            <nebulaHazeMaterial
              ref={setMaterialRef(key)}
              {...commonMatProps}
              blending={THREE.NormalBlending}
              uAlpha={LAYER_ALPHA[key]}
              uColorA={colors.A}
              uColorB={colors.B}
              uColorHot={colors.hot}
              uDustColor={colors.dust}
              uBlobRadius={blobRadius}
              uPatternScale={patternScale}
            />
          )}
        </mesh>
      ))}
    </group>
  )
}
