import { useEffect, useId, type ReactNode } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import { FAVORITES_CARD_ID, homeSections, RECENT_CARD_ID } from './navigation'
import { useRovingFocus } from './useRovingFocus'

interface Props {
  categories: readonly CategorySummary[]
  /** Ids de las categorías detectadas en el proyecto; con alguna, la lista se divide en secciones. */
  detected: readonly string[]
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
 * después. Las dos se comportan como una categoría más. Con categorías detectadas en el proyecto,
 * se divide en listas con encabezado ("En este proyecto" y "Todas"), recorridas como una sola.
 */
function CategoryList({
  categories,
  detected,
  favoritesCount,
  recentCount,
  focusCategoryId,
  onOpen,
  onOpenFavorites,
  onOpenRecent,
  onFocusCategory,
  t,
}: Props) {
  const sections = homeSections(categories, detected)
  const toEntry = (c: CategorySummary): Entry => ({
    id: c.id,
    icon: c.icon,
    title: c.title,
    count: c.commands.length,
    open: () => onOpen(c.id),
  })
  const cards: Entry[] = []
  if (recentCount > 0) {
    cards.unshift({
      id: RECENT_CARD_ID,
      icon: 'history',
      title: t('recent'),
      count: recentCount,
      open: onOpenRecent,
    })
  }
  if (favoritesCount > 0) {
    cards.unshift({
      id: FAVORITES_CARD_ID,
      icon: 'star-full',
      title: t('favorites'),
      count: favoritesCount,
      open: onOpenFavorites,
    })
  }
  const detectedEntries = sections.detected.map(toEntry)
  const restEntries = sections.rest.map(toEntry)
  // Una sola lista plana para el foco itinerante: los índices son globales a todas las secciones.
  const entries = [...cards, ...detectedEntries, ...restEntries]
  const detectedHeading = useId()
  const restHeading = useId()
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

  // Si cambia el orden (aparece una tarjeta o cambian las secciones), la parada de Tab sigue en
  // la misma entrada, no en el mismo índice. No mueve el foco del DOM.
  const order = entries.map((e) => e.id).join('\n')
  useEffect(() => {
    setActive(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const item =(category: Entry, index: number) => {
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
  }

  if (detectedEntries.length === 0) {
    return (
      <ul className="item-list" role="list" aria-label={t('categoriesLabel')} onKeyDown={onKeyDown}>
        {entries.map(item)}
      </ul>
    )
  }

  /** Una sección: `first` es el índice global de su primera entrada. */
  const section = (headingId: string, heading: string, list: readonly Entry[], first: number): ReactNode => (
    <>
      <h2 id={headingId} className="section-heading">
        {heading}
      </h2>
      <ul className="item-list" role="list" aria-labelledby={headingId}>
        {list.map((entry, i) => item(entry, first + i))}
      </ul>
    </>
  )

  return (
    <div onKeyDown={onKeyDown}>
      {cards.length > 0 && (
        <ul className="item-list" role="list" aria-label={t('shortcutsLabel')}>
          {cards.map(item)}
        </ul>
      )}
      {section(detectedHeading, t('inThisProject'), detectedEntries, cards.length)}
      {section(restHeading, t('allCategories'), restEntries, cards.length + detectedEntries.length)}
    </div>
  )
}

export default CategoryList
