import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, lazy, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  recordSceneFirstWebGlFrame,
  recordSceneInteractiveSubtreeReady,
  recordScenePhase,
} from '../shared/lib/sceneTelemetry'
import { AdaptiveSceneQualityContext, useAdaptiveSceneQuality } from './adaptiveSceneQuality'
import { createResponsiveSpaceLayout } from './responsiveSpaceLayout'
import { ProceduralEnvironmentRoot } from './sceneChunks/ProceduralEnvironmentChunk'
import { HeroShipWake } from './HeroShipWake'
import { HERO_CAM_CHASE_DELTA, heroShipCameraBridge } from './heroShipCameraBridge'
import { SunHitPreferFirst } from './SunHitPreferFirst'
import { SunCluster } from './sceneChunks/BurningSunChunk'

const PlanetsLazy = lazy(() => import('./Planets').then((m) => ({ default: m.Planets })))
const SpaceshipLazy = lazy(() => import('./Spaceship').then((m) => ({ default: m.Spaceship })))
const SpacePostFxLazy = lazy(() => import('./SpacePostFx').then((m) => ({ default: m.SpacePostFx })))

const CosmicBackgroundLazy = lazy(() =>
  import('./sceneChunks/CosmicBackgroundChunk').then((m) => ({ default: m.CosmicBackgroundRoot })),
)
const DeepSpaceDecorLazy = lazy(() =>
  import('./sceneChunks/DeepSpaceDecorChunk').then((m) => ({ default: m.DeepSpaceDecorRoot })),
)

/**
 * Post-FX (Bloom/Vignette) pulls in @react-three/postprocessing + postprocessing (~hundreds of KB parsed).
 * Skip on save-data / reduced motion. Otherwise: first user gesture, or a short idle/timer fallback so
 * bloom appears soon — long delays made the scene look “unlit” until FX kicked in.
 */
function DeferredEffectComposer({ onSettled }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSettled?.()
      return undefined
    }
    if (navigator.connection?.saveData) {
      onSettled?.()
      return undefined
    }

    /** Bloom must not block curtain/canvasReady — mount almost immediately. */
    onSettled?.()
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [onSettled])
  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <SpacePostFxLazy />
    </Suspense>
  )
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 0, 4)
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, -2)

/** Fallback hero pose before the ship bridge samples (first frame / focus mode). */
const IDLE_HERO_PARK_CAM_OFFSET = new THREE.Vector3(0.78, -0.14, -0.32)
const IDLE_HERO_PARK_LOOK_OFFSET = new THREE.Vector3(0.28, -0.04, 0)

/** Fires once after lighting/env had time to apply; avoids revealing intro on dark first paint. */
function SignalLightingReady({ onReady }) {
  const firstFrameMarked = useRef(false)
  const fired = useRef(false)
  useFrame(() => {
    if (firstFrameMarked.current) return
    firstFrameMarked.current = true
    recordSceneFirstWebGlFrame()
  })
  useLayoutEffect(() => {
    if (!onReady || fired.current) return undefined
    let rafA = 0
    rafA = requestAnimationFrame(() => {
      if (fired.current) return
      fired.current = true
      onReady()
    })
    return () => {
      if (rafA) cancelAnimationFrame(rafA)
    }
  }, [onReady])
  return null
}

/** Chunk resolved inside Suspense; `telemetry` = planets/ship subtree (sceneTelemetry). */
function LazySuspensePing({ bit, onPing, telemetry }) {
  useLayoutEffect(() => {
    if (telemetry) recordSceneInteractiveSubtreeReady()
    onPing(bit)
  }, [bit, onPing, telemetry])
  return null
}

