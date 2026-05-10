import { useCallback } from 'react'

/** Drives --pointer-x / --pointer-y on .ambient-glow-frame (see simeydotme/eYXPLEP). */
export function useAmbientGlowPointer() {
  return useCallback((e) => {
    const el = e.currentTarget
    if (!el?.getBoundingClientRect) return
    const r = el.getBoundingClientRect()
    const x = e.clientX ?? e.touches?.[0]?.clientX
    const y = e.clientY ?? e.touches?.[0]?.clientY
    if (x == null || y == null) return
    const px = Math.min(100, Math.max(0, (100 * (x - r.left)) / r.width))
    const py = Math.min(100, Math.max(0, (100 * (y - r.top)) / r.height))
    el.style.setProperty('--pointer-x', `${px}%`)
    el.style.setProperty('--pointer-y', `${py}%`)
  }, [])
}
