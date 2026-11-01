import { resolveIcon } from './codicons'

/** Codicon decorativo (oculto para lectores de pantalla); si no existe, el genérico. */
function Icon({ name }: { name: string }) {
  return <span className={`codicon codicon-${resolveIcon(name)}`} aria-hidden="true" />
}

export default Icon
