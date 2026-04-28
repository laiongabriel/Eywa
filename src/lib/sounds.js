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

/** Low-level: play one note */
function note(audioCtx, freq, startTime, duration, volume = 0.14, type = 'sine') {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.06)
}

/** Opening a modal — gentle low ascending sweep C3→E3 */
export function playModalOpen() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, now)
    osc.frequency.exponentialRampToValueAtTime(196, now + 0.14)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.10, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.start(now)
    osc.stop(now + 0.30)
  } catch { /* silent fail */ }
}

/** Closing / cancelling a modal — descending sweep E3→C3 */
export function playModalClose() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(196, now)
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.16)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 0.035)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26)
    osc.start(now)
    osc.stop(now + 0.28)
  } catch { /* silent fail */ }
}

/** Task created — low two-note resolution G2→C3 */
export function playTaskCreated() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    note(c, 98.00,  now,       0.55, 0.095)   // G2
    note(c, 130.81, now + 0.14, 0.80, 0.085)  // C3
  } catch { /* silent fail */ }
}

/** Task marked complete — warm G3 + C4 sine chord */
export function playTaskComplete() {
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
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.05)
    }
    // G3 → C4
    tone(196.00, 0,    0.75, 0.085)
    tone(261.63, 0.12, 0.90, 0.068)
  } catch { /* silent fail */ }
}

/** Marking a task as priority — warm mid-low two-note lift, E2→B2 */
export function playPriorityMark() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    // E2 (82 Hz) — gentle attack, long decay
    note(c, 82.41,  now,        0.85, 0.072, 'sine')
    // B2 (123 Hz) — slightly softer, staggered
    note(c, 123.47, now + 0.10, 0.80, 0.058, 'sine')
    // Soft shimmer at E3 (164 Hz) — keeps it from being too dull
    note(c, 164.81, now + 0.18, 0.55, 0.026, 'triangle')
  } catch { /* silent fail */ }
}

/** Task deleted — descending 220→140 Hz */
export function playTaskDelete() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.085, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.start(now)
    osc.stop(now + 0.30)
  } catch { /* silent fail */ }
}

/** Entering Focus Mode — C3→E3→G3→C4 ascending arpeggio */
export function playFocusEnter() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [130.81, 164.81, 196.00, 261.63]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.12, 0.9, 0.10))
  } catch { /* silent fail */ }
}

/** Pausing — single soft low thud A3 */
export function playPause() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 220.00, c.currentTime, 0.22, 0.09)
  } catch { /* silent fail */ }
}

/** Resuming — two rising low notes */
export function playResume() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 196.00, c.currentTime,       0.2,  0.09)
    note(c, 261.63, c.currentTime + 0.1, 0.35, 0.10)
  } catch { /* silent fail */ }
}

/** Ending a focus session — C2+G2+C3+E3 warm chord resolution */
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
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.055)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.05)
    }
    tone(65.41,  0,    2.2, 0.065)  // C2 deep bass
    tone(98.00,  0.06, 2.0, 0.058)  // G2 fifth
    tone(130.81, 0.12, 1.8, 0.052)  // C3
    tone(164.81, 0.22, 1.5, 0.040)  // E3 major third
  } catch { /* silent fail */ }
}

/** Break suggestion — E3→G3→E3 gentle notice */
export function playBreakSuggestion() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [164.81, 196.00, 164.81]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.25, 1.1, 0.09))
  } catch { /* silent fail */ }
}
