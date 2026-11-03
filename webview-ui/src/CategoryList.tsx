import { useEffect } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import { FAVORITES_CARD_ID, RECENT_CARD_ID } from './navigation'
import { useRovingFocus } from './useRovingFocus'

interface Props {
  categories: readonly CategorySummary[]
  /** Número de favoritos; con 0 no se muestra la tarjeta "Favoritos". */
  favoritesCount: number
  /** Número de entradas del historial; con 0 no se muestra la tarjeta "Recientes". */
  recentCount: number
  /** Categoría (o el id de una tarjeta) que recibe el foco al montarse (al volver o al restaurar). */
  focusCategoryId?: string
  onOpen: (categoryId: string) => void
  onOpenFavorites: () => void
  onOpenRecent: () => void
  onFocusCategory: (categoryId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Entrada de la lista: la tarjeta de favoritos, la de recientes o una categoría del catálogo. */
interface Entry {
  readonly id: string
  readonly icon: string
  readonly title: string
  readonly count: number
  readonly open: () => void
}

/**
 * Lista de categorías con foco itinerante: una sola parada de Tab, flechas, Inicio y Fin. Si hay
 * favoritos, la tarjeta "Favoritos" va primera; si hay historial, la tarjeta "Recientes" va
 * después. Las dos se comportan como una categoría más.
 */
function CategoryList({
  categories,
  favoritesCount,
  recentCount,
  focusCategoryId,
  onOpen,
  onOpenFavorites,
  onOpenRecent,
  onFocusCategory,
  t,
}: Props) {
  const entries: Entry[] = categories.map((c) => ({
    id: c.id,
    icon: c.icon,
    title: c.title,
    count: c.commands.length,
    open: () => onOpen(c.id),
  }))
  if (recentCount > 0) {
    entries.unshift({
      id: RECENT_CARD_ID,
      icon: 'history',
      title: t('recent'),
      count: recentCount,
      open: onOpenRecent,
    })
  }
  if (favoritesCount > 0) {
    entries.unshift({
      id: FAVORITES_CARD_ID,
      icon: 'star-full',
      title: t('favorites'),
      count: favoritesCount,
      open: onOpenFavorites,
    })
  }
  const initial = Math.max(
    0,
    entries.findIndex((e) => e.id === focusCategoryId),
  )
  const { current, setActive, itemRef, focusItem, onKeyDown } = useRovingFocus(entries.length, initial)

  useEffect(() => {
    if (focusCategoryId) {
      focusItem(initial)
    }
    // Solo al montarse: actualizar focusCategoryId al mover el foco no debe volver a enfocar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ul className="item-list" role="list" aria-label={t('categoriesLabel')} onKeyDown={onKeyDown}>
      {entries.map((category, index) => {
        const count = t('commandCount', { count: category.count })
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
              onClick={category.open}
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
