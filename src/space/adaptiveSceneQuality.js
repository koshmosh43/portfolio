import { createContext, useContext, useLayoutEffect, useState } from 'react'

const STAR_LAYERS_HIGH = Object.freeze({ far: 26000, near: 16000, hero: 6000 })
const STAR_LAYERS_LOW = Object.freeze({ far: 12000, near: 8000, hero: 3000 })

const DEFAULT_QUALITY = Object.freeze({
  dpr: [1, 1.35],
  shadowMap: 2048,
  proceduralTex: { terrainW: 256, terrainH: 128, moonW: 240, moonH: 120 },
  starLayers: STAR_LAYERS_HIGH,
  viewport: { width: 1440, height: 900, aspect: 1.6 },
})

export const AdaptiveSceneQualityContext = createContext(null)

export function useAdaptiveSceneQualityContext() {
  return useContext(AdaptiveSceneQualityContext)
}

function readQuality() {
  if (typeof window === 'undefined') return DEFAULT_QUALITY

  const w = window.innerWidth
  const h = window.innerHeight
  const aspect = w / h
  const saveData = navigator.connection?.saveData
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
  const narrow = w < 700 || h < 520
  const low = narrow || saveData || lowCpu

  return {
    dpr: low ? [0.7, 1] : [1, 1.35],
    /** 2048 keeps moon-sized casters readable in the sun shadow map; low tier stays 512. */
    shadowMap: low ? 512 : 2048,
    proceduralTex: low
      ? { terrainW: 192, terrainH: 96, moonW: 176, moonH: 88 }
      : { terrainW: 256, terrainH: 128, moonW: 240, moonH: 120 },
    starLayers: low ? STAR_LAYERS_LOW : STAR_LAYERS_HIGH,
    viewport: { width: w, height: h, aspect },
  }
}

export function useAdaptiveSceneQuality() {
  const [q, setQ] = useState(readQuality)

  useLayoutEffect(() => {
    setQ(readQuality())
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setQ(readQuality()))
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return q
}
