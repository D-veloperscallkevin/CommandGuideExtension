import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import { nextIndex } from './navigation'

interface Props {
  categories: readonly CategorySummary[]
  /** Categoría que recibe el foco al montarse (al volver de su pantalla). */
  focusCategoryId?: string
  onOpen: (categoryId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Lista de categorías con foco itinerante: una sola parada de Tab, flechas, Inicio y Fin. */
function CategoryList({ categories, focusCategoryId, onOpen, t }: Props) {
  const initial = Math.max(
    0,
    categories.findIndex((c) => c.id === focusCategoryId),
  )
  const [active, setActive] = useState(initial)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const current = Math.min(active, categories.length - 1)

  useEffect(() => {
    if (focusCategoryId) {
      buttons.current[initial]?.focus()
    }
    // Solo al montarse: el foco vuelve a la categoría de la que se salió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const next = nextIndex(current, event.key, categories.length)
    if (next === undefined) {
      return
    }
    event.preventDefault()
    setActive(next)
    buttons.current[next]?.focus()
  }

  return (
    <ul className="category-list" role="list" aria-label={t('categoriesLabel')} onKeyDown={onKeyDown}>
      {categories.map((category, index) => {
        const count = t('commandCount', { count: category.commandCount })
        return (
          <li key={category.id}>
            <button
              type="button"
              className="category"
              ref={(element) => {
                buttons.current[index] = element
              }}
              tabIndex={index === current ? 0 : -1}
              aria-label={`${category.title}, ${count}`}
              onFocus={() => setActive(index)}
              onClick={() => onOpen(category.id)}
            >
              <Icon name={category.icon} />
              <span className="category-title">{category.title}</span>
              <span className="category-count">{count}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default CategoryList
