import css from '@vscode/codicons/dist/codicon.css?raw'

/** Icono que se muestra cuando el catálogo pide uno que no existe. */
export const FALLBACK_ICON = 'symbol-misc'

/** Nombres de los Codicons disponibles, extraídos del CSS del paquete en el build. */
export const codiconNames: ReadonlySet<string> = new Set(
  [...css.matchAll(/\.codicon-([a-z0-9-]+):before/g)].map((m) => m[1]),
)

export function resolveIcon(name: string): string {
  return codiconNames.has(name) ? name : FALLBACK_ICON
}