function smoothstep(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

function SceneDirector({ focus, cameraFov, curtainDismissed, prefersReducedMotion }) {
  const { camera } = useThree()
  const currentLookAt = useRef(DEFAULT_LOOK_AT.clone())
  const everUnderCurtain = useRef(false)
  const introConsumed = useRef(false)
  const scratchChase = useRef(new THREE.Vector3())
  const scratchLook = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.fov = cameraFov
    camera.updateProjectionMatrix()
  }, [camera, cameraFov])

  /** Runs after Spaceship (priority) so `heroShipCameraBridge` is current for this frame. */
  useFrame(() => {
    const targetPos = focus?.cameraPos ?? DEFAULT_CAMERA_POS
    const targetLookAt = focus?.lookAt ?? DEFAULT_LOOK_AT

    if (focus) {
      introConsumed.current = true
      camera.position.lerp(targetPos, 0.045)
      currentLookAt.current.lerp(targetLookAt, 0.05)
      camera.lookAt(currentLookAt.current)
      return
    }

    const applyHeroChase = (settle01) => {
      const fe = heroShipCameraBridge.heroFlightEase01
      const chase = scratchChase.current
      chase.copy(heroShipCameraBridge.shipWorld).add(HERO_CAM_CHASE_DELTA)
      chase.y += Math.sin(Math.PI * THREE.MathUtils.clamp(fe, 0, 1)) * 0.09 * (1 - settle01)

      const cine = 1 - settle01
      const arc = cine * (0.88 + 0.12 * Math.sin(fe * Math.PI))
      chase.z += arc * 1.92
      chase.x += arc * 0.78

      camera.position.lerpVectors(chase, DEFAULT_CAMERA_POS, settle01)

      const lk = scratchLook.current
      lk.copy(heroShipCameraBridge.shipWorld).lerp(DEFAULT_LOOK_AT, 0.5)
      lk.x += cine * 0.55 * (1 - 0.4 * fe)
      lk.y += cine * 0.09 * Math.sin(fe * Math.PI)
      currentLookAt.current.lerpVectors(lk, DEFAULT_LOOK_AT, settle01)
      camera.lookAt(currentLookAt.current)
    }

    if (!curtainDismissed) {
      everUnderCurtain.current = true
      if (heroShipCameraBridge.valid && !prefersReducedMotion) {
        applyHeroChase(0)
      } else {
        camera.position.copy(DEFAULT_CAMERA_POS.clone().add(IDLE_HERO_PARK_CAM_OFFSET))
        currentLookAt.current.copy(DEFAULT_LOOK_AT.clone().add(IDLE_HERO_PARK_LOOK_OFFSET))
        camera.lookAt(currentLookAt.current)
      }
      return
    }

    const skipIntro =
      prefersReducedMotion || introConsumed.current || (!everUnderCurtain.current && curtainDismissed)

    if (skipIntro) {
      if (!everUnderCurtain.current) {
        introConsumed.current = true
        heroShipCameraBridge.skipHeroCinematicOnce = true
      }
      camera.position.lerp(targetPos, 0.045)
      currentLookAt.current.lerp(targetLookAt, 0.05)
      camera.lookAt(currentLookAt.current)
      return
    }

    if (!heroShipCameraBridge.valid) {
      camera.position.lerp(targetPos, 0.06)
      currentLookAt.current.lerp(targetLookAt, 0.07)
      camera.lookAt(currentLookAt.current)
      return
    }

    const fe = heroShipCameraBridge.heroFlightEase01
    const settle01 = smoothstep(THREE.MathUtils.clamp((fe - 0.52) / 0.48, 0, 1))
    applyHeroChase(settle01)

    if (fe >= 0.997) introConsumed.current = true
  }, -10)

  return null
}

