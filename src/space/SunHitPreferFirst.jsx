import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'

/** Prioritizes the sun hit mesh in raycast order so nearer planets do not steal hover/tap. */
export function SunHitPreferFirst({ enabled }) {
  const get = useThree((s) => s.get)

  useLayoutEffect(() => {
    if (!enabled) return undefined
    const state = get()
    const original = state.events.filter
    state.events.filter = (items, st) => {
      const base = original ? original(items, st) : items
      const sun = base.find((h) => h.object.userData?.sunPointerHit)
      if (!sun) return base
      return [sun, ...base.filter((h) => h.object !== sun.object)]
    }
    return () => {
      get().events.filter = original
    }
  }, [enabled, get])

  return null
}
