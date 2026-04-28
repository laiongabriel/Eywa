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
  gain.gain.setTargetAtTime(volume, startTime, 0.02)
  gain.gain.setTargetAtTime(0, startTime + duration * 0.7, duration * 0.15)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.01)
}

/** Opening a modal — G2 bass ground + ascending sweep C3→E3 */
export function playModalOpen() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    // Warm grounding bass
    note(c, 98.00, now, 0.40, 0.048)
    // Ascending sweep starts slightly after, C3 → E3
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, now + 0.04)
    osc.frequency.exponentialRampToValueAtTime(196, now + 0.20)
    gain.gain.setValueAtTime(0, now + 0.04)
    gain.gain.setTargetAtTime(0.088, now + 0.04, 0.02)
    gain.gain.setTargetAtTime(0, now + 0.25, 0.045)
    osc.start(now + 0.04)
    osc.stop(now + 0.35)
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
    gain.gain.setTargetAtTime(0.09, now, 0.02)
    gain.gain.setTargetAtTime(0, now + 0.182, 0.039)
    osc.start(now)
    osc.stop(now + 0.27)
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

/** Task marked complete — G2+G3 chord resolving to C4 */
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
      gain.gain.setTargetAtTime(vol, now + delay, 0.02)
      gain.gain.setTargetAtTime(0, now + delay + dur * 0.7, dur * 0.15)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.01)
    }
    tone(98.00,  0,    0.80, 0.050)  // G2 — deep bass anchor
    tone(196.00, 0,    0.80, 0.078)  // G3 — main
    tone(261.63, 0.14, 0.95, 0.060)  // C4 — resolution
  } catch { /* silent fail */ }
}

/** Marking as priority — G2+D3 chord (bell attack) + G3 resolve.
 *  Bell envelope (0.008s attack) = instantly distinct from all other sounds. */
export function playPriorityMark() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const bell = (freq, startTime, duration, volume) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.setTargetAtTime(volume, startTime, 0.02)
      gain.gain.setTargetAtTime(0, startTime + duration * 0.7, duration * 0.15)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.01)
    }
    bell(98.00,  now,        1.10, 0.078)  // G2 — simultaneous
    bell(146.83, now,        1.30, 0.062)  // D3 — simultaneous (perfect fifth)
    bell(196.00, now + 0.22, 0.85, 0.018)  // G3 — subtle resolve
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
    gain.gain.setTargetAtTime(0.085, now, 0.02)
    gain.gain.setTargetAtTime(0, now + 0.196, 0.042)
    osc.start(now)
    osc.stop(now + 0.29)
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
      gain.gain.setTargetAtTime(vol, now + delay, 0.02)
      gain.gain.setTargetAtTime(0, now + delay + dur * 0.7, dur * 0.15)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.01)
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
