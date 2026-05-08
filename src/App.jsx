import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { GalaxyIntroCurtain } from './GalaxyIntroCurtain'
import { WelcomeHero } from './WelcomeHero'
import { usePortfolioFlow } from './features/portfolio/portfolioFlow'
import { useSceneFlow } from './features/spaceScene/sceneFlow'
import { portfolioProjects } from './shared/config/portfolioProjects'
import { HERO_CTA_MOTION_MS, WELCOME_TOTAL_CHARS } from './welcomeConstants'
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

export default function App() {
  const [welcomeVisibleCount, setWelcomeVisibleCount] = useState(WELCOME_TOTAL_CHARS)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

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
  const scene = useSceneFlow({ introRevealed: portfolio.introRevealed })

  useEffect(() => {
    if (!scene.chunksWarmed) return undefined
    let effectAlive = true
    let idleId = 0
    let timeoutId = 0
    let started = false

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

    window.addEventListener('pointerdown', load, { passive: true, once: true })
    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(load, { timeout: 9000 })
    } else {
      timeoutId = window.setTimeout(load, 4000)
    }

    return () => {
      effectAlive = false
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

  return (
    <div className="app">
      <div className={`scene-wrap ${portfolio.curtainDismissed ? 'is-visible' : 'is-hidden'}`}>
        {scene.deferred3d ? (
          <Suspense fallback={null}>
            <SpaceScene
              activePlanetId={portfolio.activePlanetId}
              onPlanetSelect={portfolio.onPlanetSelect}
              welcomeVisibleCount={welcomeVisibleCount}
              onCanvasReady={portfolio.onCanvasReady}
            />
          </Suspense>
        ) : null}
      </div>
      {!portfolio.curtainDismissed ? (
        <GalaxyIntroCurtain
          canvasReady={portfolio.canvasReady}
          reducedMotion={prefersReducedMotion}
          onRevealComplete={portfolio.onCurtainRevealComplete}
        />
      ) : null}
      <div
        className={`overlay top ${portfolio.activePlanetId ? 'is-hidden' : ''} ${!portfolio.curtainDismissed ? 'overlay--intro-curtain' : ''}`}
        style={{ '--hero-exit-wait': `${(HERO_CTA_MOTION_MS + 80) / 1000}s` }}
      >
        {portfolio.curtainDismissed ? (
          <WelcomeHero
            onVisibleCountChange={onWelcomeVisibleCount}
            introRevealed={portfolio.heroCtaRevealed}
            isVisible={!portfolio.activePlanetId}
            prefersReducedMotion={prefersReducedMotion}
          />
        ) : null}
      </div>
      {portfolio.activeShowcase ? (
        <Suspense fallback={null}>
          <PortfolioShowcasePanel
            showcase={portfolio.activeShowcase}
            onBack={portfolio.onBackToGalaxy}
          />
        </Suspense>
      ) : null}
      <p className={`copyright ${portfolio.curtainDismissed ? '' : 'awaiting-intro'}`}>
        © 2026 Vlada Melnyk. All rights reserved.
      </p>
    </div>
  )
}
