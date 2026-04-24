/** Web Audio API sound effects — no external files needed */

function ctx() {
  if (typeof window === 'undefined') return null
  if (!window.__eywaAudioCtx) {
    try {
      window.__eywaAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  return window.__eywaAudioCtx
}

/** Low-level: play one note with configurable shape */
function note(audioCtx, freq, startTime, duration, volume = 0.16, type = 'sine') {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

/**
 * Played when opening the add-task modal.
 * Quick ascending 3-note arpeggio: C4→E4→G4 — bright, inviting.
 */
export function playModalOpen() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [261.63, 329.63, 392.00]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.07, 0.32, 0.14, 'triangle'))
  } catch { /* silent fail */ }
}

/**
 * Played when closing/cancelling the modal.
 * Descending mirror of modal open: G4→E4→C4 — deflating, dismissive.
 */
export function playModalClose() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [392.00, 329.63, 261.63]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.065, 0.28, 0.11, 'triangle'))
  } catch { /* silent fail */ }
}

/**
 * Played when a new task is created (saved).
 * Two-note punch G4→C5 — satisfying confirmation.
 */
export function playTaskCreated() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    note(c, 392.00, now,       0.22, 0.13, 'sine')
    note(c, 523.25, now + 0.1, 0.38, 0.17, 'sine')
  } catch { /* silent fail */ }
}

/**
 * Played when a task is marked complete.
 * Quick rising D4→A4 — light, airy check.
 */
export function playTaskComplete() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    note(c, 293.66, now,       0.28, 0.13, 'sine')
    note(c, 440.00, now + 0.1, 0.45, 0.16, 'sine')
  } catch { /* silent fail */ }
}

/**
 * Played when a task is deleted.
 * Descending A4→E4→C4 — removal, disappearing.
 */
export function playTaskDelete() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [440.00, 329.63, 261.63]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.06, 0.24, 0.10, 'sine'))
  } catch { /* silent fail */ }
}

/**
 * Played when entering Focus Mode — C3→G3→C4→E4 ascent.
 * Wider range, deliberate and grounding.
 */
export function playFocusEnter() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [130.81, 196.00, 261.63, 329.63]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.13, 0.75, 0.13, 'sine'))
  } catch { /* silent fail */ }
}

/**
 * Played when pausing — single low E3 drop.
 */
export function playPause() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 164.81, c.currentTime, 0.26, 0.12, 'sine')
  } catch { /* silent fail */ }
}

/**
 * Played when resuming — rising E3→B3.
 */
export function playResume() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 164.81, c.currentTime,       0.22, 0.11, 'sine')
    note(c, 246.94, c.currentTime + 0.1, 0.36, 0.13, 'sine')
  } catch { /* silent fail */ }
}

/**
 * Played when ending a focus session — warm C major chord C3+G3+C4+E4.
 */
export function playSessionEnd() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const tone = (freq, delay, dur, vol) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.05)
    }
    tone(130.81, 0,    2.0, 0.11)
    tone(196.00, 0.07, 1.8, 0.10)
    tone(261.63, 0.14, 1.6, 0.09)
    tone(329.63, 0.24, 1.4, 0.08)
  } catch { /* silent fail */ }
}

/**
 * Played when the break suggestion triggers (90min mark).
 * Three gentle D4→F#4→D4 taps.
 */
export function playBreakSuggestion() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [293.66, 369.99, 293.66]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.28, 0.9, 0.12, 'sine'))
  } catch { /* silent fail */ }
}
