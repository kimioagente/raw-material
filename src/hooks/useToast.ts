import * as React from 'react'
import type { ToastProps } from '@/components/ui/toast'

type ToastInput = Pick<ToastProps, 'variant'> & {
  title?: string
  description?: string
  duration?: number
}

interface ToastState extends ToastInput {
  id: string
  open: boolean
}

type Action =
  | { type: 'ADD'; toast: ToastState }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE'; id: string; toast: Partial<ToastState> }

let count = 0
const genId = () => String(++count)

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
let dispatch: React.Dispatch<Action> = () => {}
let state: ToastState[] = []

function reducer(toasts: ToastState[], action: Action): ToastState[] {
  switch (action.type) {
    case 'ADD':
      return [action.toast, ...toasts].slice(0, 3)
    case 'REMOVE':
      return toasts.filter((t) => t.id !== action.id)
    case 'UPDATE':
      return toasts.map((t) => (t.id === action.id ? { ...t, ...action.toast } : t))
  }
}

export function toast(input: ToastInput) {
  const id = genId()
  const duration = input.duration ?? 4000

  dispatch({ type: 'ADD', toast: { ...input, id, open: true } })

  const timeout = setTimeout(() => {
    dispatch({ type: 'REMOVE', id })
    toastTimeouts.delete(id)
  }, duration)
  toastTimeouts.set(id, timeout)

  return id
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>(state)

  React.useEffect(() => {
    dispatch = (action) => {
      state = reducer(state, action)
      setToasts([...state])
    }
    setToasts([...state])
    return () => {
      dispatch = () => {}
    }
  }, [])

  return { toasts }
}
