import test from 'node:test'
import assert from 'node:assert/strict'
import {
  portfolioInitialState,
  portfolioPhases,
  portfolioTransition,
} from '../src/features/portfolio/portfolioFlow.js'

test('portfolio machine reaches sceneReady when hero and canvas are ready', () => {
  const introState = portfolioTransition(portfolioInitialState, { type: 'INTRO_READY' })
  const heroCtaState = portfolioTransition(introState, { type: 'HERO_CTA_READY' })
  const readyState = portfolioTransition(heroCtaState, { type: 'CANVAS_READY' })

  assert.equal(readyState.phase, portfolioPhases.sceneReady)
  assert.equal(readyState.canvasReady, true)
  assert.equal(readyState.heroCtaRevealed, true)
})

test('portfolio machine opens and closes showcase flow', () => {
  const focused = portfolioTransition(portfolioInitialState, {
    type: 'PLANET_SELECTED',
    planetId: 'planetB',
  })
  assert.equal(focused.phase, portfolioPhases.showcaseOpen)
  assert.equal(focused.activePlanetId, 'planetB')

  const back = portfolioTransition(focused, { type: 'BACK_TO_GALAXY' })
  assert.equal(back.phase, portfolioPhases.sceneReady)
  assert.equal(back.activePlanetId, null)
})
