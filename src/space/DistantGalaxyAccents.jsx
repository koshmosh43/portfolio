import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import '../materials/spiralGalaxyBackdropMaterial'

/**
 * Volumetric read without meshes: a few huge spiral / edge-on discs behind the tableau.
 * Color orbit matches nebula palette (cyan / rose / deep blue) — reads as “other galaxies” in the void.
 */
const GALAXIES = [
  {
    key: 'gx-a',
    position: [-10.5, 5.8, -12.6],
    rotation: [0.14, 0.42, -0.18],
    plane: [34, 22],
    ellipse: new THREE.Vector2(1.15, 0.92),
    uSquash: 1,
    uArmCount: 2.35,
    uTwist: 11.2,
    uPhase: 1.7,
    uBlob: [0.06, -0.04],
    colorCore: new THREE.Color(0.98, 0.94, 1.0),
    colorArm: new THREE.Color(0.22, 0.09, 0.34),
    colorRim: new THREE.Color(0.12, 0.38, 0.92),
    iBase: 1.15,
    iAmp: 0.12,
    renderOrder: 131,
  },
  {
    key: 'gx-b',
    position: [11.2, -4.2, -13.0],
    rotation: [-0.12, -0.38, 0.1],
    plane: [20, 14],
    ellipse: new THREE.Vector2(1.35, 0.75),
    uSquash: 1,
    uArmCount: 2.05,
    uTwist: 9.6,
    uPhase: 4.9,
    uBlob: [-0.05, 0.07],
    colorCore: new THREE.Color(1.0, 0.88, 0.82),
    colorArm: new THREE.Color(0.42, 0.08, 0.22),
    colorRim: new THREE.Color(0.85, 0.32, 0.55),
    iBase: 1.05,
    iAmp: 0.11,
    renderOrder: 132,
  },
  {
    key: 'gx-edge',
    position: [2.4, 8.6, -13.4],
    rotation: [1.18, 0.22, 0.31],
    plane: [48, 9],
    ellipse: new THREE.Vector2(1.6, 1.0),
    uSquash: 0.14,
    uArmCount: 3.2,
    uTwist: 14.0,
    uPhase: 2.4,
    uBlob: [0, 0],
    colorCore: new THREE.Color(0.92, 0.95, 1.0),
    colorArm: new THREE.Color(0.08, 0.12, 0.28),
    colorRim: new THREE.Color(0.2, 0.55, 0.88),
    iBase: 0.82,
    iAmp: 0.09,
    renderOrder: 133,
  },
  {
    key: 'gx-dwarf',
    position: [-7.2, -5.5, -12.0],
    rotation: [0.08, -0.52, 0.04],
    plane: [16, 16],
    ellipse: new THREE.Vector2(1.0, 1.0),
    uSquash: 1,
    uArmCount: 1.85,
    uTwist: 8.2,
    uPhase: 6.1,
    uBlob: [0.02, 0.05],
    colorCore: new THREE.Color(0.85, 1.0, 0.95),
    colorArm: new THREE.Color(0.05, 0.2, 0.22),
    colorRim: new THREE.Color(0.15, 0.75, 0.72),
    iBase: 0.92,
    iAmp: 0.1,
    renderOrder: 130,
  },
]

export function DistantGalaxyAccents() {
  const root = useRef()
  const matRefs = useRef([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (root.current) {
      root.current.rotation.y = Math.sin(t * 0.025) * 0.024
      root.current.rotation.x = Math.sin(t * 0.018) * 0.01
      root.current.rotation.z = Math.cos(t * 0.021) * 0.008
    }

    const pulse = 0.96 + 0.04 * Math.sin(t * 0.088)
    for (let i = 0; i < GALAXIES.length; i += 1) {
      const m = matRefs.current[i]
      if (!m) continue
      const g = GALAXIES[i]
      m.uTime = t
      m.uIntensity = (g.iBase + Math.sin(t * 0.11 + g.uPhase) * g.iAmp) * pulse
      m.uBlob.set(g.uBlob[0] + Math.sin(t * 0.038 + g.uPhase) * 0.012, g.uBlob[1] + Math.cos(t * 0.033 + g.uPhase * 0.8) * 0.01)
    }
  })

  return (
    <group ref={root}>
      {GALAXIES.map((g, i) => (
        <mesh
          key={g.key}
          position={g.position}
          rotation={g.rotation}
          frustumCulled={false}
          renderOrder={g.renderOrder}
        >
          <planeGeometry args={g.plane} />
          <spiralGalaxyBackdropMaterial
            ref={(el) => {
              matRefs.current[i] = el
            }}
            transparent
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
            uPhase={g.uPhase}
            uSquash={g.uSquash}
            uEllipse={g.ellipse}
            uArmCount={g.uArmCount}
            uTwist={g.uTwist}
            uColorCore={g.colorCore}
            uColorArm={g.colorArm}
            uColorRim={g.colorRim}
            uIntensity={g.iBase}
          />
        </mesh>
      ))}
    </group>
  )
}
