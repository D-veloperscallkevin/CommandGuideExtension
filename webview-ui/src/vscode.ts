import type { WebviewMessage } from '../../src/messaging/protocol'
import type { SavedState } from './navigation'

// acquireVsCodeApi() solo puede llamarse una vez por carga del webview.
const api = acquireVsCodeApi<SavedState>()

export function postMessage(message: WebviewMessage): void {
  api.postMessage(message)
}

/** Estado guardado por una carga anterior del webview. Sin validar: usa `parseSavedState`. */
export function getState(): unknown {
  return api.getState()
}

/** Guarda la vista y las secciones desplegadas; sobrevive a ocultar la vista y a recargar la ventana. */
export function setState(state: SavedState): void {
  api.setState(state)
}
