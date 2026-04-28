import { useEffect, useRef, useState } from 'react'
import { useFocusTimer, formatElapsed } from '../hooks/useFocusTimer'
import { playFocusEnter, playPause, playResume, playSessionEnd } from '../lib/sounds'
import { useT } from '../hooks/useT'
import { Pause, Play } from 'lucide-react'
import './FocusMode.css'

const RADIUS = 80
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function FocusMode({ task, onEnd }) {
  const { elapsed, paused, pause, resume, progress } = useFocusTimer(task.estimated_minutes)
  const enteredRef = useRef(false)
  const [exiting, setExiting] = useState(false)
  const t = useT()

  // Play entry sound once on mount
  useEffect(() => {
    if (!enteredRef.current) {
      enteredRef.current = true
      playFocusEnter()
    }
    // Lock scroll while in focus mode
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handlePause() {
    pause()
    playPause()
  }

  function handleResume() {
    resume()
    playResume()
  }

  function handleEnd() {
    playSessionEnd()
    setExiting(true)
    setTimeout(onEnd, 400)
  }

  const strokeOffset = CIRCUMFERENCE * (1 - progress)
  const isUltradianReached = elapsed >= 90 * 60
  const formattedTime = formatElapsed(elapsed)

  // Show a "break suggested" banner when the 90-min mark is hit
  const showBreakBanner = isUltradianReached && !task.estimated_minutes

  return (
    <div className={`focus-root ${exiting ? 'exiting' : ''}`}>
      <div className="focus-content">

        {/* Task label */}
        <p className="focus-label">{t('focus.on')}</p>
        <h1 className="focus-task-title">{task.title}</h1>

        {/* Progress ring + timer */}
        <div className="focus-ring-wrapper">
          <svg
            className="focus-ring-svg"
            width={RADIUS * 2 + 20}
            height={RADIUS * 2 + 20}
            viewBox={`0 0 ${RADIUS * 2 + 20} ${RADIUS * 2 + 20}`}
          >
            {/* Background track */}
            <circle
              cx={RADIUS + 10}
              cy={RADIUS + 10}
              r={RADIUS}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="3"
            />
            {/* Progress arc */}
            <circle
              cx={RADIUS + 10}
              cy={RADIUS + 10}
              r={RADIUS}
              fill="none"
              stroke={isUltradianReached ? 'var(--color-amber)' : 'var(--color-blue-mid)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              transform={`rotate(-90 ${RADIUS + 10} ${RADIUS + 10})`}
              className="focus-ring-progress"
            />
          </svg>

          {/* Timer text overlaid on ring */}
          <div className="focus-timer-overlay">
            <span className={`focus-timer ${paused ? 'paused' : ''}`}>{formattedTime}</span>
            {task.estimated_minutes && (
              <span className="focus-target">/ {formatElapsed(task.estimated_minutes * 60)}</span>
            )}
          </div>
        </div>

        {/* Ultradian break banner */}
        {showBreakBanner && (
          <div className="focus-break-banner">
            {t('focus.breakBanner')}
          </div>
        )}

        {/* Cycle hint — only before the mark */}
        {!isUltradianReached && !task.estimated_minutes && (
          <p className="focus-cycle-hint">
            {t('focus.cycleHint')}
          </p>
        )}

        {/* Controls */}
        <div className="focus-controls">
          {paused ? (
            <button className="focus-btn focus-btn-resume" onClick={handleResume}>
              <Play size={14} fill="currentColor" stroke="none" aria-hidden="true" /> {t('focus.resume')}
            </button>
          ) : (
            <button className="focus-btn focus-btn-pause" onClick={handlePause}>
              <Pause size={14} fill="currentColor" stroke="none" aria-hidden="true" /> {t('focus.pause')}
            </button>
          )}
          <button className="focus-btn focus-btn-end" onClick={handleEnd}>
            {t('focus.end')}
          </button>
        </div>
      </div>
    </div>
  )
}
