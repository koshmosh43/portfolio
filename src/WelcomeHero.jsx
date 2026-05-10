import gsap from 'gsap'
import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import {
  HERO_CTA,
  HERO_GLOW_MS,
  HERO_INTRO,
  HERO_INTRO_HOLD_MS,
  HERO_SUN_JOKE,
  WELCOME_TOTAL_CHARS,
} from './welcomeConstants'

/** Upward arch (∩): center lifted, edges slightly fanned — GSAP still targets outer .welcome-hero__char. */
const ACCENT_ARCH_LIFT_EM = 0.14
const ACCENT_ARCH_TILT_DEG = 5.5

function charsOfLine(line) {
  return line.split('').map((ch, i) => {
    const g = ch === ' ' ? '\u00a0' : ch
    return (
      <span key={i} className="welcome-hero__char">
        <span className="welcome-hero__char-pink" aria-hidden>
          {g}
        </span>
        <span className="welcome-hero__char-white">{g}</span>
      </span>
    )
  })
}

function charsOfAccentArch(line) {
  const chars = line.split('')
  const n = chars.length
  return chars.map((ch, i) => {
    const g = ch === ' ' ? '\u00a0' : ch
    const t = n <= 1 ? 0 : (i / (n - 1)) * 2 - 1
    const lift = ACCENT_ARCH_LIFT_EM * (1 - t * t)
    const tilt = ACCENT_ARCH_TILT_DEG * t
    return (
      <span key={i} className="welcome-hero__char">
        <span
          className="welcome-hero__char-arch"
          style={{
            transform: `translateY(${-lift}em) rotate(${tilt}deg)`,
            transformOrigin: '50% 88%',
          }}
        >
          <span className="welcome-hero__char-pink" aria-hidden>
            {g}
          </span>
          <span className="welcome-hero__char-white">{g}</span>
        </span>
      </span>
    )
  })
}

function PhaseChars({ accent, tailMid, tailLast }) {
  return (
    <div className="welcome-hero__stack">
      <span className="welcome-hero__accent">{charsOfAccentArch(accent)}</span>
      <span className="welcome-hero__tail">{charsOfLine(tailMid)}</span>
      <span className="welcome-hero__tail welcome-hero__tail--last">{charsOfLine(tailLast)}</span>
    </div>
  )
}

function collectChars(root) {
  if (!root) return []
  return gsap.utils.toArray(root.querySelectorAll('.welcome-hero__char'))
}

