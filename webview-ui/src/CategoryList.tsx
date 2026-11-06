import { useEffect, useId, type KeyboardEvent } from 'react'
import type { CategorySummary, SectionId } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import { FAVORITES_CARD_ID, homeSections, PROJECT_SECTION, RECENT_CARD_ID, sectionHeaderId } from './navigation'
import { useRovingFocus } from './useRovingFocus'

interface Props {
  categories: readonly CategorySummary[]
  /** Ids de las categorías detectadas en el proyecto; con alguna, aparece "En este proyecto". */
  detected: readonly string[]
  /** Número de favoritos; con 0 no se muestra la tarjeta "Favoritos". */
  favoritesCount: number
  /** Número de entradas del historial; con 0 no se muestra la tarjeta "Recientes". */
  recentCount: number
  /** Secciones desplegadas (`project` o un `SectionId`). */
  expanded: readonly string[]
  /** Categoría, tarjeta o encabezado que recibe el foco al montarse (al volver o al restaurar). */
  focusCategoryId?: string
  onOpen: (categoryId: string) => void
  onOpenFavorites: () => void
  onOpenRecent: () => void
  onToggleSection: (sectionId: string) => void
  onFocusCategory: (categoryId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Nombre traducido de cada sección del catálogo. */
const sectionTitleKey: Readonly<Record<SectionId, MessageKey>> = {
  languages: 'sectionLanguages',
  vcs: 'sectionVcs',
  frameworks: 'sectionFrameworks',
  databases: 'sectionDatabases',
  infra: 'sectionInfra',
  cloud: 'sectionCloud',
  servers: 'sectionServers',
  quality: 'sectionQuality',
  gamedev: 'sectionGamedev',
  tools: 'sectionTools',
  custom: 'sectionCustom',
}

/** Entrada de la lista itinerante: una tarjeta, el encabezado de una sección o una categoría. */
interface Entry {
  readonly id: string
  readonly kind: 'card' | 'header' | 'category'
  /** Sección a la que pertenece (encabezados y categorías). */
  readonly group?: string
  readonly icon: string
  readonly title: string
  readonly count: number
  readonly open: () => void
}

/** Una sección de la portada: "En este proyecto" o una del catálogo. */
interface Group {
  readonly id: string
  readonly title: string
  readonly categories: readonly CategorySummary[]
}

/**
 * Portada con foco itinerante: una sola parada de Tab, flechas, Inicio y Fin. Arriba, las tarjetas
 * "Favoritos" y "Recientes" (si tienen contenido); después, "En este proyecto" (si hay categorías
 * detectadas) y las secciones del catálogo, cada una con un encabezado que la despliega o pliega.
 * Las tarjetas, los encabezados y las categorías de las secciones desplegadas se recorren como una
 * sola lista. En un encabezado, → despliega y ← pliega; en una categoría, ← vuelve a su encabezado.
 */
function CategoryList({
  categories,
  detected,
  favoritesCount,
  recentCount,
  expanded,
  focusCategoryId,
  onOpen,
  onOpenFavorites,
  onOpenRecent,
  onToggleSection,
  onFocusCategory,
  t,
}: Props) {
  const home = homeSections(categories, detected)
  const groups: Group[] = [
    ...(home.detected.length > 0 ? [{ id: PROJECT_SECTION, title: t('inThisProject'), categories: home.detected }] : []),
    ...home.sections.map((s) => ({ id: s.id, title: t(sectionTitleKey[s.id]), categories: s.categories })),
  ]
  const isExpanded = (group: string) => expanded.includes(group)

  const cards: Entry[] = []
  if (favoritesCount > 0) {
    cards.push({ id: FAVORITES_CARD_ID, kind: 'card', icon: 'star-full', title: t('favorites'), count: favoritesCount, open: onOpenFavorites })
  }
  if (recentCount > 0) {
    cards.push({ id: RECENT_CARD_ID, kind: 'card', icon: 'history', title: t('recent'), count: recentCount, open: onOpenRecent })
  }
  // Una sola lista plana para el foco itinerante: los índices son globales a todas las secciones.
  const entries: Entry[] = [...cards]
  for (const group of groups) {
    entries.push({
      id: sectionHeaderId(group.id),
      kind: 'header',
      group: group.id,
      icon: isExpanded(group.id) ? 'chevron-down' : 'chevron-right',
      title: group.title,
      count: group.categories.length,
      open: () => onToggleSection(group.id),
    })
    if (isExpanded(group.id)) {
      for (const c of group.categories) {
        entries.push({
          id: c.id,
          kind: 'category',
          group: group.id,
          icon: c.icon,
          title: c.title,
          count: c.commands.length,
          open: () => onOpen(c.id),
        })
      }
    }
  }
  const indexOf = (id: string) => entries.findIndex((e) => e.id === id)
  const initial = Math.max(0, focusCategoryId ? indexOf(focusCategoryId) : 0)
  const { current, setActive, itemRef, focusItem, onKeyDown } = useRovingFocus(entries.length, initial)
  const baseId = useId()

  useEffect(() => {
    if (focusCategoryId) {
      focusItem(initial)
    }
    // Solo al montarse: actualizar focusCategoryId al mover el foco no debe volver a enfocar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si cambia el orden (aparece una tarjeta, se despliega una sección…), la parada de Tab sigue en
  // la misma entrada, no en el mismo índice. No mueve el foco del DOM.
  const order = entries.map((e) => e.id).join('\n')
  useEffect(() => {
    setActive(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  /** → y ← según el tipo de entrada; el resto (↑, ↓, Inicio, Fin) lo resuelve el foco itinerante. */
  const onListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const entry = entries[current]
    if (entry?.group !== undefined && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault()
      if (entry.kind === 'header') {
        // El encabezado no cambia de índice al desplegar o plegar su propia sección.
        if (isExpanded(entry.group) === (event.key === 'ArrowLeft')) {
          onToggleSection(entry.group)
        }
      } else if (event.key === 'ArrowLeft') {
        const header = indexOf(sectionHeaderId(entry.group))
        setActive(header)
        focusItem(header)
      }
      return
    }
    onKeyDown(event)
  }

  const button = (entry: Entry, index: number, extra: Record<string, string | boolean> = {}) => {
    const count = entry.kind === 'header' ? t('categoryCount', { count: entry.count }) : t('commandCount', { count: entry.count })
    return (
      <button
        type="button"
        className={entry.kind === 'header' ? 'category section-header' : 'category'}
        ref={itemRef(index)}
        tabIndex={index === current ? 0 : -1}
        aria-label={`${entry.title}, ${count}`}
        onFocus={() => {
          setActive(index)
          onFocusCategory(entry.id)
        }}
        onClick={entry.open}
        {...extra}
      >
        <Icon name={entry.icon} />
        <span className="category-title" id={entry.kind === 'header' ? `${baseId}-${entry.group}-title` : undefined}>
          {entry.title}
        </span>
        <span className="category-count">{count}</span>
      </button>
    )
  }

  let index = 0
  const cardItems = cards.map((card) => <li key={card.id}>{button(card, index++)}</li>)

  return (
    <div role="group" aria-label={t('categoriesLabel')} onKeyDown={onListKeyDown}>
      {cardItems.length > 0 && (
        <ul className="item-list shortcuts" role="list" aria-label={t('shortcutsLabel')}>
          {cardItems}
        </ul>
      )}
      {groups.map((group) => {
        const headerIndex = index++
        const open = isExpanded(group.id)
        const titleId = `${baseId}-${group.id}-title`
        const listId = `${baseId}-${group.id}-list`
        const header = entries[headerIndex]
        return (
          <section key={group.id} className="home-section">
            <h2 className="section-heading">
              {button(header, headerIndex, open ? { 'aria-expanded': true, 'aria-controls': listId } : { 'aria-expanded': false })}
            </h2>
            {open && (
              <ul id={listId} className="item-list" role="list" aria-labelledby={titleId}>
                {group.categories.map((c) => {
                  const i = index++
                  return <li key={c.id}>{button(entries[i], i)}</li>
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

export default CategoryList
