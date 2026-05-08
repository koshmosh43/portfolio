import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import { createRng } from '../mathUtils'
import { SMOKE_PUFF_FS, SMOKE_PUFF_VS } from './smokeCloudShaders'

export function SmokeCloudCluster({
  position,
  scale = [1, 1, 1],
  tint = '#dff3ff',
  texture,
  seed = 1,
  puffCount = 18,
  alpha = 0.2,
  speed = 0.1,
}) {
  const groupRef = useRef()
  const matRef = useRef()
  const { geometry, tintUniform } = useMemo(() => {
    const rng = createRng(seed)
    const positions = new Float32Array(puffCount * 3)
    const aBaseScale = new Float32Array(puffCount)
    const aPhase = new Float32Array(puffCount)
    const aSpin = new Float32Array(puffCount)
    const aShear = new Float32Array(puffCount)
    const aLift = new Float32Array(puffCount)
    const aAlphaMul = new Float32Array(puffCount)
    for (let i = 0; i < puffCount; i += 1) {
      const j = i * 3
      positions[j] = (rng() - 0.5) * 0.82
      positions[j + 1] = (rng() - 0.5) * 0.38
      positions[j + 2] = (rng() - 0.5) * 0.52
      aBaseScale[i] = 0.18 + rng() * 0.34
      aPhase[i] = rng() * Math.PI * 2
      aSpin[i] = (rng() - 0.5) * 0.22
      aShear[i] = (rng() - 0.5) * 0.045
      aLift[i] = 0.008 + rng() * 0.026
      aAlphaMul[i] = 0.42 + rng() * 0.62
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aBaseScale', new THREE.BufferAttribute(aBaseScale, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1))
    geo.setAttribute('aSpin', new THREE.BufferAttribute(aSpin, 1))
    geo.setAttribute('aShear', new THREE.BufferAttribute(aShear, 1))
    geo.setAttribute('aLift', new THREE.BufferAttribute(aLift, 1))
    geo.setAttribute('aAlphaMul', new THREE.BufferAttribute(aAlphaMul, 1))
    return { geometry: geo, tintUniform: new THREE.Color(tint) }
  }, [puffCount, seed, tint])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uMap: { value: texture },
      uTint: { value: tintUniform },
      uAlpha: { value: alpha },
      uPixelRatio: { value: 1 },
    }),
    [alpha, speed, texture, tintUniform],
  )

  useFrame(({ clock, gl }) => {
    const t = clock.elapsedTime
    if (!groupRef.current) return
    groupRef.current.rotation.y += 0.0014 * speed
    groupRef.current.rotation.x = Math.sin(t * speed * 0.55 + seed) * 0.012
    groupRef.current.rotation.z = Math.sin(t * speed * 0.75 + seed) * 0.026
    const m = matRef.current
    if (m) {
      m.uniforms.uTime.value = t
      m.uniforms.uPixelRatio.value = gl.getPixelRatio()
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          vertexShader={SMOKE_PUFF_VS}
          fragmentShader={SMOKE_PUFF_FS}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest
          toneMapped={false}
        />
      </points>
    </group>
  )
}
