import type { WebviewMessage } from '../../src/messaging/protocol'
import type { View } from './navigation'

// acquireVsCodeApi() solo puede llamarse una vez por carga del webview.
const api = acquireVsCodeApi<View>()

export function postMessage(message: WebviewMessage): void {
  api.postMessage(message)
}

/** Estado guardado por una carga anterior del webview. Sin validar: usa `parseSavedView`. */
export function getState(): unknown {
  return api.getState()
}

/** Guarda la vista; sobrevive a ocultar la vista y a recargar la ventana. */
export function setState(view: View): void {
  api.setState(view)
}
