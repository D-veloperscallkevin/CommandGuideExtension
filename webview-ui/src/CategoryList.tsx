import { useEffect } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import { useRovingFocus } from './useRovingFocus'

interface Props {
  categories: readonly CategorySummary[]
  /** Categoría que recibe el foco al montarse (al volver de su pantalla o al restaurar). */
  focusCategoryId?: string
  onOpen: (categoryId: string) => void
  onFocusCategory: (categoryId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Lista de categorías con foco itinerante: una sola parada de Tab, flechas, Inicio y Fin. */
function CategoryList({ categories, focusCategoryId, onOpen, onFocusCategory, t }: Props) {
  const initial = Math.max(
    0,
    categories.findIndex((c) => c.id === focusCategoryId),
  )
  const { current, setActive, itemRef, focusItem, onKeyDown } = useRovingFocus(categories.length, initial)

  useEffect(() => {
    if (focusCategoryId) {
      focusItem(initial)
    }
    // Solo al montarse: actualizar focusCategoryId al mover el foco no debe volver a enfocar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ul className="item-list" role="list" aria-label={t('categoriesLabel')} onKeyDown={onKeyDown}>
      {categories.map((category, index) => {
        const count = t('commandCount', { count: category.commands.length })
        return (
          <li key={category.id}>
            <button
              type="button"
              className="category"
              ref={itemRef(index)}
              tabIndex={index === current ? 0 : -1}
              aria-label={`${category.title}, ${count}`}
              onFocus={() => {
                setActive(index)
                onFocusCategory(category.id)
              }}
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
