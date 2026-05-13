/**
 * Intro mesh underlay — violet · teal only (aligned with :root --pf-a / --pf-b).
 */
export function GalaxyIntroBackdrop({ reducedMotion }) {
  const pan = !reducedMotion

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d16] via-[#080f18] to-[#060a12]" />
      <div className="absolute inset-x-0 top-0 h-[min(38vh,320px)] bg-[radial-gradient(ellipse_72%_100%_at_50%_0%,rgba(180,75,255,0.42)_0%,rgba(11,133,119,0.14)_40%,transparent_72%)] mix-blend-screen opacity-[0.9]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_128%_98%_at_50%_48%,transparent_10%,rgba(6,10,18,0.94)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-[radial-gradient(ellipse_120%_92%_at_50%_100%,rgba(11,133,119,0.38)_0%,rgba(180,75,255,0.14)_38%,rgba(8,14,22,0.55)_62%,transparent_74%)] mix-blend-screen opacity-95" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-[radial-gradient(ellipse_95%_70%_at_50%_100%,rgba(11,133,119,0.22)_0%,transparent_62%)] mix-blend-soft-light opacity-90" />
      <div className="absolute inset-0 mix-blend-screen opacity-[0.9] bg-[radial-gradient(ellipse_74%_64%_at_20%_36%,rgba(180,75,255,0.28)_0%,rgba(11,133,119,0.2)_46%,transparent_62%)]" />
      <div className="absolute inset-0 mix-blend-screen opacity-[0.88] bg-[radial-gradient(ellipse_80%_74%_at_84%_26%,rgba(11,133,119,0.26)_0%,rgba(180,75,255,0.16)_42%,transparent_58%)]" />
      <div className="absolute inset-0 mix-blend-soft-light opacity-[0.88] bg-[radial-gradient(ellipse_90%_82%_at_56%_66%,rgba(180,75,255,0.16)_0%,rgba(11,133,119,0.12)_48%,transparent_66%)]" />
      <div className="absolute inset-0 mix-blend-screen opacity-80 bg-[radial-gradient(ellipse_60%_54%_at_6%_76%,rgba(11,133,119,0.26)_0%,transparent_56%)]" />
      <div className="absolute inset-0 mix-blend-screen opacity-85 bg-[radial-gradient(ellipse_64%_60%_at_94%_80%,rgba(180,75,255,0.22)_0%,rgba(11,133,119,0.12)_48%,transparent_54%)]" />
      <div
        className={[
          'absolute inset-0 mix-blend-screen opacity-[0.9]',
          'bg-[radial-gradient(ellipse_70%_58%_at_44%_40%,rgba(11,133,119,0.22)_0%,transparent_55%),radial-gradient(ellipse_64%_54%_at_80%_56%,rgba(180,75,255,0.16)_0%,transparent_52%),radial-gradient(ellipse_60%_52%_at_16%_60%,rgba(180,75,255,0.14)_0%,transparent_50%),radial-gradient(ellipse_55%_48%_at_48%_88%,rgba(11,133,119,0.18)_0%,transparent_55%)]',
          'bg-[length:140%_140%] bg-[position:34%_40%]',
          pan ? 'galaxy-intro-tw-aurora' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  )
}
