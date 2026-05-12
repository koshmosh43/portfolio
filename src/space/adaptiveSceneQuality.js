import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react'
import { readNetworkProfile } from '../shared/lib/networkProfile'

const STAR_LAYERS_HIGH = Object.freeze({ far: 26000, near: 16000, hero: 6000 })
const STAR_LAYERS_LOW = Object.freeze({ far: 12000, near: 8000, hero: 3000 })
/** Mobile / save-data / 2G — fewer points, less vertex work & bandwidth-friendly. */
const STAR_LAYERS_MIN = Object.freeze({ far: 5200, near: 3400, hero: 1400 })

const DEFAULT_QUALITY = Object.freeze({
  tier: 0,
  skipPostFx: false,
  dpr: [1, 1.35],
  shadowMap: 2048,
  proceduralTex: { terrainW: 256, terrainH: 128, moonW: 240, moonH: 120 },
  starLayers: STAR_LAYERS_HIGH,
  viewport: { width: 1440, height: 900, aspect: 1.6 },
})

/** Damp address-bar / sub-pixel resize noise so layout + planet assets do not thrash. */
const VIEWPORT_QUANT_PX = 16

export const AdaptiveSceneQualityContext = createContext(null)

export function useAdaptiveSceneQualityContext() {
  return useContext(AdaptiveSceneQualityContext)
}

function quantizeViewportDim(n) {
  const q = Math.round(n / VIEWPORT_QUANT_PX) * VIEWPORT_QUANT_PX
  return Math.max(VIEWPORT_QUANT_PX, q)
}

/**
 * @param {{ current: boolean }} narrowStickyRef — hysteresis for w/h near 700×520 to avoid shadow tier flip-flop.
 */
function computeSceneQuality(narrowStickyRef) {
  if (typeof window === 'undefined') {
    return { quality: DEFAULT_QUALITY, signature: 'ssr' }
  }

  const w = window.innerWidth
  const h = window.innerHeight
  const qw = quantizeViewportDim(w)
  const qh = quantizeViewportDim(h)

  const narrowEnter = qw < 700 || qh < 520
  const narrowExit = qw >= 728 && qh >= 544
  if (narrowStickyRef.current) {
    if (narrowExit) narrowStickyRef.current = false
  } else if (narrowEnter) {
    narrowStickyRef.current = true
  }
  const narrow = narrowStickyRef.current

  const { effectiveType, saveData, isDataLite } = readNetworkProfile()
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
  const low = narrow || lowCpu || isDataLite

  const tier2Net =
    saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || (narrow && effectiveType === '3g')
  const tier = tier2Net ? 2 : low ? 1 : 0

  const skipPostFx = tier >= 2

  const quality =
    tier === 0
      ? {
          tier,
          skipPostFx,
          dpr: [1, 1.35],
          shadowMap: 2048,
          proceduralTex: { terrainW: 256, terrainH: 128, moonW: 240, moonH: 120 },
          starLayers: STAR_LAYERS_HIGH,
          viewport: { width: qw, height: qh, aspect: qw / qh },
        }
      : tier === 1
        ? {
            tier,
            skipPostFx,
            dpr: [0.7, 1],
            shadowMap: 512,
            proceduralTex: { terrainW: 192, terrainH: 96, moonW: 176, moonH: 88 },
            starLayers: STAR_LAYERS_LOW,
            viewport: { width: qw, height: qh, aspect: qw / qh },
          }
        : {
            tier,
            skipPostFx,
            dpr: [0.65, 1],
            shadowMap: 256,
            proceduralTex: { terrainW: 160, terrainH: 80, moonW: 144, moonH: 72 },
            starLayers: STAR_LAYERS_MIN,
            viewport: { width: qw, height: qh, aspect: qw / qh },
          }

  const signature = `${tier}|${effectiveType}|${saveData ? 1 : 0}|${lowCpu ? 1 : 0}|${qw}|${qh}`
  return { quality, signature }
}

export function useAdaptiveSceneQuality() {
  const narrowStickyRef = useRef(false)
  const lastSignatureRef = useRef('')

  const [q, setQ] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_QUALITY
    const { quality, signature } = computeSceneQuality(narrowStickyRef)
    lastSignatureRef.current = signature
    return quality
  })

  useLayoutEffect(() => {
    const apply = () => {
      const { quality, signature } = computeSceneQuality(narrowStickyRef)
      if (signature === lastSignatureRef.current) return
      lastSignatureRef.current = signature
      setQ(quality)
    }

    apply()

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }

    window.addEventListener('resize', schedule)
    const conn = navigator.connection
    conn?.addEventListener?.('change', schedule)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
      conn?.removeEventListener?.('change', schedule)
    }
  }, [])

  return q
}
