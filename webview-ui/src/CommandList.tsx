import { useEffect } from 'react'
import type { CommandSummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'
import RiskBadge from './RiskBadge'
import { useRovingFocus } from './useRovingFocus'
import { postMessage } from './vscode'

interface Props {
  commands: readonly CommandSummary[]
  categoryTitle: string
  /** Comando con foco guardado; si `autoFocus`, lo enfoca al montarse. */
  focusCommandId?: string
  autoFocus: boolean
  onFocusCommand: (commandId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Prefijo de ids del DOM para un comando (los ids del catálogo llevan puntos). */
const domId = (commandId: string) => `cmd-${commandId.replace(/[^A-Za-z0-9_-]/g, '_')}`

/** Texto oculto compartido por todos los botones como descripción accesible. */
const HINT_ID = 'send-to-terminal-hint'

/**
 * Lista de comandos con foco itinerante. Cada comando es un botón que lo escribe en la
 * terminal sin ejecutarlo (la extensión construye el texto; aquí solo viaja el id). Su nombre
 * reúne título, riesgo, descripción y ejemplo.
 */
function CommandList({ commands, categoryTitle, focusCommandId, autoFocus, onFocusCommand, t }: Props) {
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
          return (
            <li key={command.id}>
              <button
                type="button"
                className="command"
                ref={itemRef(index)}
                tabIndex={index === current ? 0 : -1}
                aria-labelledby={labelledBy}
                aria-describedby={HINT_ID}
                title={hint}
                onFocus={() => {
                  setActive(index)
                  onFocusCommand(command.id)
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
            </li>
          )
        })}
      </ul>
      <span id={HINT_ID} hidden>
        {hint}
      </span>
    </>
  )
}

export default CommandList
