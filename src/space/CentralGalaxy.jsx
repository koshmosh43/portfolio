import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import '../materials/spiralGalaxyBackdropMaterial'

function createCoreGlowTexture() {
  const size = 384
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const c = size * 0.5
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.16, 'rgba(255,246,226,0.95)')
  g.addColorStop(0.38, 'rgba(255,199,240,0.55)')
  g.addColorStop(0.72, 'rgba(150,98,255,0.18)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

/** Idle hero camera — same defaults as SpaceScene / SceneDirector */
const IDLE_CAMERA_POS = new THREE.Vector3(0, 0, 4)
const IDLE_LOOK_AT = new THREE.Vector3(0, 0, -2)
const GALAXY_FORWARD = new THREE.Vector3().subVectors(IDLE_LOOK_AT, IDLE_CAMERA_POS).normalize()
const GALAXY_WORLD_POS = new THREE.Vector3().copy(IDLE_CAMERA_POS).addScaledVector(GALAXY_FORWARD, 10.8)
const _idleCam = new THREE.PerspectiveCamera()
_idleCam.position.copy(IDLE_CAMERA_POS)
_idleCam.lookAt(IDLE_LOOK_AT)
const GALAXY_WORLD_QUAT = _idleCam.quaternion.clone()

const scratchEuler = new THREE.Euler()

/**
 * Hero galaxy: fixed world anchor (does not follow camera to planets).
 * GSAP macro motion + disk spins + shader time — tuned for a lively hero read.
 */
export function CentralGalaxy() {
  const rootRef = useRef()
  const diskAMeshRef = useRef()
  const diskBMeshRef = useRef()
  const diskARef = useRef()
  const diskBRef = useRef()
  const coreRef = useRef()
  const anim = useRef({
    pulse: 1,
    intensityA: 1.14,
    intensityB: 0.9,
    roll: 0,
    tilt: 0,
    depth: 0,
    spinBoostA: 1,
    spinBoostB: 1,
    burst: 0,
    flare: 0,
  })
  const coreTex = useMemo(() => createCoreGlowTexture(), [])

  useLayoutEffect(() => {
    const s = anim.current
    const macro = gsap
      .timeline({ repeat: -1, yoyo: true })
      .to(s, {
        duration: 10,
        pulse: 1.06,
        intensityA: 1.16,
        intensityB: 0.95,
        roll: 0.045,
        tilt: 0.022,
        depth: 0.12,
        ease: 'sine.inOut',
      })
      .to(s, {
        duration: 6.5,
        pulse: 0.96,
        intensityA: 1.05,
        intensityB: 0.86,
        roll: -0.032,
        tilt: -0.015,
        depth: -0.09,
        ease: 'sine.inOut',
      })

    const boost = gsap
      .timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } })
      .to(s, { duration: 6.5, spinBoostA: 1.08, spinBoostB: 0.94 })
      .to(s, { duration: 6.2, spinBoostA: 0.96, spinBoostB: 1.08 })
      .to(s, { duration: 7, spinBoostA: 1.03, spinBoostB: 1.0 })

    const burst = gsap
      .timeline({ repeat: -1, repeatDelay: 15, defaults: { ease: 'sine.inOut' } })
      .to(s, { duration: 3.2, burst: 1, flare: 1 })
      .to(s, { duration: 4.2, burst: 0, flare: 0 })

    /** R3F often attaches mesh refs after this effect runs — defer so GSAP spins always start */
    let spinA
    let spinB
    const startDiskSpins = () => {
      const a = diskAMeshRef.current
      const b = diskBMeshRef.current
      if (a)
        spinA = gsap.to(a.rotation, { z: `+=${Math.PI * 2}`, duration: 52, repeat: -1, ease: 'none' })
      if (b)
        spinB = gsap.to(b.rotation, { z: `-=${Math.PI * 2}`, duration: 68, repeat: -1, ease: 'none' })
    }
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(startDiskSpins)
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      macro.kill()
      boost.kill()
      burst.kill()
      spinA?.kill()
      spinB?.kill()
    }
  }, [])

  useLayoutEffect(() => () => coreTex.dispose(), [coreTex])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const state = anim.current

    if (rootRef.current) {
      rootRef.current.position.copy(GALAXY_WORLD_POS).addScaledVector(GALAXY_FORWARD, state.depth * 0.04)
      scratchEuler.setFromQuaternion(GALAXY_WORLD_QUAT)
      scratchEuler.z = state.roll + Math.sin(t * 0.28) * 0.014
      scratchEuler.x = state.tilt + Math.cos(t * 0.22 + 0.8) * 0.011
      rootRef.current.setRotationFromEuler(scratchEuler)
    }

    if (diskARef.current) {
      const burstSpin = 1 + state.burst * 0.11
      diskARef.current.uTime = t * (0.72 * state.spinBoostA * burstSpin)
      diskARef.current.uIntensity = state.intensityA * (1 + state.flare * 0.14)
      diskARef.current.uBlob.set(0.04 + Math.sin(t * 0.08) * 0.012, -0.018 + Math.cos(t * 0.094) * 0.012)
    }
    if (diskBRef.current) {
      const burstSpin = 1 + state.burst * 0.095
      diskBRef.current.uTime = t * (0.66 * state.spinBoostB * burstSpin) + 4.2
      diskBRef.current.uIntensity = state.intensityB * (1 + state.flare * 0.12)
      diskBRef.current.uBlob.set(-0.03 + Math.sin(t * 0.076 + 1.3) * 0.01, 0.024 + Math.cos(t * 0.088 + 0.6) * 0.01)
    }
    if (coreRef.current) {
      const s = state.pulse * (1 + Math.sin(t * 0.11) * 0.012) * (1 + state.flare * 0.08)
      coreRef.current.scale.setScalar(s)
      coreRef.current.material.opacity = 0.8 + Math.sin(t * 0.2) * 0.042 + state.flare * 0.08
    }
  })

  return (
    <group ref={rootRef} renderOrder={55}>
      <mesh ref={diskAMeshRef} position={[0, 0, 0]} rotation={[0, 0, 0.24]} frustumCulled={false} renderOrder={56}>
        <planeGeometry args={[14.6, 9.2]} />
        <spiralGalaxyBackdropMaterial
          ref={diskARef}
          transparent
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
          uPhase={1.4}
          uSquash={0.76}
          uEllipse={new THREE.Vector2(1.34, 0.88)}
          uArmCount={2}
          uTwist={12.8}
          uArmSharp={1.45}
          uColorCore={new THREE.Color(1.0, 0.95, 0.9)}
          uColorArm={new THREE.Color(0.2, 0.07, 0.34)}
          uColorRim={new THREE.Color(0.46, 0.68, 1.0)}
          uIntensity={1.14}
        />
      </mesh>

      <mesh ref={diskBMeshRef} position={[0, 0, -0.02]} rotation={[0, 0, -0.11]} frustumCulled={false} renderOrder={57}>
        <planeGeometry args={[12.8, 7.8]} />
        <spiralGalaxyBackdropMaterial
          ref={diskBRef}
          transparent
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
          uPhase={4.7}
          uSquash={0.7}
          uEllipse={new THREE.Vector2(1.5, 0.82)}
          uArmCount={3}
          uTwist={14.5}
          uArmSharp={1.62}
          uColorCore={new THREE.Color(1.0, 0.9, 0.86)}
          uColorArm={new THREE.Color(0.42, 0.09, 0.35)}
          uColorRim={new THREE.Color(0.62, 0.42, 1.0)}
          uIntensity={0.9}
        />
      </mesh>

      <sprite ref={coreRef} scale={[3.6, 3.6, 1]} position={[0, 0, 0.01]} renderOrder={58}>
        <spriteMaterial
          map={coreTex}
          color="#fff5f0"
          transparent
          opacity={0.86}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  )
}
