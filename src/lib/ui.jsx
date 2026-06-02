export function UserAvatar({ username, size = 32 }) {
  const letter = username ? username[0].toUpperCase() : '?'
  const fontSize = Math.round(size * 0.42)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#2a3347',
        color: '#fff',
        fontSize,
        fontWeight: 600,
        fontFamily: 'inherit',
        flexShrink: 0,
        userSelect: 'none',
        lineHeight: 1,
        boxSizing: 'border-box',
      }}
      aria-label={username ?? 'Avatar'}
    >
      {letter}
    </span>
  )
}

export function Spinner() {
  return (
    <svg
      className="btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ width: '1em', height: '1em', flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="10"
      />
    </svg>
  )
}
