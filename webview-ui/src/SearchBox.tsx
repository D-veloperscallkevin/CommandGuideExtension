import type { Ref } from 'react'
import type { MessageKey, MessageParams } from './i18n'

interface Props {
  value: string
  onChange: (query: string) => void
  /** Flecha abajo: pasar al primer resultado. */
  onArrowDown: () => void
  /** id de la lista de resultados, si se está mostrando. */
  controlsId?: string
  ref?: Ref<HTMLInputElement>
  t: (key: MessageKey, params?: MessageParams) => string
}

/**
 * Campo de búsqueda de la pantalla inicial. Escape no se maneja aquí sino en App (en window),
 * para que vacíe la búsqueda también con el foco en los resultados.
 */
function SearchBox({ value, onChange, onArrowDown, controlsId, ref, t }: Props) {
  return (
    <div className="search-box">
      <input
        ref={ref}
        type="search"
        className="search-input"
        value={value}
        aria-label={t('searchLabel')}
        aria-controls={controlsId}
        placeholder={t('searchPlaceholder')}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            onArrowDown()
          }
        }}
      />
    </div>
  )
}

export default SearchBox
