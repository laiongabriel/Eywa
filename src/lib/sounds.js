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
  gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration + 0.05)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.06)
}

/** Opening a modal — D3 bass ground + ascending sweep G3→D4 */
export function playModalOpen() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    // Warm grounding bass
    note(c, 147.00, now, 0.40, 0.048)
    // Ascending sweep starts slightly after, G3 → D4
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(196, now + 0.04)
    osc.frequency.exponentialRampToValueAtTime(294, now + 0.20)
    gain.gain.setValueAtTime(0, now + 0.04)
    gain.gain.linearRampToValueAtTime(0.088, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34)
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.39)
    osc.start(now + 0.04)
    osc.stop(now + 0.40)
  } catch { /* silent fail */ }
}

/** Closing / cancelling a modal — descending sweep D4→G3 */
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
    osc.frequency.setValueAtTime(294, now)
    osc.frequency.exponentialRampToValueAtTime(196, now + 0.16)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 0.035)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26)
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.31)
    osc.start(now)
    osc.stop(now + 0.32)
  } catch { /* silent fail */ }
}

/** Task created — two-note resolution D3→G3 */
export function playTaskCreated() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    note(c, 147.00, now,        0.55, 0.095)  // D3
    note(c, 196.00, now + 0.14, 0.80, 0.085)  // G3
  } catch { /* silent fail */ }
}

/** Task marked complete — D3+D4 chord resolving to G4 */
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
      gain.gain.exponentialRampToValueAtTime(0.00001, now + delay + dur + 0.05)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.06)
    }
    tone(147.00, 0,    0.80, 0.050)  // D3 — deep bass anchor
    tone(294.00, 0,    0.80, 0.078)  // D4 — main
    tone(392.00, 0.14, 0.95, 0.060)  // G4 — resolution
  } catch { /* silent fail */ }
}

/** Marking as priority — D3+A3 chord (bell attack) + D4 resolve.
 *  Bell envelope = instantly distinct from all other sounds. */
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
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration + 0.05)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.06)
    }
    bell(147.00, now,        1.10, 0.078)  // D3 — simultaneous
    bell(220.00, now,        1.30, 0.062)  // A3 — simultaneous (perfect fifth)
    bell(294.00, now + 0.22, 0.85, 0.018)  // D4 — subtle resolve
  } catch { /* silent fail */ }
}

/** Task deleted — descending 330→210 Hz */
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
    osc.frequency.setValueAtTime(330, now)
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.18)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.085, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.33)
    osc.start(now)
    osc.stop(now + 0.34)
  } catch { /* silent fail */ }
}

/** Entering Focus Mode — G3→B3→D4→G4 ascending arpeggio */
export function playFocusEnter() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [196.00, 247.00, 294.00, 392.00]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.12, 0.9, 0.10))
  } catch { /* silent fail */ }
}

/** Pausing — single soft E4 */
export function playPause() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 330.00, c.currentTime, 0.22, 0.09)
  } catch { /* silent fail */ }
}

/** Resuming — two rising notes D4→G4 */
export function playResume() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 294.00, c.currentTime,       0.2,  0.09)
    note(c, 392.00, c.currentTime + 0.1, 0.35, 0.10)
  } catch { /* silent fail */ }
}

/** Ending a focus session — G2+D3+G3+B3 warm chord resolution */
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
      gain.gain.exponentialRampToValueAtTime(0.00001, now + delay + dur + 0.05)
      osc.start(now + delay)
      osc.stop(now + delay + dur + 0.06)
    }
    tone(98.00,  0,    2.2, 0.065)  // G2 deep bass
    tone(147.00, 0.06, 2.0, 0.058)  // D3 fifth
    tone(196.00, 0.12, 1.8, 0.052)  // G3
    tone(247.00, 0.22, 1.5, 0.040)  // B3 major third
  } catch { /* silent fail */ }
}

/** Break suggestion — B3→D4→B3 gentle notice */
export function playBreakSuggestion() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [247.00, 294.00, 247.00]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.25, 1.1, 0.09))
  } catch { /* silent fail */ }
}
