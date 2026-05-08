import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildSphereShellPoints } from '../geometry/sphereShellPoints'
import { createStarSpriteTexture } from '../textures/createStarSpriteTexture'

const DUST_COUNT = 900

/**
 * Fine interstellar dust + rare bright grains — reads as depth in the galaxy.
 */
export function CosmicDustField() {
  const group = useRef()
  const matA = useRef()
  const matB = useRef()
  const tex = useMemo(() => createStarSpriteTexture(), [])

  const positions = useMemo(
    () => buildSphereShellPoints(DUST_COUNT, 11, 42, 5, 28),
    [],
  )

  const positionsB = useMemo(
    () => buildSphereShellPoints(DUST_COUNT, 14, 46, 7, 30),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) {
      group.current.rotation.z = t * 0.011
      group.current.rotation.y = Math.sin(t * 0.09) * 0.04
    }
    if (matA.current) {
      matA.current.opacity = 0.38 + Math.sin(t * 1.1) * 0.06
      matA.current.size = 0.028 + Math.sin(t * 0.85) * 0.004
    }
    if (matB.current) {
      matB.current.opacity = 0.52 + Math.sin(t * 1.45 + 0.7) * 0.1
    }
  })

  const spriteBase = {
    map: tex,
    alphaMap: tex,
    transparent: true,
    sizeAttenuation: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }

  return (
    <group ref={group} renderOrder={4}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={DUST_COUNT} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          ref={matA}
          {...spriteBase}
          color="#b8d4ff"
          size={0.03}
          opacity={0.4}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={DUST_COUNT}
            array={positionsB}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={matB}
          {...spriteBase}
          color="#ffd6f0"
          size={0.042}
          opacity={0.48}
        />
      </points>
    </group>
  )
}
