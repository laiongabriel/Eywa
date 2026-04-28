import './Skeleton.css'

/**
 * Generic shimmer skeleton block.
 * Use `lines` for multi-line text blocks (last line renders at 60% width).
 */
export default function Skeleton({
  width = '100%',
  height = '14px',
  borderRadius = '6px',
  lines = 1,
  lineGap = '0.45rem',
  lastLineWidth = '60%',
  className = '',
  style = {},
}) {
  if (lines > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: lineGap }} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${className}`}
            style={{
              width: i === lines - 1 ? lastLineWidth : '100%',
              height,
              borderRadius,
              ...style,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  )
}
