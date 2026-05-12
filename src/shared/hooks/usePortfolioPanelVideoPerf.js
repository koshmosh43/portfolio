import { useEffect } from 'react'

/**
 * When one `<video>` in `.planet-panel` starts playing, pause others so Safari
 * only decodes one AR capture at a time.
 */
export function usePlanetPanelExclusiveVideoPlayback() {
  useEffect(() => {
    const onPlay = (e) => {
      const t = e.target
      if (!(t instanceof HTMLVideoElement)) return
      const panel = t.closest('.planet-panel')
      if (!panel) return
      panel.querySelectorAll('video').forEach((v) => {
        if (v !== t && !v.paused) v.pause()
      })
    }
    document.addEventListener('play', onPlay, true)
    return () => document.removeEventListener('play', onPlay, true)
  }, [])
}
