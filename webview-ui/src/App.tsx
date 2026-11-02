import { useCallback, useEffect, useReducer, useState } from 'react'
import type { CategorySummary, ExtensionMessage } from '../../src/messaging/protocol'
import CategoryList from './CategoryList'
import CategoryScreen from './CategoryScreen'
import type { Copied } from './CommandList'
import { toLocale, useT } from './i18n'
import { initialView, navigate, parseSavedView } from './navigation'
import { getState, postMessage, setState } from './vscode'

type InitData = Omit<Extract<ExtensionMessage, { type: 'init' }>, 'type'>

// Antes del init, el idioma sale del <html lang> que pone la extensión al generar el HTML.
const initialLocale = toLocale(document.documentElement.lang)

/** Duración de la confirmación de copia (icono ✓ y anuncio). */
const COPIED_MS = 2000

function App() {
  const [init, setInit] = useState<InitData | null>(null)
  const [categories, setCategories] = useState<readonly CategorySummary[] | null>(null)
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

  const openCategory = view.screen === 'category' ? categories?.find((c) => c.id === view.categoryId) : undefined

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
    content = (
      <CategoryList
        categories={categories}
        focusCategoryId={view.screen === 'categories' ? view.focusCategoryId : undefined}
        onOpen={open}
        onFocusCategory={focusCategory}
        t={t}
      />
    )
  }

  return (
    <main className="shell" aria-label="DevCommands">
      {content}
    </main>
  )
}

export default App
