import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { nextIndex } from './navigation'

/**
 * Foco itinerante para una lista: solo el elemento activo tiene tabIndex 0 (una parada de
 * Tab) y flechas, Inicio y Fin mueven el foco. Los elementos se registran con `itemRef`.
 */
export function useRovingFocus(length: number, initialIndex: number) {
  const [active, setActive] = useState(initialIndex)
  const items = useRef<(HTMLElement | null)[]>([])
  const current = Math.max(0, Math.min(active, length - 1))

  const itemRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      items.current[index] = element
    },
    [],
  )

  const focusItem = useCallback((index: number) => items.current[index]?.focus(), [])

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const next = nextIndex(current, event.key, length)
    if (next === undefined) {
      return
    }
    event.preventDefault()
    setActive(next)
    focusItem(next)
  }

  return { current, setActive, itemRef, focusItem, onKeyDown }
}
