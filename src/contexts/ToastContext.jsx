/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    // Mark as removing to trigger exit animation
    setToasts(p => p.map(t => t.id === id ? { ...t, removing: true } : t))
    // Remove from DOM after animation completes
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320)
  }, [])

  const addToast = useCallback((message, type = 'error') => {
    const id = ++counter.current
    setToasts(p => [...p, { id, message, type, removing: false }])
    // Start exit animation 320ms before total 4000ms lifetime
    setTimeout(() => dismiss(id), 3680)
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{ toasts, addToast, dismiss }}>
      {children}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
