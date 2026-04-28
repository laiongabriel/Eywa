/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const addToast = useCallback((message, type = 'error') => {
    const id = ++counter.current
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={{ toasts, addToast, dismiss }}>
      {children}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
