import { useEffect, type KeyboardEvent } from 'react'
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

interface Props {
  commands: readonly CommandSummary[]
  categoryTitle: string
  /** Comando con foco guardado; si `autoFocus`, lo enfoca al montarse. */
  focusCommandId?: string
  autoFocus: boolean
  /** Copia que acaba de confirmar la extensión (muestra ✓ y anuncia "Copiado"). */
  copied?: Copied
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
const COPY_SHORTCUT_ARIA = isMac ? 'Meta+C' : 'Control+C'

/** Ctrl+C / Cmd+C sin otros modificadores y sin texto seleccionado (si lo hay, se copia la selección). */
function isCopyShortcut(event: KeyboardEvent): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'c' &&
    window.getSelection()?.isCollapsed !== false
  )
}

const copy = (commandId: string) => postMessage({ type: 'copyToClipboard', commandId })

/**
 * Lista de comandos con foco itinerante. Cada comando es un botón que lo escribe en la
 * terminal sin ejecutarlo; a su lado, un botón secundario (fuera del orden de Tab) lo copia,
 * igual que Ctrl+C. Solo viaja el id: la extensión construye el texto.
 */
function CommandList({ commands, categoryTitle, focusCommandId, autoFocus, copied, onFocusCommand, t }: Props) {
  const initial = Math.max(
    0,
    commands.findIndex((c) => c.id === focusCommandId),
  )
  const { current, setActive, itemRef, focusItem, onKeyDown } = useRovingFocus(commands.length, initial)

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

  return (
    <>
      <ul
        className="item-list"
        role="list"
        aria-label={t('commandsLabel', { category: categoryTitle })}
        onKeyDown={onKeyDown}
      >
        {commands.map((command, index) => {
          const id = domId(command.id)
          const labelledBy = [`${id}-title`, command.risk === 'safe' ? '' : `${id}-risk`, `${id}-desc`, `${id}-example`]
            .filter(Boolean)
            .join(' ')
          const isCopied = command.id === copied?.commandId
          return (
            <li key={command.id} className="command-item">
              <button
                type="button"
                className="command"
                ref={itemRef(index)}
                tabIndex={index === current ? 0 : -1}
                aria-labelledby={labelledBy}
                aria-describedby={HINT_ID}
                aria-keyshortcuts={COPY_SHORTCUT_ARIA}
                title={hint}
                onFocus={() => {
                  setActive(index)
                  onFocusCommand(command.id)
                }}
                onKeyDown={(event) => {
                  if (isCopyShortcut(event)) {
                    event.preventDefault()
                    copy(command.id)
                  }
                }}
                onClick={() => postMessage({ type: 'sendToTerminal', commandId: command.id })}
              >
                <span className="command-header">
                  <span id={`${id}-title`} className="command-title">
                    {command.title}
                  </span>
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
    </>
  )
}

export default CommandList
