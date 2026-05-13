import { useId } from 'react'

/** Masked ring + stroke-dash "draw" — jh3yy-style; 2-colour system (violet #b44bff / teal #0b8577). */
export function IntroOrbitSvg({ reduced }) {
  const rid = useId().replace(/:/g, '')
  const fid = `intro-${rid}-light`
  const mid = `intro-${rid}-mask`
  const ga = `intro-${rid}-a`
  const gb = `intro-${rid}-b`
  const gc = `intro-${rid}-c`
  const gd = `intro-${rid}-d`
  const ge = `intro-${rid}-e`
  const gf = `intro-${rid}-f`
  const gTrack = `intro-${rid}-track`
  const gArc = `intro-${rid}-arc`

  const glow = !reduced
  return (
    <svg
      className={`galaxy-intro-orbit-svg ${reduced ? 'is-reduced' : ''}`}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      data-glow={glow ? 'true' : 'false'}
      data-animate={reduced ? 'false' : 'true'}
    >
      <defs>
        <filter id={fid} y="-50%" x="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" />
          <feColorMatrix type="saturate" values="3.8" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
        {/* ga: teal glow bottom-left */}
        <radialGradient id={ga} cx="0" cy="24" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0"   stopColor="#0b8577" />
          <stop offset="1"   stopColor="#0b8577" stopOpacity="0" />
        </radialGradient>
        {/* gb: light teal glow bottom-right */}
        <radialGradient id={gb} cx="24" cy="24" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0"   stopColor="#5ef0de" />
          <stop offset="1"   stopColor="#5ef0de" stopOpacity="0" />
        </radialGradient>
        {/* gc: violet glow top-center */}
        <radialGradient id={gc} cx="12" cy="0" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0"   stopColor="#b44bff" />
          <stop offset="1"   stopColor="#b44bff" stopOpacity="0" />
        </radialGradient>
        {/* gd: light violet center fill */}
        <radialGradient id={gd} cx="12" cy="12" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0"   stopColor="#e4d4ff" />
          <stop offset="1"   stopColor="#e4d4ff" stopOpacity="0" />
        </radialGradient>
        {/* ge: dark teal shadow top-left */}
        <radialGradient id={ge} cx="0" cy="0" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0"   stopColor="#061210" stopOpacity="0.55" />
          <stop offset="1"   stopColor="#061210" stopOpacity="0" />
        </radialGradient>
        {/* gf: light teal → violet top-right */}
        <radialGradient id={gf} cx="24" cy="0" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0"    stopColor="#5ef0de" />
          <stop offset="0.45" stopColor="#b44bff" />
          <stop offset="1"    stopColor="#b44bff" stopOpacity="0" />
        </radialGradient>
        {/* track: teal ↔ violet, fades at ends */}
        <linearGradient id={gTrack} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0"    stopColor="#0b8577" stopOpacity="0" />
          <stop offset="0.32" stopColor="#0b8577" stopOpacity="0.22" />
          <stop offset="0.5"  stopColor="#b44bff" stopOpacity="0.34" />
          <stop offset="0.68" stopColor="#b44bff" stopOpacity="0.16" />
          <stop offset="1"    stopColor="#0b8577" stopOpacity="0" />
        </linearGradient>
        {/* arc: ouroboros — transparent tail/head, bright teal peak */}
        <linearGradient id={gArc} x1="2.5" y1="21.5" x2="21.5" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop offset="0"    stopColor="#b44bff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#b44bff" stopOpacity="0" />
          <stop offset="0.26" stopColor="#5ef0de" stopOpacity="0.18" />
          <stop offset="0.38" stopColor="#b44bff" stopOpacity="0.44" />
          <stop offset="0.5"  stopColor="#0b8577" stopOpacity="0.92" />
          <stop offset="0.6"  stopColor="#5ef0de" stopOpacity="0.52" />
          <stop offset="0.72" stopColor="#b44bff" stopOpacity="0.2" />
          <stop offset="0.86" stopColor="#0b8577" stopOpacity="0.05" />
          <stop offset="1"    stopColor="#b44bff" stopOpacity="0" />
        </linearGradient>
        <mask id={mid}>
          <g>
            <circle
              r="8"
              cx="12"
              cy="12"
              fill="none"
              strokeWidth="4"
              stroke="white"
              pathLength="1.025"
            />
          </g>
        </mask>
      </defs>
      <circle
        className="galaxy-intro-orbit-svg__track"
        r="8"
        cx="12"
        cy="12"
        fill="none"
        strokeWidth="4"
        stroke={`url(#${gTrack})`}
      />
      <g className="galaxy-intro-orbit-svg__spin" style={{ filter: glow ? `url(#${fid})` : undefined }}>
        <g className="galaxy-intro-orbit-svg__ring-glow" mask={`url(#${mid})`}>
          <rect fill={`url(#${ga})`} width="24" height="24" />
          <rect fill={`url(#${gb})`} width="24" height="24" />
          <rect fill={`url(#${gc})`} width="24" height="24" />
          <rect fill={`url(#${gd})`} width="24" height="24" />
          <rect fill={`url(#${ge})`} width="24" height="24" />
          <rect fill={`url(#${gf})`} width="24" height="24" />
        </g>
        <circle
          className="galaxy-intro-orbit-svg__arc"
          r="8"
          cx="12"
          cy="12"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke={`url(#${gArc})`}
          pathLength="1"
        />
      </g>
    </svg>
  )
}
