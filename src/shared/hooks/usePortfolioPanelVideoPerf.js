import { useEffect } from 'react'

/** Pause every other `<video>` in the same `.planet-panel`. */
export function pauseOtherPanelVideos(activeVideo) {
  if (!(activeVideo instanceof HTMLVideoElement)) return
  const panel = activeVideo.closest('.planet-panel')
  if (!panel) return
  panel.querySelectorAll('video').forEach((v) => {
    if (v !== activeVideo && !v.paused) v.pause()
  })
}

/**
 * When one `<video>` in `.planet-panel` starts playing, pause others so Safari
 * only decodes one capture at a time.
 */
export function usePlanetPanelExclusiveVideoPlayback() {
  useEffect(() => {
    const onPlay = (e) => pauseOtherPanelVideos(e.target)
    document.addEventListener('play', onPlay, true)
    return () => document.removeEventListener('play', onPlay, true)
  }, [])
}
