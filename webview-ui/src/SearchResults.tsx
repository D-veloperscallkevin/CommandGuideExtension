import { useMemo, useState, type Ref } from 'react'
import { search } from '../../src/catalog/search'
import type { CategorySummary } from '../../src/messaging/protocol'
import CommandList, { type CommandListHandle, type Copied, type ListCommand } from './CommandList'
import type { MessageKey, MessageParams } from './i18n'

export const SEARCH_RESULTS_ID = 'search-results'

interface Props {
  categories: readonly CategorySummary[]
  query: string
  /** Resultado con foco guardado. Si existe al montarse (restauración), recibe el foco. */
  focusCommandId?: string
  copied?: Copied
  onFocusCommand: (commandId: string) => void
  ref?: Ref<CommandListHandle>
  t: (key: MessageKey, params?: MessageParams) => string
}

/**
 * Resultados de la búsqueda en todas las categorías: el número de resultados (anunciado en una
 * región viva) y una lista de comandos que se comporta igual que la de una categoría.
 */
function SearchResults({ categories, query, focusCommandId, copied, onFocusCommand, ref, t }: Props) {
  // Se decide al montarse: restaurar la búsqueda enfoca el resultado guardado; escribir, no.
  const [restoring] = useState(() => focusCommandId !== undefined)

  const all = useMemo<ListCommand[]>(
    () => categories.flatMap((c) => c.commands.map((command) => ({ ...command, categoryTitle: c.title }))),
    [categories],
  )
  const results = useMemo(() => search(all, query), [all, query])

  return (
    <>
      <p className="muted" role="status" aria-live="polite">
        {results.length === 0 ? t('noResults') : t('resultCount', { count: results.length })}
      </p>
      {results.length > 0 && (
        <CommandList
          ref={ref}
          listId={SEARCH_RESULTS_ID}
          commands={results}
          listLabel={t('searchResultsLabel')}
          focusCommandId={focusCommandId}
          autoFocus={restoring}
          copied={copied}
          onFocusCommand={onFocusCommand}
          t={t}
        />
      )}
    </>
  )
}

export default SearchResults
