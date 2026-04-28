import { useEffect, useCallback, useState } from 'react'
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../lib/notifications'

export function useNotifications() {
  const [permission, setPermission] = useState(() => getNotificationPermission())

  // Register service worker once on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const request = useCallback(async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    return result
  }, [])

  return {
    permission,
    supported: isNotificationSupported(),
    request,
  }
}
