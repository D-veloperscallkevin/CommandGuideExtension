import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { queryWords } from '../../src/catalog/search'
import type { CategorySummary, ExtensionMessage, HistoryItem, ShellId } from '../../src/messaging/protocol'
import CategoryList from './CategoryList'
import CategoryScreen from './CategoryScreen'
import type { CommandListHandle, Copied, Starred } from './CommandList'
import FavoritesScreen from './FavoritesScreen'
import Icon from './Icon'
import { toLocale, useT } from './i18n'
import { initialView, navigate, parseSavedView } from './navigation'
import RecentScreen from './RecentScreen'
import SearchBox from './SearchBox'
import SearchResults, { SEARCH_RESULTS_ID } from './SearchResults'
import { shellClass, shellLabel, splitAroundShell } from './shellLabel'
import { getState, postMessage, setState } from './vscode'

type InitData = Omit<Extract<ExtensionMessage, { type: 'init' }>, 'type'>

// Antes del init, el idioma sale del <html lang> que pone la extensión al generar el HTML.
const initialLocale = toLocale(document.documentElement.lang)

/** Duración de la confirmación de copia (icono ✓ y anuncio). */
const COPIED_MS = 2000

/**
 * Retraso del anuncio de un favorito. El mismo `favorites` cambia el estado pulsado de la estrella
 * y la tarjeta; si el texto de la región viva cambia en ese mismo render, los lectores de pantalla
 * pueden descartar el anuncio. Publicarlo un instante después lo convierte en un cambio aparte.
 */
const STARRED_DELAY_MS = 150

/** El único id que entra o sale entre dos listas de favoritos, o `undefined` si no es un solo cambio. */
function favoriteChange(previous: readonly string[], next: readonly string[]): Omit<Starred, 'seq'> | undefined {
  const added = next.filter((id) => !previous.includes(id))
  const removed = previous.filter((id) => !next.includes(id))
  if (added.length + removed.length !== 1) {
    return undefined
  }
  return added.length === 1 ? { commandId: added[0], added: true } : { commandId: removed[0], added: false }
}

/** Favoritos que existen en el catálogo recibido. */
const favoriteCount = (categories: readonly CategorySummary[], favorites: readonly string[]) =>
  favorites.filter((id) => categories.some((c) => c.commands.some((cmd) => cmd.id === id))).length

