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
