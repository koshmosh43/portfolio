import { useId } from 'react'

/** Masked ring + stroke-dash “draw” — jh3yy-style; accents aligned with intro pen (mint / magenta / blue). */
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
        <radialGradient id={ga} cx="0" cy="24" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff6ef7" />
          <stop offset="1" stopColor="#ff6ef7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gb} cx="24" cy="24" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c8ffd8" />
          <stop offset="1" stopColor="#c8ffd8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gc} cx="12" cy="0" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5eadff" />
          <stop offset="1" stopColor="#5eadff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gd} cx="12" cy="12" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e8fff0" />
          <stop offset="1" stopColor="#e8fff0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ge} cx="0" cy="0" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c2e22" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1c2e22" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gf} cx="24" cy="0" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffc090" />
          <stop offset="0.45" stopColor="#7ec4ff" />
          <stop offset="1" stopColor="#7ec4ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gTrack} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7bc49a" stopOpacity="0" />
          <stop offset="0.32" stopColor="#e8a070" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#8ed4b8" stopOpacity="0.34" />
          <stop offset="0.68" stopColor="#5eadff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#7bc49a" stopOpacity="0" />
        </linearGradient>
        {/* Arc tail: transparent ends so curtain bg shows through the stroke */}
        <linearGradient id={gArc} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c8ffd8" stopOpacity="0" />
          <stop offset="0.18" stopColor="#a8e8c4" stopOpacity="0.1" />
          <stop offset="0.38" stopColor="#7ec4ff" stopOpacity="0.45" />
          <stop offset="0.48" stopColor="#ffb090" stopOpacity="0.28" />
          <stop offset="0.52" stopColor="#c8ffd8" stopOpacity="0.42" />
          <stop offset="0.68" stopColor="#5eadff" stopOpacity="0.24" />
          <stop offset="0.88" stopColor="#9ee8d0" stopOpacity="0.06" />
          <stop offset="1" stopColor="#c8ffd8" stopOpacity="0" />
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
        <g mask={`url(#${mid})`}>
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
          pathLength="1.05"
        />
      </g>
    </svg>
  )
}
