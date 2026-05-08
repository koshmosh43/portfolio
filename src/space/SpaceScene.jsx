import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, lazy, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  recordSceneFirstWebGlFrame,
  recordSceneInteractiveSubtreeReady,
  recordScenePhase,
} from '../shared/lib/sceneTelemetry'
import { AdaptiveSceneQualityContext, useAdaptiveSceneQuality } from './adaptiveSceneQuality'
import { createResponsiveSpaceLayout } from './responsiveSpaceLayout'
import { ProceduralEnvironmentRoot } from './sceneChunks/ProceduralEnvironmentChunk'
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

    let effectAlive = true
    let idleId = 0
    let fallbackTimer = 0
    let started = false

    const clearTimers = () => {
      if (idleId) cancelIdleCallback(idleId)
      if (fallbackTimer) clearTimeout(fallbackTimer)
      idleId = 0
      fallbackTimer = 0
    }

    const start = () => {
      if (!effectAlive || started) return
      started = true
      clearTimers()
      setReady(true)
    }

    const onInteract = () => start()
    window.addEventListener('pointerdown', onInteract, { passive: true, once: true })
    window.addEventListener('touchstart', onInteract, { passive: true, once: true })
    window.addEventListener('keydown', onInteract, { passive: true, once: true })

    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(start, { timeout: 2_400 })
    }
    fallbackTimer = window.setTimeout(start, 3_200)

    return () => {
      effectAlive = false
      clearTimers()
    }
  }, [onSettled])
  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <SpacePostFxLazy onReady={onSettled} />
    </Suspense>
  )
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 0, 4)
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, -2)

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
    let rafB = 0
    rafA = requestAnimationFrame(() => {
      rafB = requestAnimationFrame(() => {
        if (fired.current) return
        fired.current = true
        onReady()
      })
    })
    return () => {
      if (rafA) cancelAnimationFrame(rafA)
      if (rafB) cancelAnimationFrame(rafB)
    }
  }, [onReady])
  return null
}

function SceneInteractiveReporter() {
  useEffect(() => {
    recordSceneInteractiveSubtreeReady()
  }, [])
  return null
}

function SceneDirector({ focus, cameraFov }) {
  const { camera } = useThree()
  const currentLookAt = useRef(DEFAULT_LOOK_AT.clone())

  useEffect(() => {
    camera.fov = cameraFov
    camera.updateProjectionMatrix()
  }, [camera, cameraFov])

  useFrame(() => {
    const targetPos = focus?.cameraPos ?? DEFAULT_CAMERA_POS
    const targetLookAt = focus?.lookAt ?? DEFAULT_LOOK_AT
    camera.position.lerp(targetPos, 0.045)
    currentLookAt.current.lerp(targetLookAt, 0.05)
    camera.lookAt(currentLookAt.current)
  })

  return null
}

function SpaceSceneImpl({
  activePlanetId,
  onPlanetSelect,
  welcomeVisibleCount = 0,
  onCanvasReady,
}) {
  const [lightingReady, setLightingReady] = useState(false)
  const [postFxSettled, setPostFxSettled] = useState(false)
  const canvasReadySent = useRef(false)

  useEffect(() => {
    recordScenePhase('spaceSceneTreeMounted')
  }, [])

  useEffect(() => {
    if (!lightingReady || !postFxSettled || canvasReadySent.current) return
    canvasReadySent.current = true
    onCanvasReady?.()
  }, [lightingReady, onCanvasReady, postFxSettled])

  const q = useAdaptiveSceneQuality()
  const { dpr, shadowMap, proceduralTex, viewport } = q
  const layout = useMemo(() => createResponsiveSpaceLayout(viewport), [viewport])

  const focus = useMemo(() => {
    const target = layout.focus[activePlanetId]
    if (!target) return null
    return {
      ...target,
      lookAt: new THREE.Vector3(...target.lookAt),
      cameraPos: new THREE.Vector3(...target.cameraPos),
      shipPos: new THREE.Vector3(...target.shipPos),
    }
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
          <SceneDirector focus={focus} cameraFov={layout.cameraFov} />
        </Suspense>
        <ambientLight intensity={0.004} />
        <hemisphereLight color="#243248" groundColor="#0a0c12" intensity={0.016} />
        {/* IBL + sun: not lazy — PBR reads scene.environment; delaying PMREM + key lights looked like lighting “ramping in”. */}
        <ProceduralEnvironmentRoot intensity={0.34} rotationY={2.35} />
        <SunCluster
          sunPosition={sunPosition}
          sunScale={layout.sun.scale}
          shadowMap={shadowMap}
          sunLightTarget={sunLightTarget}
        />
        <SignalLightingReady onReady={() => setLightingReady(true)} />
        <Suspense fallback={null}>
          <CosmicBackgroundLazy />
        </Suspense>
        {/* renderOrder: nebula ≤54.25, galaxy 55–58, sun emit 58.82, corona 59, core 59.45, stars 70–72, planet FX ≥85 */}
        <Suspense fallback={null}>
          <DeepSpaceDecorLazy />
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
          />
          <SceneInteractiveReporter />
        </Suspense>
        <DeferredEffectComposer onSettled={() => setPostFxSettled(true)} />
      </AdaptiveSceneQualityContext.Provider>
    </Canvas>
  )
}

export const SpaceScene = memo(SpaceSceneImpl)
