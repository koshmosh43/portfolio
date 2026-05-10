import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
  const checkGradId = `galaxy-intro-pct-check-${useId().replace(/:/g, '')}`

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
          target = Math.max(target, Math.min(99, 66 + creep))
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

  const done = pct >= 100
  /* Readout + bar: integers 0–99 tied to load; 100% = done UI only (no “100” numeral). */
  const loadPct = Math.min(99, Math.max(0, Math.round(Number(pct))))
  const barLinear01 = done ? 1 : loadPct / 100

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
            fetchpriority="high"
            loading="eager"
          />
        <div className={`galaxy-intro-curtain__load ${reducedMotion ? 'is-reduced' : ''}`}>
          <div className="galaxy-intro-curtain__load-head">
            {done ? (
              <span className="galaxy-intro-curtain__orbit-ghost" aria-hidden />
            ) : (
              <IntroOrbitSvg reduced={reducedMotion} />
            )}
            <div className="galaxy-intro-curtain__readout">
              <p className={`galaxy-intro-curtain__pct-big${done ? ' galaxy-intro-curtain__pct-big--done' : ''}`}>
                {done ? (
                  <span className="galaxy-intro-curtain__pct-done">
                    <svg
                      className="galaxy-intro-curtain__pct-check"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <defs>
                        <linearGradient
                          id={checkGradId}
                          x1="6"
                          y1="12"
                          x2="18"
                          y2="12"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#5eadff" />
                          <stop offset="0.45" stopColor="#c8ffd8" />
                          <stop offset="1" stopColor="#ff6ef7" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M6.2 12.4 10.4 16.6 17.8 7.4"
                        stroke={`url(#${checkGradId})`}
                        strokeWidth="2.35"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="galaxy-intro-curtain__pct-ready">{"You're all set!"}</span>
                  </span>
                ) : (
                  <>
                    <span className="galaxy-intro-curtain__pct-num">{loadPct}</span>
                    <span className="galaxy-intro-curtain__pct-sym">%</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="galaxy-intro-curtain__track-shell">
            <div className="galaxy-intro-curtain__track">
              <div
                className="galaxy-intro-curtain__fill"
                style={{
                  width: `${Math.round(barLinear01 * 10000) / 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
