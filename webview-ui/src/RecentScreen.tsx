import { useEffect, useMemo, useRef, useState } from 'react'
import type { CategorySummary, HistoryItem } from '../../src/messaging/protocol'
import CommandList, { type Copied, type ListCommand, type Starred } from './CommandList'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import { postMessage } from './vscode'

interface Props {
  categories: readonly CategorySummary[]
  /** Historial de lo más reciente a lo más antiguo, con el texto para el shell actual. */
  entries: readonly HistoryItem[]
  favoriteIds: ReadonlySet<string>
  /** Nombre del shell de destino actual, para el aviso de las entradas que pedirán valores. */
  shellName: string
  /** Entrada con foco guardada. Si existe al montarse (restauración), recibe el foco. */
  focusCommandId?: string
  copied?: Copied
  starred?: Starred
  onBack: () => void
  onFocusCommand: (entryId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/**
 * Pantalla de recientes: como la de una categoría, con el texto ya con sus valores y el nombre de
 * la categoría en cada entrada. El orden se fija al abrirla: una entrada reenviada no salta arriba
 * mientras se está en la pantalla, y las nuevas se ven al volver a abrirla. Los textos sí se
 * actualizan (al cambiar el shell) y las entradas borradas desaparecen.
 */
function RecentScreen({
  categories,
  entries,
  favoriteIds,
  shellName,
  focusCommandId,
  copied,
  starred,
  onBack,
  onFocusCommand,
  t,
}: Props) {
  const title = useRef<HTMLHeadingElement>(null)
  const [restoring] = useState(() => focusCommandId !== undefined)
  // Claves de las entradas al abrir la pantalla, en su orden.
  const [opened] = useState(() => entries.map((entry) => entry.id))
  // Se pulsó "Borrar historial": al llegar la lista vacía, el foco va al título.
  const clearing = useRef(false)

  const commands = useMemo<ListCommand[]>(() => {
    const byId = new Map<string, ListCommand>()
    for (const category of categories) {
      for (const command of category.commands) {
        byId.set(command.id, { ...command, categoryTitle: category.title })
      }
    }
    const current = new Map(entries.map((entry) => [entry.id, entry]))
    return opened.flatMap((entryId) => {
      const entry = current.get(entryId)
      const command = entry && byId.get(entry.commandId)
      if (!entry || !command) {
        return []
      }
      const notice = entry.needsInput ? t('needsInput', { shell: shellName }) : undefined
      return [{ ...command, example: entry.text, entryId, notice }]
    })
  }, [categories, entries, opened, shellName, t])

  useEffect(() => {
    if (!restoring) {
      title.current?.focus()
    }
  }, [restoring])

  useEffect(() => {
    if (clearing.current && entries.length === 0) {
      clearing.current = false
      title.current?.focus()
    }
  }, [entries])

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

  const clear = () => {
    clearing.current = true
    postMessage({ type: 'clearHistory' })
  }

  return (
    <section className="category-screen" aria-labelledby="category-screen-title">
      <button type="button" className="back" onClick={onBack}>
        <Icon name="arrow-left" />
        <span>{t('back')}</span>
      </button>
      <h2 id="category-screen-title" ref={title} tabIndex={-1}>
        <Icon name="history" />
        <span>{t('recent')}</span>
      </h2>
      {commands.length === 0 ? (
        <p className="muted">{t('noRecent')}</p>
      ) : (
        <>
          <p className="muted">{t('commandCount', { count: commands.length })}</p>
          <button type="button" className="back clear-history" onClick={clear}>
            <Icon name="clear-all" />
            <span>{t('clearHistory')}</span>
          </button>
          <CommandList
            commands={commands}
            listLabel={t('recentLabel')}
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

export default RecentScreen
