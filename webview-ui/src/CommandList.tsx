import { useEffect, useImperativeHandle, type KeyboardEvent, type Ref } from 'react'
import type { CommandSummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import RiskBadge from './RiskBadge'
import { useRovingFocus } from './useRovingFocus'
import { postMessage } from './vscode'

/** Copia confirmada por la extensión. `seq` cambia en cada copia, aunque sea el mismo comando. */
export interface Copied {
  commandId: string
  seq: number
}

/** Favorito alternado y confirmado por la extensión. `seq` cambia en cada cambio. */
export interface Starred {
  commandId: string
  added: boolean
  seq: number
}

/** Comando de la lista; en los resultados de búsqueda lleva el título de su categoría. */
export type ListCommand = CommandSummary & { readonly categoryTitle?: string }

/** Lo que la lista ofrece a quien la contiene (p. ej. el campo de búsqueda). */
export interface CommandListHandle {
  /** Lleva el foco al primer comando. */
  focusFirst: () => void
}

interface Props {
  commands: readonly ListCommand[]
  /** Nombre accesible de la lista. */
  listLabel: string
  /** id del elemento <ul> (para `aria-controls` del campo de búsqueda). */
  listId?: string
  ref?: Ref<CommandListHandle>
  /** Comando con foco guardado; si `autoFocus`, lo enfoca al montarse. */
  focusCommandId?: string
  autoFocus: boolean
  /** Copia que acaba de confirmar la extensión (muestra ✓ y anuncia "Copiado"). */
  copied?: Copied
  /** Ids de los comandos favoritos (estrella rellena y botón pulsado). */
  favoriteIds: ReadonlySet<string>
  /** Último cambio de favorito confirmado por la extensión (anuncio). */
  starred?: Starred
  onFocusCommand: (commandId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Prefijo de ids del DOM para un comando (los ids del catálogo llevan puntos). */
const domId = (commandId: string) => `cmd-${commandId.replace(/[^A-Za-z0-9_-]/g, '_')}`

/** Texto oculto compartido por todos los botones como descripción accesible. */
const HINT_ID = 'send-to-terminal-hint'

// Solo para el texto del atajo; Ctrl+C y Cmd+C funcionan en cualquier sistema.
const isMac = navigator.userAgent.includes('Mac')
const COPY_SHORTCUT_LABEL = isMac ? '⌘C' : 'Ctrl+C'
const FAVORITE_SHORTCUT_LABEL = isMac ? '⌘D' : 'Ctrl+D'
const SHORTCUTS_ARIA = isMac ? 'Meta+C Meta+D' : 'Control+C Control+D'

/** Ctrl/Cmd + `key` sin Alt ni Shift. */
const isModKey = (event: KeyboardEvent, key: string) =>
  (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === key

/** Ctrl+C / Cmd+C sin otros modificadores y sin texto seleccionado (si lo hay, se copia la selección). */
const isCopyShortcut = (event: KeyboardEvent) => isModKey(event, 'c') && window.getSelection()?.isCollapsed !== false

const copy = (commandId: string) => postMessage({ type: 'copyToClipboard', commandId })
const toggleFavorite = (commandId: string) => postMessage({ type: 'toggleFavorite', commandId })

/**
 * Lista de comandos con foco itinerante. Cada comando es un botón que lo escribe en la
 * terminal sin ejecutarlo; a su lado, dos botones secundarios (fuera del orden de Tab) lo marcan
 * como favorito (igual que Ctrl+D) y lo copian (igual que Ctrl+C). Solo viaja el id: la extensión
 * construye el texto y guarda los favoritos.
 */
function CommandList({
  commands,
  listLabel,
  listId,
  ref,
  focusCommandId,
  autoFocus,
  copied,
  favoriteIds,
  starred,
  onFocusCommand,
  t,
}: Props) {
  const initial = Math.max(
    0,
    commands.findIndex((c) => c.id === focusCommandId),
  )
  const { current, setActive, itemRef, focusItem, onKeyDown } = useRovingFocus(commands.length, initial)

  useImperativeHandle(ref, () => ({ focusFirst: () => focusItem(0) }), [focusItem])

  useEffect(() => {
    if (autoFocus) {
      focusItem(initial)
    }
    // Solo al montarse (restauración del estado guardado).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hint = t('sendToTerminalHint')
  const copyLabel = t('copyCommand')
  const copiedLabel = t('copied')
  const favoriteLabel = t('favorite')

  return (
    <>
      <ul
        className="item-list"
        id={listId}
        role="list"
        aria-label={listLabel}
        onKeyDown={onKeyDown}
      >
        {commands.map((command, index) => {
          const id = domId(command.id)
          const labelledBy = [
            `${id}-title`,
            command.categoryTitle === undefined ? '' : `${id}-category`,
            command.risk === 'safe' ? '' : `${id}-risk`,
            `${id}-desc`,
            `${id}-example`,
          ]
            .filter(Boolean)
            .join(' ')
          const isCopied = command.id === copied?.commandId
          const isFavorite = favoriteIds.has(command.id)
          return (
            <li key={command.id} className="command-item">
              <button
                type="button"
                className="command"
                ref={itemRef(index)}
                tabIndex={index === current ? 0 : -1}
                aria-labelledby={labelledBy}
                aria-describedby={HINT_ID}
                aria-keyshortcuts={SHORTCUTS_ARIA}
                title={hint}
                onFocus={() => {
                  setActive(index)
                  onFocusCommand(command.id)
                }}
                onKeyDown={(event) => {
                  if (isCopyShortcut(event)) {
                    event.preventDefault()
                    copy(command.id)
                  } else if (isModKey(event, 'd')) {
                    event.preventDefault()
                    toggleFavorite(command.id)
                  }
                }}
                onClick={() => postMessage({ type: 'sendToTerminal', commandId: command.id })}
              >
                <span className="command-header">
                  <span id={`${id}-title`} className="command-title">
                    {command.title}
                  </span>
                  {command.categoryTitle !== undefined && (
                    <span id={`${id}-category`} className="command-category">
                      {command.categoryTitle}
                    </span>
                  )}
                  <RiskBadge risk={command.risk} id={`${id}-risk`} t={t} />
                  <span className="command-send">
                    <Icon name="terminal" />
                  </span>
                </span>
                <span id={`${id}-desc`} className="command-description">
                  {command.description}
                </span>
                <code id={`${id}-example`} className="command-example">
                  {command.example}
                </code>
              </button>
              <button
                type="button"
                className={isFavorite ? 'command-star favorite' : 'command-star'}
                tabIndex={-1}
                aria-label={favoriteLabel}
                aria-pressed={isFavorite}
                title={`${favoriteLabel} (${FAVORITE_SHORTCUT_LABEL})`}
                // Como el de copiar: el clic no mueve el foco.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleFavorite(command.id)}
              >
                <Icon name={isFavorite ? 'star-full' : 'star-empty'} />
              </button>
              <button
                type="button"
                className={isCopied ? 'command-copy copied' : 'command-copy'}
                tabIndex={-1}
                aria-label={copyLabel}
                title={`${copyLabel} (${COPY_SHORTCUT_LABEL})`}
                // El clic no mueve el foco: este botón está fuera del orden de Tab, y un cambio de
                // foco haría que el lector de pantalla leyera el comando entero en vez de "Copiado".
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => copy(command.id)}
              >
                <Icon name={isCopied ? 'check' : 'copy'} />
              </button>
            </li>
          )
        })}
      </ul>
      <span id={HINT_ID} hidden>
        {hint}
      </span>
      {/* Siempre en el DOM para que el cambio se anuncie; el key por copia hace que se repita. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {copied && <span key={copied.seq}>{copiedLabel}</span>}
      </span>
      <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {starred && <span key={starred.seq}>{t(starred.added ? 'addedToFavorites' : 'removedFromFavorites')}</span>}
      </span>
    </>
  )
}

export default CommandList
