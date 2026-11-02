import type { PluralForms } from './plural'

// Diccionario fuente: sus claves definen las de todos los idiomas. Una clave plural es un
// objeto con las categorías de Intl.PluralRules que necesita cada idioma (siempre "other").
export const en = {
  loading: 'Loading…',
  categoriesLabel: 'Command categories',
  commandCount: { one: '{count} command', other: '{count} commands' },
  emptyCatalog: 'No categories available.',
  back: 'Back',
  commandsLabel: 'Commands in {category}',
  riskCaution: 'Caution',
  riskDestructive: 'Destructive',
  sendToTerminalHint: 'Writes the command in the terminal without running it',
  copyCommand: 'Copy command',
  copied: 'Copied',
  searchLabel: 'Search commands',
  searchPlaceholder: 'Search in all categories',
  searchResultsLabel: 'Search results',
  resultCount: { one: '{count} result', other: '{count} results' },
  noResults: 'No commands match your search.',
  examplesFor: 'Examples for: {shell}',
} satisfies Record<string, string | PluralForms>

export type MessageKey = keyof typeof en

/** Las claves de texto son string en todos los idiomas; las plurales, PluralForms. */
export type Messages = {
  [K in MessageKey]: (typeof en)[K] extends string ? string : PluralForms
}
