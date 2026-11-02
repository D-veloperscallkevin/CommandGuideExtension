import { useEffect, useRef, useState } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import CommandList from './CommandList'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'

interface Props {
  category: CategorySummary
  /** Comando con foco guardado. Si existe al montarse (restauración), recibe el foco. */
  focusCommandId?: string
  onBack: () => void
  onFocusCommand: (commandId: string) => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Pantalla de una categoría: Atrás, título, número de comandos y la lista de comandos. */
function CategoryScreen({ category, focusCommandId, onBack, onFocusCommand, t }: Props) {
  const title = useRef<HTMLHeadingElement>(null)
  // Se decide al montarse: abrir la categoría enfoca el título; restaurarla, el comando guardado.
  const [restoring] = useState(() => focusCommandId !== undefined)

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
        <Icon name={category.icon} />
        <span>{category.title}</span>
      </h2>
      <p className="muted">{t('commandCount', { count: category.commands.length })}</p>
      <CommandList
        commands={category.commands}
        categoryTitle={category.title}
        focusCommandId={focusCommandId}
        autoFocus={restoring}
        onFocusCommand={onFocusCommand}
        t={t}
      />
    </section>
  )
}

export default CategoryScreen
