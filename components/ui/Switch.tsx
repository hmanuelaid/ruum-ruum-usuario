export function Switch({ checked, onToggle, label }: {
  checked: boolean
  onToggle: () => void
  label?: string
}) {
  return (
    <button
      role="switch" aria-checked={checked} aria-label={label}
      onClick={onToggle}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: checked ? 'var(--primary)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 23 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
      }} />
    </button>
  )
}