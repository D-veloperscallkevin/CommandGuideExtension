import type { WebviewMessage } from '../../src/messaging/protocol'

// acquireVsCodeApi() solo puede llamarse una vez por carga del webview.
const api = acquireVsCodeApi()

export function postMessage(message: WebviewMessage): void {
  api.postMessage(message)
}
