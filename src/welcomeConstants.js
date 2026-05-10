/** Hero lines: accent + subtitle split so the last word sits on its own row. */
export const HERO_INTRO = { accent: 'Welcome', tailMid: 'to my', tailLast: 'galaxy' }
export const HERO_CTA = { accent: 'Choose', tailMid: 'your', tailLast: 'planet' }
/** Sun tap easter egg (CTA slot only) */
export const HERO_SUN_JOKE = { accent: 'oops!', tailMid: 'sun is not', tailLast: 'a planet' }
/** Corona tap: joke copy, then back to CTA */
export const SUN_JOKE_DISPLAY_MS = 1500

function phaseLen(phase) {
  return phase.accent.length + phase.tailMid.length + phase.tailLast.length
}

/** Ship emerge: use longest phase length */
export const WELCOME_TOTAL_CHARS = Math.max(
  phaseLen(HERO_INTRO),
  phaseLen(HERO_CTA),
  phaseLen(HERO_SUN_JOKE),
)

/** Static intro copy before glow + CTA swap */
export const HERO_INTRO_HOLD_MS = 2500

/** Central teal/violet glow pass (ms); must match `--welcome-glow-ms` in App.css */
export const HERO_GLOW_MS = 1180

/** Planet panel hero exit wait — align with GSAP stagger-out of CTA chars */
export const HERO_CTA_MOTION_MS = 920

/** After intro curtain: hold intro copy, then swap to CTA */
export const CTA_REVEAL_DELAY_MS = HERO_GLOW_MS + 48
