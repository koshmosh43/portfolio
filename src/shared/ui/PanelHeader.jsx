import { useCallback, useEffect, useId, useRef } from 'react'
import { gsap } from 'gsap'
import { useAmbientGlowPointer } from '../hooks/useAmbientGlowPointer'

function PlanetBtnIcon() {
  const rid = useId().replace(/:/g, '')
  const rg = `pbi-r-${rid}`
  const pg = `pbi-p-${rid}`
  const cb = `pbi-cb-${rid}`
  const cf = `pbi-cf-${rid}`
  return (
    <svg className="planet-btn-icon" viewBox="0 0 18 18" aria-hidden>
      <defs>
        <linearGradient id={rg} x1="1" y1="17" x2="17" y2="1" gradientUnits="userSpaceOnUse">
          <stop offset="0"    stopColor="#0b8577" stopOpacity="0.3" />
          <stop offset="0.38" stopColor="#b44bff" stopOpacity="0.92" />
          <stop offset="0.68" stopColor="#5ef0de" stopOpacity="0.8" />
          <stop offset="1"    stopColor="#0b8577" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={pg} cx="38%" cy="32%" r="62%">
          <stop offset="0"    stopColor="#c8fff8" />
          <stop offset="0.38" stopColor="#b44bff" />
          <stop offset="1"    stopColor="#060e0d" />
        </radialGradient>
        <clipPath id={cb}>
          <rect x="0" y="0" width="18" height="9" />
        </clipPath>
        <clipPath id={cf}>
          <rect x="0" y="9" width="18" height="9" />
        </clipPath>
      </defs>

      {/* Ring — back half (behind planet) */}
      <g className="planet-btn-ring" clipPath={`url(#${cb})`}>
        <ellipse cx="9" cy="9" rx="8.4" ry="2.7"
          fill="none" stroke={`url(#${rg})`} strokeWidth="1.45" opacity="0.44" />
      </g>

      {/* Planet body */}
      <g className="planet-btn-body">
        <circle cx="9" cy="9" r="4.1" fill={`url(#${pg})`} />
        {/* Polar highlight — asymmetry that reveals spin */}
        <circle cx="9" cy="5.5" r="0.72" fill="rgba(200,255,248,0.65)" />
      </g>

      {/* Ring — front half (in front of planet) */}
      <g className="planet-btn-ring" clipPath={`url(#${cf})`}>
        <ellipse cx="9" cy="9" rx="8.4" ry="2.7"
          fill="none" stroke={`url(#${rg})`} strokeWidth="1.45" />
      </g>
    </svg>
  )
}

export function PanelHeader({ title, subtitle, actionLabel, onAction }) {
  const onAmbientMove = useAmbientGlowPointer()
  const btnRef = useRef(null)
  const glowRef = useRef(null)
  const tlRef = useRef(null)

  useEffect(() => {
    const btn = btnRef.current
    const glow = glowRef.current
    if (!glow || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.set(glow, { opacity: 0.55, scale: 1, x: 0, filter: 'blur(20px)' })

    // Idle breathing — color shift baked in CSS animation, GSAP owns geometry
    tlRef.current = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
      .to(glow, { opacity: 0.82, scaleX: 1.14, scaleY: 1.32, x: 5,  filter: 'blur(14px)', duration: 1.9 })
      .to(glow, { opacity: 0.48, scaleX: 0.90, scaleY: 0.95, x: -5, filter: 'blur(26px)', duration: 1.9 })

    const onEnter = () => {
      tlRef.current?.pause()
      gsap.to(glow, { opacity: 1, scaleX: 1.28, scaleY: 1.55, x: 0, filter: 'blur(10px)', duration: 0.38, ease: 'power2.out', overwrite: 'auto' })
    }
    const onLeave = () => {
      gsap.to(glow, { opacity: 0.6, scaleX: 1, scaleY: 1, x: 0, filter: 'blur(20px)', duration: 0.55, ease: 'power2.inOut', overwrite: 'auto', onComplete: () => tlRef.current?.resume() })
    }
    const onDown = () => {
      gsap.to(btn,  { scale: 0.94, duration: 0.14, ease: 'power3.in',  overwrite: 'auto' })
      gsap.to(glow, { opacity: 1,  scaleX: 1.42, scaleY: 1.7, filter: 'blur(8px)',  duration: 0.14, ease: 'power3.in',  overwrite: 'auto' })
    }
    const onUp = () => {
      gsap.to(btn,  { scale: 1,    duration: 0.48, ease: 'back.out(2.2)', overwrite: 'auto' })
      gsap.to(glow, { opacity: 0.75, scaleX: 1.1, scaleY: 1.2, filter: 'blur(16px)', duration: 0.48, ease: 'back.out(1.4)', overwrite: 'auto' })
    }

    btn.addEventListener('pointerenter', onEnter)
    btn.addEventListener('pointerleave', onLeave)
    btn.addEventListener('pointerdown', onDown)
    btn.addEventListener('pointerup',   onUp)
    btn.addEventListener('pointercancel', onLeave)

    return () => {
      tlRef.current?.kill()
      btn.removeEventListener('pointerenter', onEnter)
      btn.removeEventListener('pointerleave', onLeave)
      btn.removeEventListener('pointerdown', onDown)
      btn.removeEventListener('pointerup',   onUp)
      btn.removeEventListener('pointercancel', onLeave)
    }
  }, [])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    onAction?.()
  }, [onAction])

  return (
    <div className="planet-panel-head">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <button
        ref={btnRef}
        type="button"
        className="planet-panel-back-btn ambient-glow-frame ambient-glow-frame--control"
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={onAmbientMove}
      >
        <span ref={glowRef} className="planet-panel-back-btn__glow" aria-hidden />
        <span className="ambient-glow-frame__inner planet-panel-back-btn__inner">
          <PlanetBtnIcon />
          <span className="planet-panel-back-btn__label">{actionLabel}</span>
        </span>
      </button>
    </div>
  )
}
