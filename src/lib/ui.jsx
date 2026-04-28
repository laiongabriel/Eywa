import { useState } from 'react'

export function AvatarImg({ src, alt = '', size = 32, style: extraStyle, className, ready = true }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        ...extraStyle,
      }}
    >
      {(!ready || !loaded) && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: '#1e2535',
            animation: 'shimmer 1.4s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
      )}
      {ready && (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </span>
  )
}

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
        borderRadius: '50%',
        background: '#3b6fd4',
        color: '#fff',
        fontSize,
        fontWeight: 600,
        fontFamily: 'inherit',
        flexShrink: 0,
        userSelect: 'none',
        lineHeight: 1,
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
