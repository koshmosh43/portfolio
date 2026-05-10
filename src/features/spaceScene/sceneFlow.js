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

export function useSceneFlow() {
  const [state, dispatch] = useReducer(sceneTransition, sceneInitialState)

  useEffect(() => {
    dispatch({ type: 'WARM_START' })
    let cancelled = false
    const warm = async () => {
      await import('../../space/SpaceScene')
      await new Promise((r) => requestAnimationFrame(r))
      await Promise.all([
        import('../../space/Planets'),
        import('../../space/Spaceship'),
        import('../../space/sceneChunks/CosmicBackgroundChunk'),
        import('../../space/sceneChunks/DeepSpaceDecorChunk'),
      ])
      if (!cancelled) dispatch({ type: 'CHUNKS_WARMED' })
    }
    void warm()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let raf1 = 0

    const promote = () => {
      if (!cancelled) dispatch({ type: 'DEFERRED_3D_READY' })
    }

    raf1 = requestAnimationFrame(() => {
      if (cancelled) return
      promote()
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
    }
  }, [])

  return pick(state, VIEW_KEYS)
}
