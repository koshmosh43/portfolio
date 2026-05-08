import { useEffect, useReducer } from 'react'
import { pick } from 'remeda'

export const sceneStages = Object.freeze({
  idle: 'idle',
  warming: 'warming',
  ready: 'ready',
})

export const sceneInitialState = Object.freeze({
  stage: sceneStages.idle,
  chunksWarmed: false,
  deferred3d: false,
})

const VIEW_KEYS = ['stage', 'chunksWarmed', 'deferred3d']

export function sceneTransition(state, event) {
  switch (event.type) {
    case 'WARM_START':
      return { ...state, stage: sceneStages.warming }
    case 'CHUNKS_WARMED':
      return { ...state, chunksWarmed: true }
    case 'DEFERRED_3D_READY':
      return { ...state, deferred3d: true, stage: sceneStages.ready }
    default:
      return state
  }
}

export function useSceneFlow({ introRevealed }) {
  const [state, dispatch] = useReducer(sceneTransition, sceneInitialState)

  useEffect(() => {
    if (!introRevealed) return undefined
    dispatch({ type: 'WARM_START' })
    let cancelled = false
    const warm = async () => {
      await import('../../space/SpaceScene')
      await new Promise((r) => requestAnimationFrame(r))
      await import('../../space/Planets')
      await new Promise((r) => requestAnimationFrame(r))
      await import('../../space/Spaceship')
      if (!cancelled) dispatch({ type: 'CHUNKS_WARMED' })
    }
    void warm()
    return () => {
      cancelled = true
    }
  }, [introRevealed])

  useEffect(() => {
    if (!introRevealed) return undefined

    let cancelled = false
    let raf1 = 0
    let raf2 = 0
    let idleId = 0
    let timeoutId = 0

    const promote = () => {
      if (!cancelled) dispatch({ type: 'DEFERRED_3D_READY' })
    }

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return
        if (typeof requestIdleCallback === 'function') {
          idleId = requestIdleCallback(promote, { timeout: 900 })
          return
        }
        timeoutId = setTimeout(promote, 0)
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (idleId) cancelIdleCallback(idleId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [introRevealed])

  return pick(state, VIEW_KEYS)
}
