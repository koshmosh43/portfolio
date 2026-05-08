import { useEffect, useState } from 'react'
import bieberPoster from './assets/bieber.webp'

export function GalaxyIntroCurtain({ canvasReady, reducedMotion, onRevealComplete }) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!canvasReady) return undefined

    const closeDelayMs = reducedMotion ? 0 : 160
    const completeDelayMs = reducedMotion ? 0 : 320
    setIsClosing(true)

    const completeTimer = setTimeout(() => {
      onRevealComplete?.()
    }, closeDelayMs + completeDelayMs)

    return () => clearTimeout(completeTimer)
  }, [canvasReady, onRevealComplete, reducedMotion])

  return (
    <div className={`galaxy-intro-curtain ${isClosing ? 'is-closing' : ''}`} aria-hidden="true">
      {/* HTML fetchpriority — React warns on camelCase for native img; eslint wants DOM spelling here. */}
      {/* eslint-disable react/no-unknown-property */}
      <img
        className="galaxy-intro-curtain__poster"
        src={bieberPoster}
        alt=""
        decoding="async"
        fetchpriority="high"
        loading="eager"
      />
      {/* eslint-enable react/no-unknown-property */}
    </div>
  )
}
