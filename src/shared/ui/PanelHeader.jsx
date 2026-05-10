import { useAmbientGlowPointer } from '../hooks/useAmbientGlowPointer'

export function PanelHeader({ title, subtitle, actionLabel, onAction }) {
  const onAmbientMove = useAmbientGlowPointer()
  return (
    <div className="planet-panel-head">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <button
        type="button"
        className="planet-panel-back-btn ambient-glow-frame ambient-glow-frame--control"
        onClick={(e) => {
          e.stopPropagation()
          onAction?.()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={onAmbientMove}
      >
        <span className="ambient-glow-frame__inner planet-panel-back-btn__inner">{actionLabel}</span>
      </button>
    </div>
  )
}
