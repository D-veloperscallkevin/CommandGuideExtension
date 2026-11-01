// Diccionario fuente: sus claves definen las de todos los idiomas.
export const en = {
  loading: 'Loading…',
  comingSoon: 'Commands coming soon.',
  version: 'v{version}',
}

export type Messages = Record<keyof typeof en, string>
