import { useEffect, useRef } from 'react'
import type { CategorySummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey, MessageParams } from './i18n'

interface Props {
  category: CategorySummary
  onBack: () => void
  t: (key: MessageKey, params?: MessageParams) => string
}

/** Pantalla provisional de una categoría (la 1.3 añadirá su lista de comandos). */
function CategoryScreen({ category, onBack, t }: Props) {
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    title.current?.focus()
  }, [])

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
      <p className="muted">{t('commandCount', { count: category.commandCount })}</p>
      <p className="muted">{t('categoryPlaceholder')}</p>
    </section>
  )
}

export default CategoryScreen
