import { createContext, useContext } from 'react'
import type { Command, DemoState } from '../mocks/types'

export interface Notice {
  id: string
  text: string
  tone: 'success' | 'error' | 'info'
}
export interface DemoContextValue {
  state: DemoState
  authenticated: boolean
  busy: boolean
  notices: Notice[]
  signIn: (remember: boolean) => void
  signOut: () => void
  mutate: (command: Command, message?: string) => Promise<boolean>
  notify: (text: string, tone?: Notice['tone']) => void
  dismiss: (id: string) => void
  reset: () => void
}
export const DemoContext = createContext<DemoContextValue | null>(null)
export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('DemoProvider is required')
  return context
}