function App() {
  const [init, setInit] = useState<InitData | null>(null)
  const [categories, setCategories] = useState<readonly CategorySummary[] | null>(null)
  const [detected, setDetected] = useState<readonly string[]>([])
  // Shell para el que la extensión ha construido los ejemplos; cambia con la terminal activa.
  const [shell, setShell] = useState<ShellId | null>(null)
  // Arranca en la vista guardada (si es válida); al llegar el catálogo se ajusta con 'resolve'.
  const [view, dispatch] = useReducer(navigate, undefined, () => parseSavedView(getState()) ?? initialView)
  const t = useT(init?.locale ?? initialLocale)
  // Confirmación de copia: se muestra COPIED_MS. Cada `copied` lleva un `seq` nuevo, así que
  // copiar otra vez (aunque sea el mismo comando) reinicia el tiempo y se vuelve a anunciar.
  const [copied, setCopied] = useState<Copied | undefined>()
  // Favoritos en orden de marcado; null hasta el primer `favorites` de la extensión.
  const [favorites, setFavorites] = useState<readonly string[] | null>(null)
  // Último cambio de favorito, para anunciarlo. Solo se calcula al comparar con una lista ya
  // recibida: el `favorites` del handshake no anuncia nada.
  const [starred, setStarred] = useState<Starred | undefined>()
  const favoriteIds = useMemo(() => new Set(favorites ?? []), [favorites])
  // Lista anterior, para saber qué cambió al recibir `favorites` (fuera del estado de React).
  const lastFavorites = useRef<readonly string[] | null>(null)
  // Historial, de lo más reciente a lo más antiguo; null hasta el primer `history`.
  const [history, setHistory] = useState<readonly HistoryItem[] | null>(null)

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(undefined), COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (!starred) {
      return
    }
    const timer = setTimeout(() => setStarred(undefined), COPIED_MS)
    return () => clearTimeout(timer)
  }, [starred])

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
          setDetected(message.detected ?? [])
          dispatch({ type: 'resolve', categories: message.categories })
          break
        case 'copied':
          setCopied((previous) => ({
            commandId: message.commandId,
            entryId: message.entryId,
            seq: (previous?.seq ?? 0) + 1,
          }))
          break
        case 'favorites': {
          const previous = lastFavorites.current
          lastFavorites.current = message.commandIds
          const change = previous && favoriteChange(previous, message.commandIds)
          if (change) {
            setTimeout(() => setStarred((last) => ({ ...change, seq: (last?.seq ?? 0) + 1 })), STARRED_DELAY_MS)
          }
          setFavorites(message.commandIds)
          break
        }
        case 'history':
          setHistory(message.entries)
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
  const openFavorites = useCallback(() => dispatch({ type: 'openFavorites' }), [])
  const openRecent = useCallback(() => dispatch({ type: 'openRecent' }), [])
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

  const loading = !categories || !favorites || !history
  let content
  if (loading) {
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
  } else if (view.screen === 'favorites') {
    content = (
      <FavoritesScreen
        categories={categories}
        favorites={favorites}
        favoriteIds={favoriteIds}
        focusCommandId={view.focusCommandId}
        copied={copied}
        starred={starred}
        onBack={back}
        onFocusCommand={focusCommand}
        t={t}
      />
    )
  } else if (view.screen === 'recent') {
    content = (
      <RecentScreen
        categories={categories}
        entries={history}
        favoriteIds={favoriteIds}
        shellName={shell ? shellLabel(shell) : ''}
        focusCommandId={view.focusCommandId}
        copied={copied}
        starred={starred}
        onBack={back}
        onFocusCommand={focusCommand}
        t={t}
      />
    )
  } else if (openCategory) {
    content = (
      <CategoryScreen
        key={openCategory.id}
        category={openCategory}
        focusCommandId={view.screen === 'category' ? view.focusCommandId : undefined}
        copied={copied}
        favoriteIds={favoriteIds}
        starred={starred}
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
            favoriteIds={favoriteIds}
            starred={starred}
            onFocusCommand={focusCommand}
            t={t}
          />
        )}
        {/* Oculta (no desmontada) mientras se busca: al vaciar el campo no roba el foco. */}
        <div hidden={searching}>
          <CategoryList
            categories={categories}
            detected={detected}
            favoritesCount={favoriteCount(categories, favorites)}
            recentCount={history.length}
            focusCategoryId={view.screen === 'categories' ? view.focusCategoryId : undefined}
            onOpen={open}
            onOpenFavorites={openFavorites}
            onOpenRecent={openRecent}
            onFocusCategory={focusCategory}
            t={t}
          />
        </div>
      </>
    )
  }

  return (
    <main className="shell" aria-label="DevCommands">
      {/* Primera fila, en todas las pantallas: a la izquierda el shell de la terminal de destino y a
          la derecha el patrocinio. */}
      <div className="top-bar">
        {/* Siempre montado: así el lector de pantalla anuncia cada cambio de shell sin mover el foco. */}
        <p className="muted shell-indicator" role="status" aria-live="polite">
          {shell ? <ShellIndicator shell={shell} t={t} /> : ''}
        </p>
        {/* No durante la carga (aún sin idioma ni catálogo). Solo pide abrir el patrocinio: la URL
            la decide la extensión. */}
        {!loading && (
          <button
            type="button"
            className="back sponsor"
            aria-label={t('sponsorLabel')}
            title={t('sponsorLabel')}
            onClick={() => postMessage({ type: 'openSponsor' })}
          >
            <Icon name="heart" />
            <span>{t('sponsor')}</span>
          </button>
        )}
      </div>
      {content}
    </main>
  )
}

/** "Terminal: PowerShell", con el nombre del shell en su color. */
function ShellIndicator({ shell, t }: { shell: ShellId; t: ReturnType<typeof useT> }) {
  const { before, after } = splitAroundShell((name) => t('terminalIndicator', { shell: name }))
  return (
    <>
      {before}
      <span className={shellClass(shell)}>{shellLabel(shell)}</span>
      {after}
    </>
  )
}

export default App