export const WelcomeHero = memo(function WelcomeHero({
  onVisibleCountChange,
  introRevealed = false,
  isVisible = true,
  prefersReducedMotion = false,
  ctaSunJoke = false,
}) {
  const introPhaseRef = useRef(null)
  const ctaPhaseRef = useRef(null)
  const tlRef = useRef(null)
  const prevIntroRef = useRef(introRevealed)
  const prevVisibleRef = useRef(isVisible)
  const prevJokeRef = useRef(ctaSunJoke)

  useEffect(() => {
    onVisibleCountChange?.(WELCOME_TOTAL_CHARS)
  }, [onVisibleCountChange])

  const reduced = prefersReducedMotion
  const glowMs = reduced ? 0 : HERO_GLOW_MS

  useLayoutEffect(() => {
    const wasIntro = prevIntroRef.current
    const wasVisible = prevVisibleRef.current
    const finish = () => {
      prevIntroRef.current = introRevealed
      prevVisibleRef.current = isVisible
    }

    if (reduced) {
      tlRef.current?.kill()
      finish()
      return () => tlRef.current?.kill()
    }

    const introChars = collectChars(introPhaseRef.current)
    const ctaChars = collectChars(ctaPhaseRef.current)

    if (!introRevealed) {
      tlRef.current?.kill()
      gsap.set(ctaChars, { opacity: 0, scale: 0.7, y: 6, rotation: 0 })
      gsap.set(introChars, { opacity: 1, scale: 1, y: 0, rotation: 0 })
      finish()
      return () => tlRef.current?.kill()
    }

    const runSwap = wasIntro === false && introRevealed === true

    if (runSwap) {
      tlRef.current?.kill()
      gsap.set(ctaChars, { opacity: 0, scale: 0.7, y: 6, rotation: 0 })
      tlRef.current = gsap
        .timeline({ defaults: { force3D: true } })
        .to(introChars, {
          duration: 0.2,
          scale: 0.7,
          y: 6,
          rotation: 360,
          opacity: 0,
          ease: 'power2.in',
          stagger: { amount: 0.55, from: 'center' },
        })
        .fromTo(
          ctaChars,
          { opacity: 0, scale: 0.7, y: 6, rotation: 0 },
          {
            duration: 0.4,
            opacity: 1,
            scale: 1,
            y: 0,
            rotation: 720,
            ease: 'power3.inOut',
            stagger: { amount: 0.55, from: 'center' },
          },
          '-=0.25',
        )
        .call(() => {
          gsap.set(ctaChars, { rotation: 0 })
          gsap.set(introChars, { opacity: 0, scale: 1, y: 0, rotation: 0 })
        })
      finish()
      return () => tlRef.current?.kill()
    }

    gsap.set(introChars, { opacity: 0, scale: 1, y: 0, rotation: 0 })

    if (wasVisible && !isVisible) {
      tlRef.current?.kill()
      tlRef.current = gsap.timeline({ defaults: { force3D: true } }).to(ctaChars, {
        duration: 0.22,
        scale: 0.65,
        y: 8,
        rotation: 360,
        opacity: 0,
        ease: 'power2.in',
        stagger: { amount: 0.48, from: 'center' },
      })
    } else if (!wasVisible && isVisible) {
      tlRef.current?.kill()
      gsap.set(ctaChars, { opacity: 0, scale: 0.7, y: 6, rotation: 0 })
      tlRef.current = gsap
        .timeline({ defaults: { force3D: true } })
        .to(ctaChars, {
          duration: 0.4,
          opacity: 1,
          scale: 1,
          y: 0,
          rotation: 720,
          ease: 'power3.inOut',
          stagger: { amount: 0.55, from: 'center' },
        })
        .call(() => gsap.set(ctaChars, { rotation: 0 }))
    } else {
      if (isVisible) gsap.set(ctaChars, { opacity: 1, scale: 1, y: 0, rotation: 0 })
      else gsap.set(ctaChars, { opacity: 0, scale: 1, y: 0, rotation: 0 })
    }

    finish()
    return () => tlRef.current?.kill()
  }, [introRevealed, isVisible, reduced])

  useLayoutEffect(() => {
    if (reduced || !introRevealed) {
      prevJokeRef.current = ctaSunJoke
      return
    }
    if (prevJokeRef.current === ctaSunJoke) return
    prevJokeRef.current = ctaSunJoke
    const root = ctaPhaseRef.current
    if (!root) return
    const ctaChars = collectChars(root)
    gsap.killTweensOf(ctaChars)
    gsap.fromTo(
      ctaChars,
      { opacity: 0, scale: 0.72, y: 10, rotation: -14 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        rotation: 0,
        duration: 0.42,
        ease: 'power3.out',
        stagger: { amount: 0.52, from: 'center' },
      },
    )
  }, [ctaSunJoke, introRevealed, reduced])

  const ctaCopy = ctaSunJoke ? HERO_SUN_JOKE : HERO_CTA
  const phasesClass = ['welcome-hero__phases', introRevealed && 'welcome-hero__phases--cta-mode']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={[
        'welcome-hero',
        reduced ? 'welcome-hero--reduced' : '',
        !isVisible && 'welcome-hero--input-off',
        introRevealed && ctaSunJoke && 'welcome-hero--cta-sun-joke',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        '--welcome-glow-ms': `${glowMs}ms`,
        '--welcome-intro-hold-ms': reduced ? `0ms` : `${HERO_INTRO_HOLD_MS}ms`,
      }}
      aria-label={`${HERO_INTRO.accent} ${HERO_INTRO.tailMid} ${HERO_INTRO.tailLast}. ${ctaCopy.accent} ${ctaCopy.tailMid} ${ctaCopy.tailLast}.`}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="welcome-hero__glow" aria-hidden />
      <div className={phasesClass}>
        <div
          ref={introPhaseRef}
          className="welcome-hero__phase welcome-hero__phase--intro"
          aria-hidden={introRevealed}
        >
          <PhaseChars
            accent={HERO_INTRO.accent}
            tailMid={HERO_INTRO.tailMid}
            tailLast={HERO_INTRO.tailLast}
          />
        </div>
        <div
          ref={ctaPhaseRef}
          className="welcome-hero__phase welcome-hero__phase--cta"
          aria-hidden={!introRevealed}
        >
          <PhaseChars
            key={ctaSunJoke ? 'cta-sun' : 'cta-planet'}
            accent={ctaCopy.accent}
            tailMid={ctaCopy.tailMid}
            tailLast={ctaCopy.tailLast}
          />
        </div>
      </div>
    </div>
  )
})
