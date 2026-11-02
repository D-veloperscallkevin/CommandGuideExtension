import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { queryWords } from '../../src/catalog/search'
import type { CategorySummary, ExtensionMessage, ShellId } from '../../src/messaging/protocol'
import CategoryList from './CategoryList'
import CategoryScreen from './CategoryScreen'
import type { CommandListHandle, Copied } from './CommandList'
import { toLocale, useT } from './i18n'
import { initialView, navigate, parseSavedView } from './navigation'
import SearchBox from './SearchBox'
import SearchResults, { SEARCH_RESULTS_ID } from './SearchResults'
import { shellLabel } from './shellLabel'
import { getState, postMessage, setState } from './vscode'

type InitData = Omit<Extract<ExtensionMessage, { type: 'init' }>, 'type'>

// Antes del init, el idioma sale del <html lang> que pone la extensión al generar el HTML.
const initialLocale = toLocale(document.documentElement.lang)

/** Duración de la confirmación de copia (icono ✓ y anuncio). */
const COPIED_MS = 2000

function App() {
  const [init, setInit] = useState<InitData | null>(null)
  const [categories, setCategories] = useState<readonly CategorySummary[] | null>(null)
  // Shell para el que la extensión ha construido los ejemplos; cambia con la terminal activa.
  const [shell, setShell] = useState<ShellId | null>(null)
  // Arranca en la vista guardada (si es válida); al llegar el catálogo se ajusta con 'resolve'.
  const [view, dispatch] = useReducer(navigate, undefined, () => parseSavedView(getState()) ?? initialView)
  const t = useT(init?.locale ?? initialLocale)
  // Confirmación de copia: se muestra COPIED_MS. Cada `copied` lleva un `seq` nuevo, así que
  // copiar otra vez (aunque sea el mismo comando) reinicia el tiempo y se vuelve a anunciar.
  const [copied, setCopied] = useState<Copied | undefined>()

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(undefined), COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    // Los mensajes de la extensión son de confianza: basta con el tipo.
    const onMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data
      switch (message?.type) {
        case 'init':
          setInit({ locale: message.locale, version: message.version })
          break
        case 'catalog':
          // Cada catalog (también el que llega al cambiar de shell) conserva la vista: los ids no
          // cambian, así que 'resolve' deja pantalla, búsqueda y foco como estaban.
          setShell(message.shell)
          setCategories(message.categories)
          dispatch({ type: 'resolve', categories: message.categories })
          break
        case 'copied':
          setCopied((previous) => ({ commandId: message.commandId, seq: (previous?.seq ?? 0) + 1 }))
          break
      }
    }
    window.addEventListener('message', onMessage)
    postMessage({ type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (init) {
      document.documentElement.lang = init.locale
    }
  }, [init])

  useEffect(() => {
    // Solo con catálogo: durante la carga no se sobrescribe la vista guardada.
    if (categories) {
      setState(view)
    }
  }, [categories, view])

  const open = useCallback((categoryId: string) => dispatch({ type: 'open', categoryId }), [])
  const back = useCallback(() => dispatch({ type: 'back' }), [])
  const focusCategory = useCallback((categoryId: string) => dispatch({ type: 'focusCategory', categoryId }), [])
  const focusCommand = useCallback((commandId: string) => dispatch({ type: 'focusCommand', commandId }), [])
  const searchFor = useCallback((query: string) => dispatch({ type: 'search', query }), [])
  const results = useRef<CommandListHandle>(null)
  const searchInput = useRef<HTMLInputElement>(null)

  const openCategory = view.screen === 'category' ? categories?.find((c) => c.id === view.categoryId) : undefined
  // Hay texto que borrar en el campo de la pantalla inicial (aunque sean solo espacios).
  const clearable = view.screen === 'categories' && (view.query ?? '') !== '' && !!categories?.length

  useEffect(() => {
    if (!clearable) {
      return
    }
    // En window y en captura: Escape vacía la búsqueda con el foco en el campo, en un resultado o
    // en <body>, antes de que nada más lo procese. El foco vuelve al campo (los resultados se
    // desmontan y, si lo tenían, se perdería).
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault()
        searchFor('')
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [clearable, searchFor])

  let content
  if (!categories) {
    content = (
      <p className="muted" role="status" aria-live="polite">
        {t('loading')}
      </p>
    )
  } else if (categories.length === 0) {
    content = (
      <p className="muted" role="status">
        {t('emptyCatalog')}
      </p>
    )
  } else if (openCategory) {
    content = (
      <CategoryScreen
        key={openCategory.id}
        category={openCategory}
        focusCommandId={view.screen === 'category' ? view.focusCommandId : undefined}
        copied={copied}
        onBack={back}
        onFocusCommand={focusCommand}
        t={t}
      />
    )
  } else {
    const query = view.screen === 'categories' ? (view.query ?? '') : ''
    const searching = queryWords(query).length > 0
    content = (
      <>
        <SearchBox
          ref={searchInput}
          value={query}
          onChange={searchFor}
          onArrowDown={() => results.current?.focusFirst()}
          controlsId={searching ? SEARCH_RESULTS_ID : undefined}
          t={t}
        />
        {searching && (
          <SearchResults
            ref={results}
            categories={categories}
            query={query}
            focusCommandId={view.screen === 'categories' ? view.focusCommandId : undefined}
            copied={copied}
            onFocusCommand={focusCommand}
            t={t}
          />
        )}
        {/* Oculta (no desmontada) mientras se busca: al vaciar el campo no roba el foco. */}
        <div hidden={searching}>
          <CategoryList
            categories={categories}
            focusCategoryId={view.screen === 'categories' ? view.focusCategoryId : undefined}
            onOpen={open}
            onFocusCategory={focusCategory}
            t={t}
          />
        </div>
      </>
    )
  }

  return (
    <main className="shell" aria-label="DevCommands">
      {/* Siempre montado: así el lector de pantalla anuncia cada cambio de shell sin mover el foco. */}
      <p className="muted shell-indicator" role="status" aria-live="polite">
        {shell ? t('examplesFor', { shell: shellLabel(shell) }) : ''}
      </p>
      {content}
    </main>
  )
}

export default App
