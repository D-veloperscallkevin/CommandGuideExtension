// Navegación del webview: lógica pura (sin React ni DOM) para poder testearla con Vitest.

/**
 * Pantalla visible y elemento con foco. Es también lo que se guarda con `setState`, así que
 * todos sus campos son JSON simple.
 */
export type View =
  | { readonly screen: 'categories'; readonly focusCategoryId?: string }
  | { readonly screen: 'category'; readonly categoryId: string; readonly focusCommandId?: string }

export type NavigationAction =
  | { readonly type: 'open'; readonly categoryId: string }
  | { readonly type: 'back' }
  | { readonly type: 'focusCategory'; readonly categoryId: string }
  | { readonly type: 'focusCommand'; readonly commandId: string }
  /** Ajusta la vista al catálogo recién recibido (ver `resolveView`). */
  | { readonly type: 'resolve'; readonly categories: readonly CatalogIds[] }

export const initialView: View = { screen: 'categories' }

export function navigate(view: View, action: NavigationAction): View {
  switch (action.type) {
    case 'open':
      return { screen: 'category', categoryId: action.categoryId }
    case 'back':
      return view.screen === 'category' ? { screen: 'categories', focusCategoryId: view.categoryId } : view
    case 'focusCategory':
      return view.screen === 'categories' && view.focusCategoryId !== action.categoryId
        ? { screen: 'categories', focusCategoryId: action.categoryId }
        : view
    case 'focusCommand':
      return view.screen === 'category' && view.focusCommandId !== action.commandId
        ? { ...view, focusCommandId: action.commandId }
        : view
    case 'resolve':
      return resolveView(view, action.categories)
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

/** Comprueba que `value` tenga exactamente las claves `required` más, como mucho, las `optional`, todas string. */
function hasStringFields(value: Record<string, unknown>, required: string[], optional: string[]): boolean {
  const keys = Object.keys(value)
  return (
    required.every((k) => typeof value[k] === 'string') &&
    keys.every((k) => (required.includes(k) || optional.includes(k)) && typeof value[k] === 'string')
  )
}

/**
 * Vista guardada con `setState` (puede venir de otra versión de la extensión). Devuelve
 * `undefined` si no tiene exactamente la forma de `View`.
 */
export function parseSavedView(value: unknown): View | undefined {
  if (!isPlainObject(value)) {
    return undefined
  }
  if (value.screen === 'categories' && hasStringFields(value, ['screen'], ['focusCategoryId'])) {
    return value as View
  }
  if (value.screen === 'category' && hasStringFields(value, ['screen', 'categoryId'], ['focusCommandId'])) {
    return value as View
  }
  return undefined
}

/** Lo mínimo del catálogo que necesita `resolveView`. */
export interface CatalogIds {
  readonly id: string
  readonly commands: readonly { readonly id: string }[]
}

/**
 * Ajusta la vista al catálogo recibido: si la categoría abierta ya no existe, vuelve a la
 * lista; si el elemento con foco ya no existe, quita ese foco.
 */
export function resolveView(view: View, categories: readonly CatalogIds[]): View {
  if (view.screen === 'categories') {
    return view.focusCategoryId !== undefined && !categories.some((c) => c.id === view.focusCategoryId)
      ? initialView
      : view
  }
  const category = categories.find((c) => c.id === view.categoryId)
  if (!category) {
    return initialView
  }
  if (view.focusCommandId !== undefined && !category.commands.some((c) => c.id === view.focusCommandId)) {
    return { screen: 'category', categoryId: view.categoryId }
  }
  return view
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
