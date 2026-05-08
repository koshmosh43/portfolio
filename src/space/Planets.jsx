import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { DEFAULT_SPACE_LAYOUT } from './responsiveSpaceLayout'
import { buildPlanetAssets } from './planets/buildPlanetAssets'
import {
  DEFAULT_PROCEDURAL_TEX,
  PLANET_D_RING_SPIN_DEG_MAX,
  PLANET_D_RING_SPIN_DEG_MIN,
  PLANET_TRANSPARENT_MIN_RENDER_ORDER,
} from './planets/planetConstants'
import { PlanetArVr } from './planets/PlanetArVr'
import { PlanetFinTech } from './planets/PlanetFinTech'
import { PlanetGames } from './planets/PlanetGames'
import { PlanetPlayableAds } from './planets/PlanetPlayableAds'
import { PlanetSaas } from './planets/PlanetSaas'
import { createPlanetFrameDefs, runPlanetsFrame } from './planets/planetsFrame'
import { usePlanetRefs } from './planets/usePlanetRefs'

export function Planets({
  onPlanetSelect,
  activePlanetId,
  proceduralTex = DEFAULT_PROCEDURAL_TEX,
  layout = DEFAULT_SPACE_LAYOUT,
}) {
  const { gl } = useThree()
  const cursorModeRef = useRef('auto')
  const onPlanetPointerOver = () => {
    if (cursorModeRef.current !== 'pointer') {
      gl.domElement.style.cursor = 'pointer'
      cursorModeRef.current = 'pointer'
    }
  }
  const onPlanetPointerOut = () => {
    if (cursorModeRef.current !== 'auto') {
      gl.domElement.style.cursor = 'auto'
      cursorModeRef.current = 'auto'
    }
  }

  const { terrainW, terrainH, moonW, moonH } = proceduralTex
  const saasIdle = layout.planets.planetD.idle
  const sun = layout.sun.position
  const sunAzimuth = Math.atan2(sun[1] - saasIdle.y, sun[0] - saasIdle.x)
  const assets = useMemo(
    () => buildPlanetAssets({ terrainW, terrainH, moonW, moonH, sunAzimuth }),
    [terrainW, terrainH, moonW, moonH, sunAzimuth],
  )

  const refs = usePlanetRefs()
  const frameDefsRef = useRef(null)
  if (frameDefsRef.current === null) {
    frameDefsRef.current = createPlanetFrameDefs(refs)
  }
  const frameDefs = frameDefsRef.current

  const selectPlanet = (planetId, event) => {
    event.stopPropagation()
    if (!onPlanetSelect) return
    onPlanetSelect(planetId)
  }

  useFrame((state) => {
    runPlanetsFrame({
      clock: state.clock,
      refs,
      defs: frameDefs,
      layout,
      activePlanetId,
      assets,
    })
  })

  useLayoutEffect(() => {
    const g = refs.root.current
    if (!g) return
    g.traverse((obj) => {
      if (obj.isPoints || obj.isSprite) {
        obj.raycast = () => null
      }
      if (!obj.isMesh && !obj.isPoints && !obj.isSprite) return
      const mat = obj.material
      const mats = Array.isArray(mat) ? mat : [mat]
      const anyTransparent = mats.some((m) => m && m.transparent)
      if (anyTransparent) {
        obj.renderOrder = Math.max(obj.renderOrder, PLANET_TRANSPARENT_MIN_RENDER_ORDER)
      }
    })
  }, [refs])

  useLayoutEffect(() => {
    const ring = refs.planetDSatelliteRing.current
    if (!ring) return undefined
    const spinMin = THREE.MathUtils.degToRad(PLANET_D_RING_SPIN_DEG_MIN)
    const spinMax = THREE.MathUtils.degToRad(PLANET_D_RING_SPIN_DEG_MAX)
    const motion = { tiltX: 0, tiltZ: 0, bob: 1, ringSpin: spinMin }
    ring.userData.saasMotion = motion
    ring.scale.set(1, 1, 0.48)
    gsap.to(motion, {
      ringSpin: spinMax,
      duration: 6.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
    gsap.to(motion, {
      tiltX: 0.26,
      duration: 3.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
    gsap.to(motion, {
      tiltZ: -0.28,
      duration: 5.1,
      yoyo: true,
      repeat: -1,
      ease: 'power2.inOut',
      delay: 0.25,
    })
    gsap.to(motion, {
      bob: 1.07,
      duration: 1.75,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
    gsap.to(ring.scale, {
      x: 1.08,
      y: 1.08,
      z: 0.54,
      duration: 4.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
    return () => {
      gsap.killTweensOf(motion)
      gsap.killTweensOf(ring.scale)
      ring.scale.set(1, 1, 0.48)
    }
  }, [refs])

  const planetProps = {
    layout,
    assets,
    refs,
    onSelectPlanet: selectPlanet,
    onPlanetPointerOver,
    onPlanetPointerOut,
  }

  return (
    <group ref={refs.root}>
      <PlanetFinTech {...planetProps} />
      <PlanetPlayableAds {...planetProps} />
      <PlanetSaas {...planetProps} />
      <PlanetArVr {...planetProps} />
      <PlanetGames {...planetProps} />
    </group>
  )
}
