const listeners = new Set()

let snapshot = {
  active: false,
  visible: false,
  progress: 0,
  targetPath: null,
}

let trickleTimer = null
let hideTimer = null

function emit() {
  listeners.forEach((listener) => listener())
}

function setSnapshot(next) {
  snapshot = next
  emit()
}

function stopTimers() {
  if (trickleTimer) {
    window.clearInterval(trickleTimer)
    trickleTimer = null
  }
  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function getNextProgress(current) {
  if (current < 0.32) return Math.min(current + 0.14, 0.32)
  if (current < 0.58) return Math.min(current + 0.08, 0.58)
  if (current < 0.78) return Math.min(current + 0.035, 0.78)
  return Math.min(current + 0.015, 0.92)
}

export function subscribeRouteProgress(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getRouteProgressSnapshot() {
  return snapshot
}

export function startRouteProgress(targetPath) {
  if (typeof window === 'undefined') return

  stopTimers()
  setSnapshot({
    active: true,
    visible: true,
    progress: Math.max(snapshot.progress, 0.12),
    targetPath,
  })

  trickleTimer = window.setInterval(() => {
    setSnapshot({
      ...snapshot,
      progress: getNextProgress(snapshot.progress),
    })
  }, 160)
}

export function completeRouteProgress() {
  if (typeof window === 'undefined' || !snapshot.visible) return

  stopTimers()
  setSnapshot({
    ...snapshot,
    active: false,
    progress: 1,
  })

  hideTimer = window.setTimeout(() => {
    setSnapshot({
      active: false,
      visible: false,
      progress: 0,
      targetPath: null,
    })
  }, 220)
}

export function resetRouteProgress() {
  if (typeof window === 'undefined') return

  stopTimers()
  setSnapshot({
    active: false,
    visible: false,
    progress: 0,
    targetPath: null,
  })
}