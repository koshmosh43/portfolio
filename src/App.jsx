import { lazy, Suspense, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GalaxyIntroCurtain } from './GalaxyIntroCurtain'
import { WelcomeHero } from './WelcomeHero'
import { usePortfolioFlow } from './features/portfolio/portfolioFlow'
import { useSceneFlow } from './features/spaceScene/sceneFlow'
import { portfolioProjects } from './shared/config/portfolioProjects'
import { readNetworkProfile } from './shared/lib/networkProfile'
import { trackSunEasterEgg } from './shared/lib/analytics'
import { HERO_CTA_MOTION_MS, SUN_JOKE_DISPLAY_MS, WELCOME_TOTAL_CHARS } from './welcomeConstants'
import './App.css'

const SpaceScene = lazy(() =>
  import('./space/SpaceScene').then((m) => ({
    default: m.SpaceScene,
  })),
)

const PortfolioShowcasePanel = lazy(() =>
  import('./PlanetShowcasePanel').then((m) => ({
    default: m.PlanetShowcasePanel,
  })),
)

function estimateShowcaseHydrationWeight(showcase) {
  if (!showcase?.projects?.length) return 0
  let score = 0
  for (const project of showcase.projects) {
    score += project?.videoUrl ? 1.15 : 0.35
    const shots = Array.isArray(project?.screenshots) ? project.screenshots.length : 0
    score += shots * 0.24
    if (shots >= 2 && shots <= 4) score += 0.5
  }
  return score
}

