import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useEffect } from 'react'

/**
 * Vignette removed from the GPU path: it darkened the top-left (where the sun lives) once FX
 * mounted, so the corona read as “gone”. Edge darkening is handled in CSS (App.css) with a softer,
 * center-biased gradient. Bloom tuned so the sun stays above the luminance floor.
 */
export function SpacePostFx({ onReady }) {
  useEffect(() => {
    onReady?.()
  }, [onReady])

  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.32} mipmapBlur luminanceThreshold={0.18} luminanceSmoothing={0.62} radius={0.56} />
    </EffectComposer>
  )
}
