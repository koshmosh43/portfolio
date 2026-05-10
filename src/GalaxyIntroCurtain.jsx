import { useEffect, useMemo, useRef, useState } from 'react'
import bieberPoster from './assets/bieber.webp'
import { GalaxyIntroBackdrop } from './GalaxyIntroBackdrop'
import { IntroOrbitSvg } from './IntroOrbitSvg'

function milestoneFloor({ chunksWarmed, deferred3d, canvasReady }) {
  if (canvasReady) return 100
  if (!chunksWarmed) return 24
  if (!deferred3d) return 41
  return 68
}

export function GalaxyIntroCurtain({
  chunksWarmed,
  deferred3d,
  canvasReady,
  reducedMotion,
  onRevealComplete,
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [pct, setPct] = useState(0)
  const deferredAt = useRef(0)

  const floor = useMemo(
    () => milestoneFloor({ chunksWarmed, deferred3d, canvasReady }),
    [chunksWarmed, deferred3d, canvasReady],
  )

  useEffect(() => {
    if (deferred3d && !canvasReady && deferredAt.current === 0) {
      deferredAt.current = performance.now()
    }
    if (!deferred3d) deferredAt.current = 0
  }, [deferred3d, canvasReady])

  useEffect(() => {
    if (canvasReady) {
      setPct(100)
      return undefined
    }

    if (reducedMotion) {
      setPct((prev) => Math.max(prev, floor))
      return undefined
    }

    const tick = () => {
      setPct((prev) => {
        let target = floor
        if (deferred3d && !canvasReady && deferredAt.current) {
          const elapsed = (performance.now() - deferredAt.current) / 1000
          const creep = Math.min(28, elapsed * 14)
          target = Math.max(target, Math.min(98, 66 + creep))
        }
        if (prev >= target) return prev
        const step = Math.max(1, Math.ceil((target - prev) / 1.65))
        return Math.min(target, prev + step)
      })
    }

    const id = window.setInterval(tick, 36)
    return () => clearInterval(id)
  }, [floor, canvasReady, deferred3d, reducedMotion])

  useEffect(() => {
    if (!canvasReady) return undefined

    const closeDelayMs = reducedMotion ? 0 : 48
    /* Match `.galaxy-intro-curtain { transition: opacity … }` in App.css — don’t unmount mid-fade. */
    const curtainFadeMs = reducedMotion ? 0 : 420
    setIsClosing(true)

    const completeTimer = setTimeout(() => {
      onRevealComplete?.()
    }, closeDelayMs + curtainFadeMs + 24)

    return () => clearTimeout(completeTimer)
  }, [canvasReady, onRevealComplete, reducedMotion])

  return (
    <div
      className={`galaxy-intro-curtain ${isClosing ? 'is-closing' : ''} ${reducedMotion ? 'is-reduced-motion' : ''}`}
      aria-hidden="true"
    >
      <GalaxyIntroBackdrop reducedMotion={reducedMotion} />
      <div className="galaxy-intro-curtain__stack">
        <div className="galaxy-intro-curtain__hero">
          <img
            className="galaxy-intro-curtain__poster"
            src={bieberPoster}
            alt=""
            width={1672}
            height={1431}
            decoding="async"
            fetchPriority="high"
            loading="eager"
          />
        </div>
        <div className={`galaxy-intro-curtain__load ${reducedMotion ? 'is-reduced' : ''}`}>
          <div className="galaxy-intro-curtain__load-head">
            <IntroOrbitSvg reduced={reducedMotion} />
            <div className="galaxy-intro-curtain__readout">
              <p className="galaxy-intro-curtain__pct-big">
                <span className="galaxy-intro-curtain__pct-num">{Math.round(pct)}</span>
                <span className="galaxy-intro-curtain__pct-sym">%</span>
              </p>
            </div>
          </div>
          <div className="galaxy-intro-curtain__track-shell">
            <div className="galaxy-intro-curtain__track">
              <div
                className="galaxy-intro-curtain__fill"
                style={{ transform: `scaleX(${Math.min(100, pct) / 100})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
