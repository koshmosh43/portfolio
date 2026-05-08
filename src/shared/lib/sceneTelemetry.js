const PREFIX = 'portfolio:scene'

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function safeMark(name) {
  try {
    performance.mark(`${PREFIX}:${name}`)
  } catch {
    /* ignore */
  }
}

/**
 * Lightweight scene timings: Performance marks (DevTools) + optional CustomEvent.
 * No network, no heavy deps. In dev, mirrors last snapshot on window for quick console checks.
 */
export function recordScenePhase(phase, detail = {}) {
  const t = now()
  safeMark(phase)

  if (typeof document !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent('portfolio:scene', {
        detail: { phase, t, ...detail },
      }),
    )
  }

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.__PORTFOLIO_SCENE_PERF__ = window.__PORTFOLIO_SCENE_PERF__ ?? []
    window.__PORTFOLIO_SCENE_PERF__.push({ phase, t, ...detail })
  }
}

export function recordSceneFirstWebGlFrame() {
  recordScenePhase('firstWebGlFrame')
}

/** Fires once Planets + Spaceship (inside the same Suspense boundary) have committed. */
export function recordSceneInteractiveSubtreeReady() {
  recordScenePhase('interactiveSubtreeReady')
}
