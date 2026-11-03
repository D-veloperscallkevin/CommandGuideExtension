import { useEffect, useMemo, useRef, useState } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import CommandList, { type Copied, type ListCommand, type Starred } from './CommandList'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'

interface Props {
  categories: readonly CategorySummary[]
  /** Favoritos en orden de marcado, tal como los envía la extensión. */
  favorites: readonly string[]
  favoriteIds: ReadonlySet<string>
  /** Comando con foco guardado. Si existe al montarse (restauración), recibe el foco. */
  focusCommandId?: string
  copied?: Copied
  starred?: Starred
  onBack: () => void
  onFocusCommand: (commandId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/**
 * Pantalla de favoritos: como la de una categoría, con el nombre de la categoría en cada comando.
 * La lista se fija al abrirla: un comando desmarcado aquí sigue (con la estrella vacía) hasta
 * salir, para que el foco no salte y se pueda deshacer; uno marcado después se añade al final.
 */
function FavoritesScreen({
  categories,
  favorites,
  favoriteIds,
  focusCommandId,
  copied,
  starred,
  onBack,
  onFocusCommand,
  t,
}: Props) {
  const title = useRef<HTMLHeadingElement>(null)
  const [restoring] = useState(() => focusCommandId !== undefined)
  // Favoritos al abrir la pantalla; los marcados después se añaden al final.
  const [opened] = useState(() => favorites)
  const shown = useMemo(() => [...opened, ...favorites.filter((id) => !opened.includes(id))], [opened, favorites])

  const commands = useMemo<ListCommand[]>(() => {
    const byId = new Map<string, ListCommand>()
    for (const category of categories) {
      for (const command of category.commands) {
        byId.set(command.id, { ...command, categoryTitle: category.title })
      }
    }
    return shown.flatMap((id) => byId.get(id) ?? [])
  }, [categories, shown])

  useEffect(() => {
    if (!restoring) {
      title.current?.focus()
    }
  }, [restoring])

  useEffect(() => {
    // En window y no en el contenedor: Escape funciona aunque el foco esté en <body>.
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onBack()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onBack])

  return (
    <section className="category-screen" aria-labelledby="category-screen-title">
      <button type="button" className="back" onClick={onBack}>
        <Icon name="arrow-left" />
        <span>{t('back')}</span>
      </button>
      <h2 id="category-screen-title" ref={title} tabIndex={-1}>
        <Icon name="star-full" />
        <span>{t('favorites')}</span>
      </h2>
      {commands.length === 0 ? (
        <p className="muted">{t('noFavorites')}</p>
      ) : (
        <>
          <p className="muted">{t('commandCount', { count: commands.length })}</p>
          <CommandList
            commands={commands}
            listLabel={t('favoritesLabel')}
            focusCommandId={focusCommandId}
            autoFocus={restoring}
            copied={copied}
            favoriteIds={favoriteIds}
            starred={starred}
            onFocusCommand={onFocusCommand}
            t={t}
          />
        </>
      )}
    </section>
  )
}

export default FavoritesScreen
