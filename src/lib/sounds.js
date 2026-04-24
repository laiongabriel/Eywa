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

/** Low-level: play one sine/triangle note */
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

/** Played when entering Focus Mode — gentle ascending C major arpeggio */
export function playFocusEnter() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    // C3 → E3 → G3 → C4
    const freqs = [130.81, 164.81, 196.00, 261.63]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.12, 0.9, 0.10))
  } catch { /* silent fail */ }
}

/** Played when pausing — single low soft thud */
export function playPause() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 220.00, c.currentTime, 0.22, 0.09)
  } catch { /* silent fail */ }
}

/** Played when resuming — two low rising notes */
export function playResume() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 196.00, c.currentTime, 0.2, 0.09)
    note(c, 261.63, c.currentTime + 0.1, 0.35, 0.10)
  } catch { /* silent fail */ }
}

/** Played when ending a focus session — warm C major chord resolution */
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
    // C2 bass → G2 → C3 → E3 resolve — same low warmth as FocusEnter
    tone(65.41,  0,    2.2, 0.065) // C2 — deep bass
    tone(98.00,  0.06, 2.0, 0.058) // G2 — fifth
    tone(130.81, 0.12, 1.8, 0.052) // C3
    tone(164.81, 0.22, 1.5, 0.040) // E3 — major third resolve
  } catch { /* silent fail */ }
}

/** Played when a task is marked complete — two warm mid-range notes */
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
    // G3 → C4 — low satisfying step up, similar palette to session sounds
    tone(196.00, 0,    0.75, 0.085)
    tone(261.63, 0.12, 0.90, 0.068)
  } catch { /* silent fail */ }
}

/** Played when the suggested cycle time is reached (90min) */
export function playBreakSuggestion() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    // E3 → G3 → E3 — gentle notice
    const freqs = [164.81, 196.00, 164.81]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.25, 1.1, 0.09))
  } catch { /* silent fail */ }
}

/** Played when opening a modal — quick soft whoosh (low freq sweep) */
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
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.12)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.065, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc.start(now)
    osc.stop(now + 0.24)
  } catch { /* silent fail */ }
}

/** Played when deleting a task — single short low descending note */
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
    gain.gain.linearRampToValueAtTime(0.07, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch { /* silent fail */ }
}
