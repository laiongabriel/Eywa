import { useState, useEffect, useRef, useCallback } from 'react'
import { playBreakSuggestion } from '../lib/sounds'

/**
 * Ultradian rhythm default: ~90 min focus cycle (Kleitman / Lavie)
 * The timer counts up. If estimatedMinutes is provided, it also shows
 * a progress ring against that target; otherwise against 90 min.
 */
const ULTRADIAN_SECONDS = 90 * 60

export function useFocusTimer(estimatedMinutes) {
  const [elapsed, setElapsed] = useState(0)    // seconds
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef(null)
  const breakFiredRef = useRef(false)

  const target = estimatedMinutes ? estimatedMinutes * 60 : ULTRADIAN_SECONDS

  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setElapsed(s => {
        const next = s + 1
        // Fire break suggestion exactly once when reaching the ultradian boundary
        if (next === ULTRADIAN_SECONDS && !breakFiredRef.current) {
          breakFiredRef.current = true
          playBreakSuggestion()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [paused])

  const pause  = useCallback(() => setPaused(true),  [])
  const resume = useCallback(() => setPaused(false), [])

  const progress = Math.min(elapsed / target, 1)

  return { elapsed, paused, pause, resume, progress, target }
}

export function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = n => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}
