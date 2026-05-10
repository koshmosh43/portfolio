/**
 * Intro mesh underlay — Tailwind utilities only (sizes of parent .galaxy-intro-curtain unchanged).
 */
export function GalaxyIntroBackdrop({ reducedMotion }) {
  const pan = !reducedMotion

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Mint / magenta / blue + ember floor (orange) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#102218] via-[#0f1a22] to-[#241610]" />
      <div className="absolute inset-x-0 top-0 h-[min(38vh,320px)] bg-[radial-gradient(ellipse_72%_100%_at_50%_0%,rgba(255,110,247,0.5)_0%,rgba(255,110,247,0.14)_42%,transparent_72%)] mix-blend-screen opacity-[0.92]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_128%_98%_at_50%_48%,transparent_10%,rgba(14,28,32,0.92)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-[radial-gradient(ellipse_120%_92%_at_50%_100%,rgba(255,150,72,0.48)_0%,rgba(255,110,160,0.16)_32%,rgba(140,100,200,0.28)_55%,transparent_72%)] mix-blend-screen opacity-95" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-[radial-gradient(ellipse_95%_70%_at_50%_100%,rgba(255,176,96,0.35)_0%,transparent_62%)] mix-blend-soft-light opacity-90" />
      <div className="absolute inset-0 mix-blend-screen opacity-[0.92] bg-[radial-gradient(ellipse_74%_64%_at_20%_36%,rgba(255,110,247,0.34)_0%,rgba(200,255,216,0.26)_46%,transparent_62%)]" />
      <div className="absolute inset-0 mix-blend-screen opacity-[0.92] bg-[radial-gradient(ellipse_80%_74%_at_84%_26%,rgba(94,173,255,0.34)_0%,rgba(255,186,120,0.18)_40%,transparent_58%)]" />
      <div className="absolute inset-0 mix-blend-soft-light opacity-[0.9] bg-[radial-gradient(ellipse_90%_82%_at_56%_66%,rgba(255,110,247,0.2)_0%,rgba(94,173,255,0.14)_42%,rgba(255,150,90,0.12)_58%,transparent_66%)]" />
      <div className="absolute inset-0 mix-blend-screen opacity-80 bg-[radial-gradient(ellipse_60%_54%_at_6%_76%,rgba(200,255,216,0.34)_0%,transparent_56%)]" />
      <div className="absolute inset-0 mix-blend-screen opacity-85 bg-[radial-gradient(ellipse_64%_60%_at_94%_80%,rgba(94,173,255,0.28)_0%,rgba(255,160,88,0.14)_48%,transparent_54%)]" />
      <div
        className={[
          'absolute inset-0 mix-blend-screen opacity-[0.92]',
          'bg-[radial-gradient(ellipse_70%_58%_at_44%_40%,rgba(200,255,216,0.28)_0%,transparent_55%),radial-gradient(ellipse_64%_54%_at_80%_56%,rgba(94,173,255,0.18)_0%,transparent_52%),radial-gradient(ellipse_60%_52%_at_16%_60%,rgba(255,110,247,0.18)_0%,transparent_50%),radial-gradient(ellipse_55%_48%_at_48%_88%,rgba(255,150,80,0.2)_0%,transparent_55%)]',
          'bg-[length:140%_140%] bg-[position:34%_40%]',
          pan ? 'galaxy-intro-tw-aurora' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  )
}
