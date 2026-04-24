/** Web Audio API sound effects — no external files needed */

function ctx() {
  if (typeof window === 'undefined') return null
  // reuse a single AudioContext to avoid browser limits
  if (!window.__eywaAudioCtx) {
    try {
      window.__eywaAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  return window.__eywaAudioCtx
}

function note(audioCtx, freq, startTime, duration, volume = 0.18, type = 'sine') {
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

/** Played when entering Focus Mode — soft ascending arpeggio */
export function playFocusEnter() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    // C4 E4 G4 C5 — major chord arpeggio
    const freqs = [261.63, 329.63, 392.00, 523.25]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.11, 0.7, 0.14))
  } catch { /* silent fail */ }
}

/** Played when pausing — single soft click */
export function playPause() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 392.00, c.currentTime, 0.25, 0.1)
  } catch { /* silent fail */ }
}

/** Played when resuming — two quick notes */
export function playResume() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    note(c, 392.00, c.currentTime, 0.2, 0.1)
    note(c, 523.25, c.currentTime + 0.1, 0.3, 0.12)
  } catch { /* silent fail */ }
}

/** Played when ending a focus session — warm major chord resolution */
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
    // C major chord gently voiced: C3 bass + G3 + C4 + E4 resolve
    tone(130.81, 0,    1.8, 0.075) // C3 — bass
    tone(196.00, 0.05, 1.6, 0.065) // G3 — fifth
    tone(261.63, 0.1,  1.5, 0.060) // C4 — octave
    tone(329.63, 0.2,  1.3, 0.045) // E4 — major third, final resolve
  } catch { /* silent fail */ }
}

/** Played when a task is marked complete — soft two-note bell chime */
export function playTaskComplete() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const bell = (freq, delay, vol) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.65)
      osc.start(now + delay)
      osc.stop(now + delay + 0.7)
    }
    bell(880.00,  0,    0.062) // A5 — clear bell tone
    bell(1108.73, 0.09, 0.048) // C#6 — major third above, warm chord
  } catch { /* silent fail */ }
}

/** Played when the suggested cycle time is reached (90min) */
export function playBreakSuggestion() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    const freqs = [523.25, 659.25, 523.25]
    freqs.forEach((f, i) => note(c, f, c.currentTime + i * 0.22, 0.9, 0.12))
  } catch { /* silent fail */ }
}
