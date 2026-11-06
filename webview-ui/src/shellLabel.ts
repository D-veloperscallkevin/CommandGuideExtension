import type { ShellId } from '../../src/messaging/protocol'

const labels: Readonly<Record<ShellId, string>> = {
  powershell: 'PowerShell',
  bash: 'bash',
  zsh: 'zsh',
  cmd: 'cmd',
}

/** Nombre legible del shell para el indicador. Son nombres propios: no se traducen. */
export function shellLabel(shell: ShellId): string {
  return labels[shell]
}

/** Clase CSS con el color propio de cada shell en el indicador (ver index.css). */
export function shellClass(shell: ShellId): string {
  return `shell-name shell-${shell}`
}

/** Marca que sustituye al nombre del shell para partir el texto traducido a su alrededor. */
const MARK = '\u0000'

/**
 * Parte el texto traducido del indicador en lo que va antes y después del nombre del shell,
 * para pintar solo el nombre con su color. `format` recibe el valor de `{shell}`.
 * Si la traducción no contiene `{shell}`, todo el texto queda en `before`.
 */
export function splitAroundShell(format: (shell: string) => string): { before: string; after: string } {
  const text = format(MARK)
  const index = text.indexOf(MARK)
  return index < 0 ? { before: text, after: '' } : { before: text.slice(0, index), after: text.slice(index + MARK.length) }
}
