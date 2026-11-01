import { useEffect, useState } from 'react'
import type { ExtensionMessage } from '../../src/messaging/protocol'
import { toLocale, useT } from './i18n'
import { postMessage } from './vscode'

type InitData = Omit<Extract<ExtensionMessage, { type: 'init' }>, 'type'>

// Antes del init, el idioma sale del <html lang> que pone la extensión al generar el HTML.
const initialLocale = toLocale(document.documentElement.lang)

function App() {
  const [init, setInit] = useState<InitData | null>(null)
  const t = useT(init?.locale ?? initialLocale)

  useEffect(() => {
    // Los mensajes de la extensión son de confianza: basta con el tipo.
    const onMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data
      if (message?.type === 'init') {
        setInit({ locale: message.locale, version: message.version })
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

  return (
    <main className="shell" aria-label="DevCommands">
      <h1>DevCommands</h1>
      {init && <p className="version">{t('version', { version: init.version })}</p>}
      <p className="status" role="status" aria-live="polite">
        {init ? t('comingSoon') : t('loading')}
      </p>
    </main>
  )
}

export default App
