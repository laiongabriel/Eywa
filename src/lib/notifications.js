/**
 * Browser notification scheduling for Eywa tasks.
 *
 * REQUIRES: Run supabase/migration_reminder.sql in your Supabase SQL editor
 * to add the `reminder_offset_minutes` column to the tasks table.
 *
 * Scheduling is done via setTimeout in the main thread.
 * Notifications are shown through the registered Service Worker so they
 * work even when the app tab is in the background.
 */

// Active timers keyed by task.id (string)
const _timers = new Map()

function _getSwReg() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  return navigator.serviceWorker.ready.catch(() => null)
}

async function _show(task) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const opts = {
    body: task.title,
    tag: `eywa-task-${task.id}`,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    requireInteraction: false,
  }

  const reg = await _getSwReg()
  if (reg) {
    reg.showNotification('Eywa — Lembrete', opts)
  } else {
    new Notification('Eywa — Lembrete', opts)
  }
}

/**
 * Schedule a browser notification for a task.
 * Cancels any existing schedule for the same task first.
 */
export function scheduleTaskNotification(task) {
  cancelTaskNotification(task.id)

  if (task.reminder_offset_minutes == null || !task.scheduled_at || task.completed) return

  const fireAt = new Date(task.scheduled_at).getTime() - task.reminder_offset_minutes * 60_000
  const delay = fireAt - Date.now()

  // Never schedule notifications in the past
  if (delay <= 0) return

  const timerId = setTimeout(() => {
    _timers.delete(task.id)
    _show(task)
  }, delay)

  _timers.set(task.id, timerId)
}

/** Cancel a pending notification for a specific task. */
export function cancelTaskNotification(taskId) {
  const id = _timers.get(taskId)
  if (id != null) {
    clearTimeout(id)
    _timers.delete(taskId)
  }
}

/** Reschedule all pending notifications (call on app load after tasks are fetched). */
export function rescheduleAll(tasks) {
  for (const id of _timers.values()) clearTimeout(id)
  _timers.clear()
  for (const task of tasks) {
    scheduleTaskNotification(task)
  }
}

/** Cancel all scheduled notifications (call on logout). */
export function cancelAllNotifications() {
  for (const id of _timers.values()) clearTimeout(id)
  _timers.clear()
}

/**
 * Request notification permission from the browser.
 * Returns 'granted', 'denied', or 'default'.
 * Must be called from a user gesture.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
