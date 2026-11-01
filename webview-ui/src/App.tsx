import { useCallback, useEffect, useReducer, useState } from 'react'
import type { CategorySummary, ExtensionMessage } from '../../src/messaging/protocol'
import CategoryList from './CategoryList'
import CategoryScreen from './CategoryScreen'
import { toLocale, useT } from './i18n'
import { initialView, navigate, resolveView } from './navigation'
import { postMessage } from './vscode'

type InitData = Omit<Extract<ExtensionMessage, { type: 'init' }>, 'type'>

// Antes del init, el idioma sale del <html lang> que pone la extensión al generar el HTML.
const initialLocale = toLocale(document.documentElement.lang)

function App() {
  const [init, setInit] = useState<InitData | null>(null)
  const [categories, setCategories] = useState<readonly CategorySummary[] | null>(null)
  const [storedView, dispatch] = useReducer(navigate, initialView)
  const t = useT(init?.locale ?? initialLocale)

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

  const open = useCallback((categoryId: string) => dispatch({ type: 'open', categoryId }), [])
  const back = useCallback(() => dispatch({ type: 'back' }), [])

  const view = categories ? resolveView(storedView, categories.map((c) => c.id)) : storedView
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
    content = <CategoryScreen key={openCategory.id} category={openCategory} onBack={back} t={t} />
  } else {
    content = (
      <CategoryList
        categories={categories}
        focusCategoryId={view.screen === 'categories' ? view.focusCategoryId : undefined}
        onOpen={open}
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
