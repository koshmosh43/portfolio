export function PanelHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="planet-panel-head">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
