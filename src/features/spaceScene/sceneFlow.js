import { useEffect, useReducer } from 'react'
import { pick } from 'remeda'
import { readNetworkProfile } from '../../shared/lib/networkProfile'

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

export function useSceneFlow() {
  const [state, dispatch] = useReducer(sceneTransition, sceneInitialState)

  useEffect(() => {
    dispatch({ type: 'WARM_START' })
    let cancelled = false
    let idleId = 0
    let timeoutId = 0
    const { isDataLite } = readNetworkProfile()
    const waitNextFrame = () =>
      new Promise((resolve) => {
        requestAnimationFrame(resolve)
      })

    const warm = async () => {
      await import('../../space/SpaceScene')
      await waitNextFrame()
      await import('../../space/Planets')
      await waitNextFrame()
      await import('../../space/Spaceship')
      await waitNextFrame()
      await import('../../space/sceneChunks/CosmicBackgroundChunk')
      await waitNextFrame()
      await import('../../space/sceneChunks/DeepSpaceDecorChunk')
      await waitNextFrame()
      if (!cancelled) dispatch({ type: 'CHUNKS_WARMED' })
    }

    const scheduleWarm = () => {
      if (cancelled) return
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(() => {
          void warm()
        }, { timeout: isDataLite ? 3000 : 1600 })
      } else {
        timeoutId = window.setTimeout(
          () => {
            void warm()
          },
          isDataLite ? 700 : 180,
        )
      }
    }

    scheduleWarm()
    return () => {
      cancelled = true
      if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let idleId = 0
    let timeoutId = 0

    const promote = () => {
      if (!cancelled) dispatch({ type: 'DEFERRED_3D_READY' })
    }

    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(promote, { timeout: 1200 })
    } else {
      timeoutId = window.setTimeout(promote, 180)
    }

    return () => {
      cancelled = true
      if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return pick(state, VIEW_KEYS)
}
