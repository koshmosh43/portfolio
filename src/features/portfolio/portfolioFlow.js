import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { pick } from 'remeda'
import { CTA_REVEAL_DELAY_MS, HERO_INTRO_HOLD_MS } from '../../welcomeConstants.js'

export const portfolioPhases = Object.freeze({
  intro: 'intro',
  hero: 'hero',
  sceneReady: 'sceneReady',
  showcaseOpen: 'showcaseOpen',
})

export const portfolioInitialState = Object.freeze({
  phase: portfolioPhases.intro,
  activePlanetId: null,
  introRevealed: false,
  heroCtaRevealed: false,
  curtainDismissed: false,
  canvasReady: false,
})

const VIEW_KEYS = [
  'activePlanetId',
  'introRevealed',
  'heroCtaRevealed',
  'curtainDismissed',
  'canvasReady',
]

export function portfolioTransition(state, event) {
  switch (event.type) {
    case 'INTRO_READY':
      return { ...state, introRevealed: true, phase: portfolioPhases.hero }
    case 'CURTAIN_DISMISSED':
      return { ...state, curtainDismissed: true }
    case 'HERO_CTA_READY':
      return {
        ...state,
        heroCtaRevealed: true,
        phase: state.canvasReady ? portfolioPhases.sceneReady : state.phase,
      }
    case 'CANVAS_READY':
      return {
        ...state,
        canvasReady: true,
        phase: state.heroCtaRevealed ? portfolioPhases.sceneReady : state.phase,
      }
    case 'PLANET_SELECTED':
      return { ...state, activePlanetId: event.planetId, phase: portfolioPhases.showcaseOpen }
    case 'BACK_TO_GALAXY':
      return { ...state, activePlanetId: null, phase: portfolioPhases.sceneReady }
    default:
      return state
  }
}

function selectPortfolioView(state, projectsByPlanet) {
  const view = pick(state, VIEW_KEYS)
  return {
    ...view,
    activeShowcase: view.activePlanetId ? projectsByPlanet[view.activePlanetId] ?? null : null,
  }
}

export function usePortfolioFlow({ prefersReducedMotion, projectsByPlanet }) {
  const [state, dispatch] = useReducer(portfolioTransition, portfolioInitialState)

  useEffect(() => {
    const ms = prefersReducedMotion ? 40 : CTA_REVEAL_DELAY_MS
    const t = setTimeout(() => dispatch({ type: 'INTRO_READY' }), ms)
    return () => clearTimeout(t)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!state.curtainDismissed) return undefined
    const ms = prefersReducedMotion ? 120 : HERO_INTRO_HOLD_MS
    const t = setTimeout(() => dispatch({ type: 'HERO_CTA_READY' }), ms)
    return () => clearTimeout(t)
  }, [prefersReducedMotion, state.curtainDismissed])

  const onCanvasReady = useCallback(() => dispatch({ type: 'CANVAS_READY' }), [])
  const onCurtainRevealComplete = useCallback(
    () => dispatch({ type: 'CURTAIN_DISMISSED' }),
    [],
  )

  const onPlanetSelect = useCallback((planetId) => {
    dispatch({ type: 'PLANET_SELECTED', planetId })
  }, [])

  const onBackToGalaxy = useCallback(() => {
    dispatch({ type: 'BACK_TO_GALAXY' })
  }, [])

  const view = useMemo(
    () => selectPortfolioView(state, projectsByPlanet),
    [projectsByPlanet, state],
  )

  return {
    ...view,
    onCanvasReady,
    onCurtainRevealComplete,
    onPlanetSelect,
    onBackToGalaxy,
  }
}