function SpaceSceneImpl({
  activePlanetId,
  onPlanetSelect,
  welcomeVisibleCount = 0,
  onCanvasReady,
  onSunTap,
  sunTapEnabled,
  curtainDismissed = false,
  prefersReducedMotion = false,
}) {
  const [lightingReady, setLightingReady] = useState(false)
  const [postFxSettled, setPostFxSettled] = useState(false)
  const [lazyMask, setLazyMask] = useState(0)
  const canvasReadySent = useRef(false)
  const pingLazy = useCallback((b) => setLazyMask((m) => m | b), [])
  const lazySubtreeComplete = lazyMask === (1 | 2 | 4)

  useEffect(() => {
    recordScenePhase('spaceSceneTreeMounted')
  }, [])

  useEffect(() => {
    if (!lightingReady || !postFxSettled || !lazySubtreeComplete || canvasReadySent.current) return
    let raf = 0
    raf = requestAnimationFrame(() => {
      if (canvasReadySent.current) return
      canvasReadySent.current = true
      onCanvasReady?.()
    })
    return () => cancelAnimationFrame(raf)
  }, [lazySubtreeComplete, lightingReady, onCanvasReady, postFxSettled])

  const q = useAdaptiveSceneQuality()
  const { dpr, shadowMap, proceduralTex, viewport } = q
  const layout = useMemo(() => createResponsiveSpaceLayout(viewport), [viewport])

  const focus = useMemo(() => {
    const target = layout.focus[activePlanetId]
    if (!target) return null
    const next = {
      ...target,
      planetId: activePlanetId,
      lookAt: new THREE.Vector3(...target.lookAt),
      cameraPos: new THREE.Vector3(...target.cameraPos),
      shipPos: new THREE.Vector3(...target.shipPos),
    }
    if (target.shipWaypoint) {
      next.shipWaypoint = new THREE.Vector3(...target.shipWaypoint)
    }
    return next
  }, [activePlanetId, layout])

  const sunPosition = useMemo(() => new THREE.Vector3(...layout.sun.position), [layout])
  const sunLightTarget = useMemo(() => new THREE.Vector3(...layout.sun.target), [layout])

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={dpr}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        alpha: false,
      }}
      camera={{ position: [0, 0, 4], fov: layout.cameraFov }}
      onCreated={({ gl }) => {
        // Transparent passes (corona, galaxy) sort correctly with EffectComposer; false caused
        // inconsistent ordering when the composer started and could hide additive sun glow.
        gl.sortObjects = true
      }}
    >
      <AdaptiveSceneQualityContext.Provider value={q}>
        <Suspense fallback={null}>
          <SceneDirector
            focus={focus}
            cameraFov={layout.cameraFov}
            curtainDismissed={curtainDismissed}
            prefersReducedMotion={prefersReducedMotion}
          />
        </Suspense>
        <ambientLight intensity={0.004} />
        <hemisphereLight color="#243248" groundColor="#0a0c12" intensity={0.016} />
        {/* IBL + sun: not lazy — PBR reads scene.environment; delaying PMREM + key lights looked like lighting “ramping in”. */}
        <ProceduralEnvironmentRoot intensity={0.34} rotationY={2.35} />
        <SunHitPreferFirst enabled={sunTapEnabled} />
        <SunCluster
          sunPosition={sunPosition}
          sunScale={layout.sun.scale}
          shadowMap={shadowMap}
          sunLightTarget={sunLightTarget}
          onSunInteract={onSunTap}
          sunInteractive={sunTapEnabled}
        />
        <SignalLightingReady onReady={() => setLightingReady(true)} />
        <Suspense fallback={null}>
          <CosmicBackgroundLazy />
          <LazySuspensePing bit={1} onPing={pingLazy} />
        </Suspense>
        {/* renderOrder: nebula ≤54.25, galaxy 55–58, sun core 59.45 */}
        <Suspense fallback={null}>
          <DeepSpaceDecorLazy />
          <LazySuspensePing bit={2} onPing={pingLazy} />
        </Suspense>
        <Suspense fallback={null}>
          <PlanetsLazy
            onPlanetSelect={onPlanetSelect}
            activePlanetId={activePlanetId}
            proceduralTex={proceduralTex}
            layout={layout}
          />
          <SpaceshipLazy
            focus={focus}
            isFocused={Boolean(activePlanetId)}
            welcomeVisibleCount={welcomeVisibleCount}
            curtainDismissed={curtainDismissed}
            prefersReducedMotion={prefersReducedMotion}
          />
          <HeroShipWake />
          <LazySuspensePing bit={4} onPing={pingLazy} telemetry />
        </Suspense>
        <DeferredEffectComposer onSettled={() => setPostFxSettled(true)} />
      </AdaptiveSceneQualityContext.Provider>
    </Canvas>
  )
}

export const SpaceScene = memo(SpaceSceneImpl)
