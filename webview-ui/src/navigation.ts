// Navegación del webview: lógica pura (sin React ni DOM) para poder testearla con Vitest.

/** Pantalla visible. En la lista, `focusCategoryId` indica a qué categoría devolver el foco. */
export type View =
  | { readonly screen: 'categories'; readonly focusCategoryId?: string }
  | { readonly screen: 'category'; readonly categoryId: string }

export type NavigationAction = { readonly type: 'open'; readonly categoryId: string } | { readonly type: 'back' }

export const initialView: View = { screen: 'categories' }

export function navigate(view: View, action: NavigationAction): View {
  switch (action.type) {
    case 'open':
      return { screen: 'category', categoryId: action.categoryId }
    case 'back':
      return view.screen === 'category' ? { screen: 'categories', focusCategoryId: view.categoryId } : view
  }
}

/** Si la categoría abierta ya no está en el catálogo, vuelve a la lista. */
export function resolveView(view: View, categoryIds: readonly string[]): View {
  return view.screen === 'category' && !categoryIds.includes(view.categoryId) ? initialView : view
}

/**
 * Índice que recibe el foco en la lista tras pulsar `key`, o `undefined` si la tecla no
 * mueve el foco. Sin vuelta al llegar a los extremos, como las listas de VS Code.
 */
export function nextIndex(current: number, key: string, length: number): number | undefined {
  if (length === 0) {
    return undefined
  }
  switch (key) {
    case 'ArrowDown':
      return Math.min(current + 1, length - 1)
    case 'ArrowUp':
      return Math.max(current - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return undefined
  }
}
