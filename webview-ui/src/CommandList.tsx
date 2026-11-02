import { useEffect } from 'react'
import type { CommandSummary } from '../../src/messaging/protocol'
import type { MessageKey, MessageParams } from './i18n'
import RiskBadge from './RiskBadge'
import { useRovingFocus } from './useRovingFocus'

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

/**
 * Lista de comandos con foco itinerante. Cada fila es un grupo enfocable (aún sin acción:
 * enviar a la terminal es el change 1.4) cuyo nombre reúne título, riesgo, descripción y ejemplo.
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

  return (
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
            <div
              className="command"
              role="group"
              ref={itemRef(index)}
              tabIndex={index === current ? 0 : -1}
              aria-labelledby={labelledBy}
              onFocus={() => {
                setActive(index)
                onFocusCommand(command.id)
              }}
            >
              <div className="command-header">
                <span id={`${id}-title`} className="command-title">
                  {command.title}
                </span>
                <RiskBadge risk={command.risk} id={`${id}-risk`} t={t} />
              </div>
              <p id={`${id}-desc`} className="command-description">
                {command.description}
              </p>
              <code id={`${id}-example`} className="command-example">
                {command.example}
              </code>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default CommandList