export default function App() {
  const [welcomeVisibleCount, setWelcomeVisibleCount] = useState(WELCOME_TOTAL_CHARS)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [ctaSunJoke, setCtaSunJoke] = useState(false)
  const [panelPlanetId, setPanelPlanetId] = useState(null)
  const [panelMediaPlanetId, setPanelMediaPlanetId] = useState(null)
  const sunJokeTimerRef = useRef(0)
  const panelMountTimerRef = useRef(0)
  const panelMediaTimerRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const portfolio = usePortfolioFlow({
    prefersReducedMotion,
    projectsByPlanet: portfolioProjects,
  })
  const scene = useSceneFlow()

  useEffect(() => {
    if (!scene.chunksWarmed) return undefined
    let effectAlive = true
    let idleId = 0
    let timeoutId = 0
    let started = false
    const canIdlePrefetch = !readNetworkProfile().isDataLite

    const clearTimers = () => {
      if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId)
      if (timeoutId) clearTimeout(timeoutId)
      idleId = 0
      timeoutId = 0
    }

    const load = () => {
      if (!effectAlive || started) return
      started = true
      clearTimers()
      void import('./PlanetShowcasePanel')
    }

    const scheduleLoad = () => {
      if (!effectAlive || started || !canIdlePrefetch) return
      clearTimers()
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(load, { timeout: 1800 })
      } else {
        timeoutId = window.setTimeout(load, 120)
      }
    }

    window.addEventListener('pointerdown', scheduleLoad, { passive: true, once: true })
    window.addEventListener('keydown', scheduleLoad, { once: true })
    if (canIdlePrefetch) {
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(load, { timeout: 12000 })
      } else {
        timeoutId = window.setTimeout(load, 4600)
      }
    }

    return () => {
      effectAlive = false
      window.removeEventListener('pointerdown', scheduleLoad)
      window.removeEventListener('keydown', scheduleLoad)
      clearTimers()
    }
  }, [scene.chunksWarmed])

  useEffect(() => {
    if (portfolio.curtainDismissed) return undefined
    const t = setTimeout(portfolio.onCurtainRevealComplete, 20000)
    return () => clearTimeout(t)
  }, [portfolio.curtainDismissed, portfolio.onCurtainRevealComplete])

  const onWelcomeVisibleCount = useCallback((value) => {
    setWelcomeVisibleCount(value)
  }, [])

  const onSunTap = useCallback(() => {
    if (!portfolio.heroCtaRevealed || portfolio.activePlanetId) return
    trackSunEasterEgg()
    if (sunJokeTimerRef.current) clearTimeout(sunJokeTimerRef.current)
    startTransition(() => {
      setCtaSunJoke(true)
    })
    sunJokeTimerRef.current = window.setTimeout(() => {
      sunJokeTimerRef.current = 0
      startTransition(() => {
        setCtaSunJoke(false)
      })
    }, SUN_JOKE_DISPLAY_MS)
  }, [portfolio.heroCtaRevealed, portfolio.activePlanetId])

  const sunTapEnabled = Boolean(
    portfolio.curtainDismissed && portfolio.heroCtaRevealed && !portfolio.activePlanetId,
  )
  const backToGalaxy = portfolio.onBackToGalaxy

  const activeShowcase = useMemo(
    () => (portfolio.activePlanetId ? portfolioProjects[portfolio.activePlanetId] ?? null : null),
    [portfolio.activePlanetId],
  )
  const panelHydrationWeight = useMemo(
    () => estimateShowcaseHydrationWeight(activeShowcase),
    [activeShowcase],
  )

  useEffect(() => {
    if (!portfolio.activePlanetId) return
    if (sunJokeTimerRef.current) {
      clearTimeout(sunJokeTimerRef.current)
      sunJokeTimerRef.current = 0
    }
    startTransition(() => {
      setCtaSunJoke(false)
    })
  }, [portfolio.activePlanetId])

  useEffect(
    () => () => {
      if (sunJokeTimerRef.current) clearTimeout(sunJokeTimerRef.current)
      if (panelMountTimerRef.current) clearTimeout(panelMountTimerRef.current)
      if (panelMediaTimerRef.current) clearTimeout(panelMediaTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (panelMountTimerRef.current) {
      clearTimeout(panelMountTimerRef.current)
      panelMountTimerRef.current = 0
    }
    if (panelMediaTimerRef.current) {
      clearTimeout(panelMediaTimerRef.current)
      panelMediaTimerRef.current = 0
    }
    if (!portfolio.activePlanetId) {
      setPanelPlanetId(null)
      setPanelMediaPlanetId(null)
      return
    }
    const shellDelayMs = prefersReducedMotion ? 0 : Math.round(620 + Math.min(420, panelHydrationWeight * 48))
    const mediaDelayMs = prefersReducedMotion ? 0 : shellDelayMs + Math.round(760 + Math.min(720, panelHydrationWeight * 120))
    setPanelMediaPlanetId(null)
    panelMountTimerRef.current = window.setTimeout(() => {
      panelMountTimerRef.current = 0
      setPanelPlanetId(portfolio.activePlanetId)
    }, shellDelayMs)
    panelMediaTimerRef.current = window.setTimeout(() => {
      panelMediaTimerRef.current = 0
      startTransition(() => {
        setPanelMediaPlanetId(portfolio.activePlanetId)
      })
    }, mediaDelayMs)
  }, [panelHydrationWeight, portfolio.activePlanetId, prefersReducedMotion])

  const onBackToGalaxy = useCallback(() => {
    requestAnimationFrame(() => {
      startTransition(() => {
        setPanelPlanetId(null)
        setPanelMediaPlanetId(null)
      })
      requestAnimationFrame(() => {
        startTransition(() => {
          backToGalaxy()
        })
      })
    })
  }, [backToGalaxy])

  const panelShowcase = panelPlanetId ? portfolioProjects[panelPlanetId] ?? null : null

  const sceneLayerReady =
    scene.deferred3d && (portfolio.canvasReady || portfolio.curtainDismissed)
  const scenePrimedUnderCurtain =
    scene.deferred3d && portfolio.canvasReady && !portfolio.curtainDismissed

  return (
    <div className="app">
      <div
        className={`scene-wrap ${sceneLayerReady ? 'is-visible' : 'is-hidden'} ${scenePrimedUnderCurtain ? 'scene-wrap--prime' : ''}`}
      >
        {scene.deferred3d ? (
          <Suspense fallback={null}>
            <SpaceScene
              activePlanetId={portfolio.activePlanetId}
              onPlanetSelect={portfolio.onPlanetSelect}
              welcomeVisibleCount={welcomeVisibleCount}
              onCanvasReady={portfolio.onCanvasReady}
              onSunTap={onSunTap}
              sunTapEnabled={sunTapEnabled}
              curtainDismissed={portfolio.curtainDismissed}
              prefersReducedMotion={prefersReducedMotion}
            />
          </Suspense>
        ) : null}
      </div>
      {!portfolio.curtainDismissed ? (
        <GalaxyIntroCurtain
          chunksWarmed={scene.chunksWarmed}
          deferred3d={scene.deferred3d}
          canvasReady={portfolio.canvasReady}
          reducedMotion={prefersReducedMotion}
          onRevealComplete={portfolio.onCurtainRevealComplete}
        />
      ) : null}
      <div
        className={`overlay top ${portfolio.activePlanetId ? 'is-hidden' : ''} ${!portfolio.curtainDismissed ? 'overlay--intro-curtain' : ''}`}
        style={{ '--hero-exit-wait': `${(HERO_CTA_MOTION_MS + 80) / 1000}s` }}
      >
        {portfolio.canvasReady || portfolio.curtainDismissed ? (
          <WelcomeHero
            onVisibleCountChange={onWelcomeVisibleCount}
            introRevealed={portfolio.heroCtaRevealed}
            isVisible={!portfolio.activePlanetId}
            prefersReducedMotion={prefersReducedMotion}
            ctaSunJoke={ctaSunJoke}
          />
        ) : null}
      </div>
      {panelShowcase ? (
        <Suspense fallback={null}>
          <PortfolioShowcasePanel
            planetPanelId={panelPlanetId}
            showcase={panelShowcase}
            onBack={onBackToGalaxy}
            enableMedia={panelMediaPlanetId === panelPlanetId}
          />
        </Suspense>
      ) : null}
      <p className={`copyright ${portfolio.curtainDismissed ? '' : 'awaiting-intro'}`}>
        © 2026 Vlada Melnyk. All rights reserved.
      </p>
    </div>
  )
}
