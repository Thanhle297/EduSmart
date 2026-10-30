import { useCallback, useRef, useState, type ReactNode } from 'react'
import { DemoContext, type Notice } from './demo-context'
import { createInitialState } from '../mocks/fixtures'
import { applyCommand } from '../mocks/repository'
import type { Command } from '../mocks/types'

const sessionKey = 'edusmart.demo-session'
function readSession() {
  try {
    return (
      sessionStorage.getItem(sessionKey) === 'true' || localStorage.getItem(sessionKey) === 'true'
    )
  } catch {
    return false
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialState)
  const stateRef = useRef(state)
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [authenticated, setAuthenticated] = useState(readSession)
  const [notices, setNotices] = useState<Notice[]>([])
  const notify = useCallback(
    (text: string, tone: Notice['tone'] = 'info') =>
      setNotices((all) => [...all.slice(-2), { id: crypto.randomUUID(), text, tone }]),
    [],
  )
  const dismiss = useCallback(
    (id: string) => setNotices((all) => all.filter((notice) => notice.id !== id)),
    [],
  )
  const mutate = async (command: Command, message = 'Đã cập nhật dữ liệu demo.') => {
    if (locked.current) return false
    locked.current = true
    setBusy(true)
    try {
      await Promise.resolve()
      const next = applyCommand(stateRef.current, command)
      stateRef.current = next
      setState(next)
      notify(message, 'success')
      return true
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể hoàn tất thao tác.', 'error')
      return false
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  const reset = () => {
    const next = createInitialState()
    stateRef.current = next
    setState(next)
    notify('Đã khôi phục bộ dữ liệu demo ban đầu.', 'success')
  }
  return (
    <DemoContext.Provider
      value={{
        state,
        authenticated,
        busy,
        notices,
        notify,
        dismiss,
        mutate,
        reset,
        signIn: (remember) => {
          try {
            sessionStorage.setItem(sessionKey, 'true')
            if (remember) localStorage.setItem(sessionKey, 'true')
            else localStorage.removeItem(sessionKey)
          } catch {
            /* The in-memory demo works when storage is unavailable. */
          }
          setAuthenticated(true)
        },
        signOut: () => {
          try {
            sessionStorage.removeItem(sessionKey)
            localStorage.removeItem(sessionKey)
          } catch {
            /* No real credentials are stored. */
          }
          setAuthenticated(false)
        },
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}
